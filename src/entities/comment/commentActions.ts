"use server";

import { prisma } from "@/lib/prisma";
import { CommentParentType, ImageParentType } from "@/lib/generated/prisma";
import { commentCreateSchema, type CommentCreateInput } from "@/shared/schemas";
import {
	assertProjectMember,
	resolveGateProject,
	resolveTicketProject,
} from "@/lib/auth/projectAccess";
import type { EntityFilterStatus } from "@/entities/types";

export async function selectImagesByParent(
	parentType: ImageParentType,
	parentId: string,
) {
	return prisma.images.findMany({
		where: { parent_type: parentType, parent_id: parentId, is_deleted: false },
	});
}

export async function selectComment(
	parentType: CommentParentType,
	parentId: string,
) {
	try {
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
		// table) and join with a Map.
		const images = await prisma.images.findMany({
			where: {
				parent_id: { in: commentIds },
				parent_type: ImageParentType.TICKET_COMMENT,
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
	} catch (error) {
		console.error("Error fetching comments with images:", error);
		return [];
	}
}

export async function createCommentWithImages(data: CommentCreateInput) {
	commentCreateSchema.parse(data);

	// Authorization: caller must be a member of the parent project
	const projectId =
		data.parent_type === "TICKET_COMMENT"
			? await resolveTicketProject(data.parent_id)
			: await resolveGateProject(data.parent_id);
	if (!projectId) return { success: false, error: "Comment target not found." };
	const auth = await assertProjectMember(projectId);
	if (!auth.ok) return { success: false, error: auth.error };

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
				parent_type: ImageParentType.TICKET_COMMENT,
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
