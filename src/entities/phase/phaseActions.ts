"use server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/lib/generated/prisma";
import {
	assertProjectMember,
	resolvePhaseProject,
} from "@/lib/auth/projectAccess";
import { reorderBySortKey } from "@/shared/lib/fractionalSort";
import type { EntityFilterStatus } from "@/entities/types";

/**
 * Retrieves a specific phase from the database using its unique ID.
 * Uses a status filter to determine if the phase can be retrieved based on its deletion state:
 * - 'active' (default): Only retrieves the phase if it is NOT soft-deleted.
 * - 'deleted': Only retrieves the phase if it IS soft-deleted (useful for recycle bin views).
 * - 'all': Retrieves the phase regardless of its deletion status.
 * Security Note: Ensure user authorization claims are verified before execution.
 *
 * @param {string} phaseId - The UUID of the phase to retrieve.
 * @param {EntityFilterStatus} [status='active'] - The deletion status filter.
 * @returns {Promise<{success: boolean, data?: any, error?: string}>}
 * Returns `success: true` and the phase object if found.
 * Returns `success: false` and an error message if the phase does not exist, does not match the requested status, or the query fails.
 */
export async function getPhaseById(
	phaseId: string,
	status: EntityFilterStatus = "active",
) {
	try {
		const isDeletedFilter =
			status === "active" ? false : status === "deleted" ? true : undefined;

		const phase = await prisma.phases.findUnique({
			where: {
				phase_id: phaseId,
				is_deleted: isDeletedFilter,
			},
		});

		if (!phase) {
			return {
				success: false,
				error: "Phase not found or does not match the requested status.",
			};
		}
		return { success: true, data: phase };
	} catch (error) {
		console.error("Failed to fetch phase:", error);
		return { success: false, error: "Failed to fetch phase details." };
	}
}

/**
 * Retrieves all modules belonging to a specific phase.
 * Uses a status filter to determine which modules to return based on their deletion state:
 * - 'active' (default): Returns only modules that are NOT soft-deleted.
 * - 'deleted': Returns only modules that ARE soft-deleted (useful for recycle bin views).
 * - 'all': Bypasses the filter and returns everything.
 * Modules are returned in ascending chronological order based on their 'start_date' field.
 *
 * @param {string} phaseId - The UUID of the parent phase.
 * @param {EntityFilterStatus} [status='active'] - The deletion status filter.
 * @returns {Promise<{success: boolean, data?: any, error?: string}>}
 * Returns `success: true` and an array of modules if the query is successful.
 * Returns `success: false` and an error message if the query fails.
 */
export async function getModulesByPhaseId(
	phaseId: string,
	status: EntityFilterStatus = "active",
) {
	try {
		const isDeletedFilter =
			status === "active" ? false : status === "deleted" ? true : undefined;

		const modules = await prisma.modules.findMany({
			where: {
				phase_id: phaseId,
				is_deleted: isDeletedFilter,
			},
			orderBy: {
				plan_start_at: "asc",
			},
		});

		return { success: true, data: modules };
	} catch (error) {
		console.error("Failed to fetch modules for phase:", error);
		return { success: false, error: "Failed to fetch modules." };
	}
}

/**
 * Performs a cascading soft delete on a phase and all its nested children.
 * This function utilizes an existing transaction client (txClient) if provided, ensuring
 * the operation rolls back entirely if triggered from a parent stage deletion. If executed
 * independently, it starts a new transaction. It updates the phase's deletion status,
 * queries for child modules, and recursively invokes the module-level cascade function.
 *
 * @param {string} phaseId - The UUID of the phase to archive.
 * @param {any} [txClient] - (Optional) The Prisma transaction context to maintain database integrity.
 * @returns {Promise<{success: boolean, error?: string}>}
 * Returns `success: true` upon successful cascade.
 * Returns `success: false` and an error message if the operation fails, or throws an error to trigger a rollback if executed within a parent transaction.
 */
export async function cascadeSoftDeletePhase(
	phaseId: string,
	txClient?: Prisma.TransactionClient,
) {
	// Authorization: caller must be a member of the parent project
	const projectId = await resolvePhaseProject(phaseId);
	if (!projectId) return { success: false, error: "Phase not found." };
	const auth = await assertProjectMember(projectId);
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

			if (workflowIds.length > 0) {
				await tx.workflows.updateMany({
					where: { workflow_id: { in: workflowIds } },
					data: { is_deleted: true, deleted_at: new Date() },
				});

				const childTickets = await tx.tickets.findMany({
					where: { workflow_id: { in: workflowIds }, is_deleted: false },
					select: { ticket_id: true },
				});
				const ticketIds = childTickets.map((t) => t.ticket_id);

				if (ticketIds.length > 0) {
					await tx.tickets.updateMany({
						where: { ticket_id: { in: ticketIds } },
						data: { is_deleted: true, deleted_at: new Date() },
					});
				}
			}
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
 * Moves a phase to a new sequential position by its target number.
 * Uses an insertion-based algorithm inside a Prisma interactive transaction:
 *  1. Fetch all affected phases (dragged + every phase between old and target).
 *  2. Null ALL their numbers in one updateMany (multiple NULLs don't violate
 *     the @@unique([stage_id, number]) constraint).
 *  3. Reassign each phase one at a time: the dragged phase gets the target number,
 *     every other phase shifts by ±1.
 *
 * This avoids PostgreSQL per-row unique checks on intermediate states.
 *
 * @param {string} phaseId     - The UUID of the phase being moved.
 * @param {number} targetNumber - The desired sequential position (1-based).
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function reorderPhase(
	phaseId: string,
	targetNumber: number,
) {
	// Authorization: caller must be a member of the parent project
	const projectId = await resolvePhaseProject(phaseId);
	if (!projectId) return { success: false, error: "Phase not found." };
	const auth = await assertProjectMember(projectId);
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
				where: { stage_id: phase.stage_id, is_deleted: false, sort_key: { not: null } },
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
