"use server";

import { prisma } from "@/lib/prisma";
import { CommentParentType, ImageParentType } from "@/lib/generated/prisma";
import { commentCreateSchema, type CommentCreateInput } from "@/shared/schemas";
import { imageParentTypeFor } from "@/shared/lib/gateRules";
import {
	assertProjectMember,
	resolveGateProject,
	resolveTicketProject,
} from "@/lib/auth/projectAccess";

/**
 * Resolve the parent's project and require membership. Guards the polymorphic
 * comment/image reads (2026-08-14 ticket deep-link audit): the ticket
 * slide-over calls these, so non-members must not read another project's
 * comments (which include commenter profiles).
 * @param parentType - The polymorphic parent type.
 * @param parentId - The parent row id.
 * @returns `{ ok: true }` when the caller may read the parent.
 */
async function guardParentRead(
	parentType: string,
	parentId: string,
): Promise<{ ok: true } | { ok: false }> {
	if (
		parentType === "TICKET_COMMENT" ||
		parentType === "TICKET" // images whose parent is the ticket itself
	) {
		const projectId = await resolveTicketProject(parentId);
		if (!projectId) return { ok: false };
		const auth = await assertProjectMember(projectId);
		return auth.ok ? { ok: true } : { ok: false };
	}
	if (parentType === "GATE_COMMENT") {
		const projectId = await resolveGateProject(parentId);
		if (!projectId) return { ok: false };
		const auth = await assertProjectMember(projectId);
		return auth.ok ? { ok: true } : { ok: false };
	}
	// PROFILE / ISSUE_STEP parents: no project resolution today — fail
	// closed (no current callers).
	return { ok: false };
}

/**
 * Images attached to a comment parent (membership-guarded).
 * @param parentType
 * @param parentId
 * @returns The result.
 */
export async function selectImagesByParent(
	parentType: ImageParentType,
	parentId: string,
) {
	const guard = await guardParentRead(parentType, parentId);
	if (!guard.ok) return [];
	return prisma.images.findMany({
		where: { parent_type: parentType, parent_id: parentId, is_deleted: false },
	});
}

/**
 * A comment with its images (membership-guarded).
 * @param parentType
 * @param parentId
 * @returns The result.
 */
export async function selectComment(
	parentType: CommentParentType,
	parentId: string,
) {
	const guard = await guardParentRead(parentType, parentId);
	if (!guard.ok) return [];
	// No catch here: a thrown error lets React Query retry (cachePolicy
	// retry: 1) and surface isError instead of silently degrading to [].
	// Scoped to one parent (ticket/gate) — never the whole table.
	// Polymorphic parent_type + parent_id (LOL #43/#44).
	const comments = await prisma.comments.findMany({
		where: {
			parent_type: parentType,
			parent_id: parentId,
			is_deleted: false,
		},
		include: {
			Profile: true,
		},
	});

	if (comments.length === 0) return [];

	const commentIds = comments.map((c) => c.comment_id);

	// Images are polymorphically linked (app-level integrity), so fetch
	// them in one scoped query (bounded by commentIds — never the whole
	// table) and join with a Map. The image parent type follows the
	// comment's parent type (gate comments carry GATE_COMMENT images).
	const images = await prisma.images.findMany({
		where: {
			parent_id: { in: commentIds },
			parent_type: imageParentTypeFor(parentType),
			is_deleted: false,
		},
	});

	const imagesByComment = new Map<string, (typeof images)[number][]>();
	for (const img of images) {
		const list = imagesByComment.get(img.parent_id) ?? [];
		list.push(img);
		imagesByComment.set(img.parent_id, list);
	}

	return comments.map((comment) => ({
		...comment,
		images: imagesByComment.get(comment.comment_id) ?? [],
	}));
}

/**
 * Creates a comment + its images atomically (membership-guarded).
 * @param data
 * @returns The result.
 */
export async function createCommentWithImages(data: CommentCreateInput) {
	commentCreateSchema.parse(data);

	// Authorization: caller must be a member of the parent project.
	// Throwing (not returning an error object) lets useMutation surface
	// isError instead of resolving into onSuccess.
	const projectId =
		data.parent_type === "TICKET_COMMENT"
			? await resolveTicketProject(data.parent_id)
			: await resolveGateProject(data.parent_id);
	if (!projectId) throw new Error("Comment target not found.");
	const auth = await assertProjectMember(projectId);
	if (!auth.ok) throw new Error(auth.error);

	return await prisma.$transaction(async (tx) => {
		const comment = await tx.comments.create({
			data: {
				profile_id: data.profile_id,
				description: data.description,
				parent_type: data.parent_type,
				parent_id: data.parent_id,
			},
		});

		if (data.imageUrls.length > 0) {
			const imageData = data.imageUrls.map((url: string) => ({
				image_src: url,
				parent_id: comment.comment_id,
				// The image parent type follows the comment's parent type.
				parent_type: imageParentTypeFor(data.parent_type),
			}));

			await tx.images.createMany({
				data: imageData,
			});
		}

		// ── Write HistoryEvent for ticket comments ──────────────────────
		// Only TICKET_COMMENT maps to a ticket; GATE_COMMENT parent_id is a gate.
		if (data.parent_type === "TICKET_COMMENT") {
			await tx.historyEvent.create({
				data: {
					action: "COMMENT_ADDED",
					performed_by: data.profile_id,
					ticket_id: data.parent_id,
				},
			});
		}

		return comment;
	});
}
