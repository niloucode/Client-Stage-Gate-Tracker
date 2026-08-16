"use server";

import { prisma } from "@/lib/prisma";
import { z } from "zod";
import {
	assertProjectClient,
	assertProjectMemberOrClient,
	resolveGateProject,
	resolveStageProject,
} from "@/lib/auth/projectAccess";
import {
	allPhasesFinished,
	deriveNextGateNumber,
} from "@/shared/lib/gateRules";
import { gateApprovalDates } from "@/shared/lib/scheduling/stageSchedule";
import { ImageParentType } from "@/lib/generated/prisma";
import type { GateFeedbackEntry } from "./types";

function formatGateDate(date: Date): string {
	return date.toLocaleDateString("en-US", {
		month: "short",
		day: "2-digit",
		year: "numeric",
	});
}

/**
 * All gates of a stage, newest first (spec 9: gates are numbered descending,
 * later gates have larger numbers), each with its approve/decline feedback
 * comment (reviewer + date + attachments) and discussion-comment count.
 * Any project member — including the client — may read; `canDecide` tells
 * the UI whether the caller is the project's client (approve/decline rights).
 */
export async function getStageGates(
	stageId: string,
): Promise<{ gates: GateFeedbackEntry[]; canDecide: boolean }> {
	z.uuid().parse(stageId);

	const projectId = await resolveStageProject(stageId);
	if (!projectId) return { gates: [], canDecide: false };
	const auth = await assertProjectMemberOrClient(projectId);
	if (!auth.ok) throw new Error(auth.error);
	const clientAuth = await assertProjectClient(projectId);
	const canDecide = clientAuth.ok;

	const gates = await prisma.gates.findMany({
		where: { stage_id: stageId },
		orderBy: [{ number: { sort: "desc", nulls: "last" } }],
		select: {
			gate_id: true,
			number: true,
			status: true,
			comment_id: true,
			Comments: {
				include: {
					Profile: { select: { first_name: true, last_name: true } },
				},
			},
		},
	});

	const feedbackCommentIds = gates
		.map((g) => g.Comments?.comment_id)
		.filter((id): id is string => !!id);

	// Feedback attachments + discussion counts in two scoped queries.
	const images = feedbackCommentIds.length
		? await prisma.images.findMany({
				where: {
					parent_type: ImageParentType.GATE_COMMENT,
					parent_id: { in: feedbackCommentIds },
					is_deleted: false,
				},
				select: { parent_id: true, image_src: true },
			})
		: [];
	const imagesByComment = new Map<string, string[]>();
	for (const img of images) {
		const list = imagesByComment.get(img.parent_id) ?? [];
		list.push(img.image_src);
		imagesByComment.set(img.parent_id, list);
	}

	const gateIds = gates.map((g) => g.gate_id);
	const discussionRows = gateIds.length
		? await prisma.comments.findMany({
				where: {
					parent_type: "GATE_COMMENT",
					parent_id: { in: gateIds },
					is_deleted: false,
				},
				select: { parent_id: true, comment_id: true },
			})
		: [];
	const feedbackIdSet = new Set(feedbackCommentIds);
	const discussionCountByGate = new Map<string, number>();
	for (const row of discussionRows) {
		if (feedbackIdSet.has(row.comment_id)) continue; // feedback ≠ discussion
		discussionCountByGate.set(
			row.parent_id,
			(discussionCountByGate.get(row.parent_id) ?? 0) + 1,
		);
	}

	return {
		gates: gates.map((gate) => {
			const comment = gate.Comments;
			const status = gate.status;
			return {
				gateId: gate.gate_id,
				number: gate.number ?? 0,
				status,
				date: comment ? formatGateDate(comment.creation_date) : null,
				reviewer: comment
					? {
							name: `${comment.Profile.first_name} ${comment.Profile.last_name}`,
						}
					: null,
				feedback: comment?.description ?? null,
				variant:
					status === "APPROVED"
						? "approved"
						: status === "REJECTED"
							? "rejected"
							: null,
				images: comment ? (imagesByComment.get(comment.comment_id) ?? []) : [],
				commentCount: comment
					? (discussionCountByGate.get(gate.gate_id) ?? 0)
					: 0,
			};
		}),
		canDecide,
	};
}

/**
 * Client-only gate decision (spec): ONLY the project's client may approve or
 * decline, and only when every phase under the stage is finished. The
 * feedback becomes a GATE_COMMENT on the gate (spec 4-5) and Gates.comment_id
 * points at it. APPROVED → status + stage dates materialized via
 * gateApprovalDates; REJECTED → status + a new PENDING gate with the next
 * number (spec 2).
 */
export async function decideGate(
	gateId: string,
	decision: "APPROVED" | "REJECTED",
	feedback: string,
	imageUrls: string[] = [],
) {
	z.uuid().parse(gateId);
	z.enum(["APPROVED", "REJECTED"]).parse(decision);

	const projectId = await resolveGateProject(gateId);
	if (!projectId) throw new Error("Gate not found.");
	const auth = await assertProjectClient(projectId);
	if (!auth.ok) throw new Error(auth.error);

	return await prisma.$transaction(async (tx) => {
		const gate = await tx.gates.findUnique({
			where: { gate_id: gateId },
			select: { status: true, stage_id: true },
		});
		if (!gate) throw new Error("Gate not found.");
		if (gate.status !== "PENDING") {
			throw new Error("This gate has already been decided.");
		}

		// Approve/Decline only when all phases under the stage are finished.
		const phases = await tx.phases.findMany({
			where: { stage_id: gate.stage_id, is_deleted: false },
			select: { actual_end_at: true },
		});
		if (!allPhasesFinished(phases)) {
			throw new Error(
				"All phases under this stage must be finished before deciding the gate.",
			);
		}

		// The current stage's own number (used for the next-stage lookup —
		// gate numbers and stage numbers are independent sequences).
		// Soft-deleted stages have their number nulled (cascadeSoftDeleteStage),
		// so the fallback would resolve the wrong "next" stage — reject them.
		const stageRow = await tx.stages.findUnique({
			where: { stage_id: gate.stage_id },
			select: { number: true, is_deleted: true },
		});
		if (!stageRow || stageRow.is_deleted) {
			throw new Error("Stage not found.");
		}

		// Spec 4-5: the feedback itself becomes a comment on the gate.
		const comment = await tx.comments.create({
			data: {
				profile_id: auth.userId,
				description: feedback.trim() || "No feedback provided.",
				parent_type: "GATE_COMMENT",
				parent_id: gateId,
			},
		});
		if (imageUrls.length > 0) {
			await tx.images.createMany({
				data: imageUrls.map((url) => ({
					image_src: url,
					parent_type: ImageParentType.GATE_COMMENT,
					parent_id: comment.comment_id,
				})),
			});
		}

		// Compare-and-set: only the first decision on a PENDING gate wins
		// (concurrent decisions would otherwise both pass the read guard,
		// orphaning a feedback comment and — on REJECT — duplicating the
		// next gate number). A 0-row update aborts the transaction.
		const decided = await tx.gates.updateMany({
			where: { gate_id: gateId, status: "PENDING" },
			data: { status: decision, comment_id: comment.comment_id },
		});
		if (decided.count !== 1) {
			throw new Error("This gate has already been decided.");
		}

		if (decision === "APPROVED") {
			// Materialize the stage dates (specs 2-3 follow-up): the stage's
			// actual end is the approval timestamp; the next stage starts the
			// same day. Compare STAGE numbers (gate numbers are per-stage).
			const nextStage = await tx.stages.findFirst({
				where: {
					project_id: projectId,
					is_deleted: false,
					number: { gt: stageRow?.number ?? 0 },
				},
				orderBy: { number: "asc" },
				select: { stage_id: true },
			});
			const dates = gateApprovalDates(new Date(), !!nextStage);
			await tx.stages.update({
				where: { stage_id: gate.stage_id },
				data: { actual_end_at: dates.actualEnd },
			});
			if (nextStage && dates.nextStageStart) {
				await tx.stages.update({
					where: { stage_id: nextStage.stage_id },
					data: { actual_start_at: dates.nextStageStart },
				});
			}
		} else {
			// Spec 2: a rejected gate spawns the next gate (PENDING, max+1).
			const existing = await tx.gates.findMany({
				where: { stage_id: gate.stage_id },
				select: { number: true },
			});
			await tx.gates.create({
				data: {
					stage_id: gate.stage_id,
					number: deriveNextGateNumber(existing.map((g) => g.number)),
					status: "PENDING",
				},
			});
		}

		return { ok: true as const };
	});
}

/**
 * Discussion comments on a gate (spec 7): clients and project team/owners may
 * comment; NEW comments are only allowed on the latest gate (spec 8).
 */
export async function createGateComment(
	gateId: string,
	description: string,
	imageUrls: string[] = [],
) {
	z.uuid().parse(gateId);
	const text = description.trim();
	if (!text && imageUrls.length === 0) {
		throw new Error("Comment cannot be empty.");
	}

	const projectId = await resolveGateProject(gateId);
	if (!projectId) throw new Error("Gate not found.");
	const auth = await assertProjectMemberOrClient(projectId);
	if (!auth.ok) throw new Error(auth.error);

	return await prisma.$transaction(async (tx) => {
		const gate = await tx.gates.findUnique({
			where: { gate_id: gateId },
			select: { stage_id: true },
		});
		if (!gate) throw new Error("Gate not found.");

		// Spec 8: only the latest gate (highest number) accepts new comments.
		const latest = await tx.gates.findFirst({
			where: { stage_id: gate.stage_id },
			orderBy: [{ number: { sort: "desc", nulls: "last" } }],
			select: { gate_id: true },
		});
		if (!latest || latest.gate_id !== gateId) {
			throw new Error("New comments can only be added to the latest gate.");
		}

		const comment = await tx.comments.create({
			data: {
				profile_id: auth.userId,
				description: text || "No feedback provided.",
				parent_type: "GATE_COMMENT",
				parent_id: gateId,
			},
		});
		if (imageUrls.length > 0) {
			await tx.images.createMany({
				data: imageUrls.map((url) => ({
					image_src: url,
					parent_type: ImageParentType.GATE_COMMENT,
					parent_id: comment.comment_id,
				})),
			});
		}
		return comment;
	});
}

/**
 * The discussion thread for a gate (feedback comment excluded — it is shown
 * in the history card; "further comments" only), newest last, with images.
 */
export async function getGateComments(gateId: string) {
	z.uuid().parse(gateId);

	const projectId = await resolveGateProject(gateId);
	if (!projectId) return [];
	const auth = await assertProjectMemberOrClient(projectId);
	if (!auth.ok) throw new Error(auth.error);

	const gate = await prisma.gates.findUnique({
		where: { gate_id: gateId },
		select: { comment_id: true },
	});
	if (!gate) return [];

	const comments = await prisma.comments.findMany({
		where: {
			parent_type: "GATE_COMMENT",
			parent_id: gateId,
			is_deleted: false,
			// Exclude the approve/decline feedback comment ("further comments"
			// only). A PENDING gate has no feedback yet — omit the filter
			// entirely (a `not: ""` would be an invalid uuid for Postgres).
			...(gate.comment_id ? { comment_id: { not: gate.comment_id } } : {}),
		},
		orderBy: { creation_date: "asc" },
		include: {
			Profile: { select: { first_name: true, last_name: true } },
		},
	});

	if (comments.length === 0) return [];

	const commentIds = comments.map((c) => c.comment_id);
	const images = await prisma.images.findMany({
		where: {
			parent_type: ImageParentType.GATE_COMMENT,
			parent_id: { in: commentIds },
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
		commentId: comment.comment_id,
		date: formatGateDate(comment.creation_date),
		description: comment.description,
		profileName: `${comment.Profile.first_name} ${comment.Profile.last_name}`,
		images: imagesByComment.get(comment.comment_id) ?? [],
	}));
}
