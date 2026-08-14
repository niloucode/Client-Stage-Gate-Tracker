"use server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/lib/generated/prisma";
import {
	assertProjectMemberNotClient,
	resolvePhaseProject,
} from "@/lib/auth/projectAccess";
import { reorderBySortKey } from "@/shared/lib/fractionalSort";
import { softDeleteWorkflowSubtree } from "@/entities/ticket/lib/softDelete";

/**
 * Cascading soft delete: phase + its modules + workflows + tickets, batched
 * per level (one updateMany each). Joins the caller's transaction when
 * `txClient` is provided, otherwise runs in its own; inside a parent
 * transaction failures rethrow so the parent rolls back.
 *
 * @param phaseId - UUID of the phase to archive.
 * @param txClient - Optional Prisma transaction to join (used by stage-level cascades).
 */
export async function cascadeSoftDeletePhase(
	phaseId: string,
	txClient?: Prisma.TransactionClient,
) {
	// Authorization: caller must be a member of the parent project
	const projectId = await resolvePhaseProject(phaseId);
	if (!projectId) return { success: false, error: "Phase not found." };
	const auth = await assertProjectMemberNotClient(projectId);
	if (!auth.ok) return { success: false, error: auth.error };
	const executeLogic = async (tx: Prisma.TransactionClient) => {
		await tx.phases.update({
			where: { phase_id: phaseId },
			data: { is_deleted: true, deleted_at: new Date(), number: null },
		});

		// Batch the whole subtree: one updateMany per level instead of
		// per-child cascade calls.
		const childModules = await tx.modules.findMany({
			where: { phase_id: phaseId, is_deleted: false },
			select: { module_id: true },
		});
		const moduleIds = childModules.map((m) => m.module_id);

		if (moduleIds.length > 0) {
			await tx.modules.updateMany({
				where: { module_id: { in: moduleIds } },
				data: { is_deleted: true, deleted_at: new Date() },
			});

			const childWorkflows = await tx.workflows.findMany({
				where: { module_id: { in: moduleIds }, is_deleted: false },
				select: { workflow_id: true },
			});
			const workflowIds = childWorkflows.map((w) => w.workflow_id);

			await softDeleteWorkflowSubtree(tx, workflowIds);
		}
	};

	try {
		if (txClient) {
			await executeLogic(txClient);
		} else {
			await prisma.$transaction(executeLogic);
		}
		return { success: true };
	} catch (error) {
		console.error("Failed cascading soft delete for phase:", error);
		if (txClient) throw error;
		return { success: false, error: "Failed to cascade archive phase." };
	}
}

/**
 * Moves a phase to a new sequential position via fractional indexing:
 * computes the sort key between the neighbors at the target position and
 * updates a single row (see shared/lib/fractionalSort). No renumbering,
 * no unique-constraint intermediate states.
 *
 * @param phaseId - UUID of the phase being moved.
 * @param targetNumber - The desired 1-based position.
 */
export async function reorderPhase(phaseId: string, targetNumber: number) {
	// Authorization: caller must be a member of the parent project
	const projectId = await resolvePhaseProject(phaseId);
	if (!projectId) return { success: false, error: "Phase not found." };
	const auth = await assertProjectMemberNotClient(projectId);
	if (!auth.ok) return { success: false, error: auth.error };
	try {
		await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
			const phase = await tx.phases.findUnique({
				where: { phase_id: phaseId },
				select: { stage_id: true },
			});

			if (!phase) {
				throw new Error(`Phase ${phaseId} not found.`);
			}

			// Fractional-indexing move via the shared core (Task 3.4):
			// compute the key between the neighbors at the target position
			// and update a single row. No renumbering.
			const siblings = await tx.phases.findMany({
				where: {
					stage_id: phase.stage_id,
					is_deleted: false,
					sort_key: { not: null },
				},
				select: { phase_id: true, sort_key: true },
				orderBy: { sort_key: { sort: "asc", nulls: "last" } },
			});

			const result = reorderBySortKey(
				siblings.map((s) => ({ id: s.phase_id, sort_key: s.sort_key })),
				phaseId,
				targetNumber,
			);
			if (!result.success) {
				throw new Error(result.error);
			}
			if (result.newKey === undefined) return;

			await tx.phases.update({
				where: { phase_id: phaseId },
				data: { sort_key: result.newKey },
			});
		});

		return { success: true };
	} catch (error) {
		console.error("Failed to reorder phase:", error);
		return { success: false, error: "Failed to reorder phases." };
	}
}
