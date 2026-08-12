"use server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/lib/generated/prisma";
import { assertProjectMember, resolveStageProject } from "@/lib/auth/projectAccess";
import { generateKeyBetween } from "fractional-indexing";
import type { EntityFilterStatus } from "@/entities/types";

/**
 * Creates a new stage and automatically assigns it a scoped sequential number
 * based on its parent project.
 *
 * @param {string} projectId - The UUID of the parent project this stage belongs to.
 * @param {string} stageName - The display name of the stage (e.g., "Stage 1", "Design Phase").
 * @param {Date | null} [startDate] - (Optional) The scheduled start date of the stage.
 * @param {Date | null} [endDate] - (Optional) The scheduled end date of the stage.
 * @returns {Promise<{success: boolean, data?: any, error?: string}>}
 * Returns `success: true` and the newly created stage object if successful.
 * Returns `success: false` and an error message if the creation fails.
 */
export async function createStage(
	projectId: string,
	stageName: string,
	startDate?: Date | null,
	endDate?: Date | null,
	actualStart?: Date | null,
	actualEnd?: Date | null,
) {
	// Authorization: caller must be a member of the project
	const auth = await assertProjectMember(projectId);
	if (!auth.ok) return { success: false, error: auth.error };
	try {
		// Fractional sort key: append after the last sibling — a single-key
		// insert that never requires renumbering existing rows.
		const lastStage = await prisma.stages.findFirst({
			where: { project_id: projectId, is_deleted: false },
			orderBy: { sort_key: { sort: "desc", nulls: "last" } },
			select: { sort_key: true },
		});
		const nextKey = generateKeyBetween(lastStage?.sort_key ?? null, null);

		const newStage = await prisma.stages.create({
			data: {
				name: stageName,
				sort_key: nextKey,
				plan_start_at: startDate ?? new Date(),
				plan_end_at: endDate ?? new Date(),
				actual_start_at: actualStart ?? null,
				actual_end_at: actualEnd ?? null,
				project_id: projectId,
			},
		});
		return { success: true, data: newStage };
	} catch (error) {
		console.error("Failed to create stage:", error);
		return { success: false, error: "Failed to create stage." };
	}
}

/**
 * Retrieves a specific stage from the database using its unique ID.
 * Includes the relational link to its parent project.
 * Uses a status filter to determine if the stage can be retrieved based on its deletion state:
 * - 'active' (default): Only retrieves the stage if it is NOT soft-deleted.
 * - 'deleted': Only retrieves the stage if it IS soft-deleted (useful for recycle bin views).
 * - 'all': Retrieves the stage regardless of its deletion status.
 * Security Note: Ensure user authorization claims are verified before execution.
 *
 * @param {string} stageId - The UUID of the stage to retrieve.
 * @param {EntityFilterStatus} [status='active'] - The deletion status filter.
 * @returns {Promise<{success: boolean, data?: any, error?: string}>}
 * Returns `success: true` and the stage object if found.
 * Returns `success: false` and an error message if the stage does not exist, does not match the requested status, or the query fails.
 */
export async function getStageById(
	stageId: string,
	status: EntityFilterStatus = "active",
) {
	try {
		const isDeletedFilter =
			status === "active" ? false : status === "deleted" ? true : undefined;

		const stage = await prisma.stages.findUnique({
			where: {
				stage_id: stageId,
				is_deleted: isDeletedFilter,
			},
			include: {
				Projects: true,
			},
		});

		if (!stage) {
			return {
				success: false,
				error: "Stage not found or does not match the requested status.",
			};
		}
		return { success: true, data: stage };
	} catch (error) {
		console.error("Failed to fetch stage:", error);
		return { success: false, error: "Failed to fetch stage details." };
	}
}

/**
 * Retrieves all phases belonging to a specific stage.
 * Uses a status filter to determine which phases to return based on their deletion state:
 * - 'active' (default): Returns only phases that are NOT soft-deleted.
 * - 'deleted': Returns only phases that ARE soft-deleted (useful for recycle bin views).
 * - 'all': Bypasses the filter and returns everything.
 * Phases are returned in ascending sequential order based on their 'number' field.
 *
 * @param {string} stageId - The UUID of the parent stage.
 * @param {EntityFilterStatus} [status='active'] - The deletion status filter.
 * @returns {Promise<{success: boolean, data?: any, error?: string}>}
 * Returns `success: true` and an array of phases if the query is successful.
 * Returns `success: false` and an error message if the query fails.
 */
export async function getPhasesByStageId(
	stageId: string,
	status: EntityFilterStatus = "active",
) {
	try {
		const isDeletedFilter =
			status === "active" ? false : status === "deleted" ? true : undefined;

		const phases = await prisma.phases.findMany({
			where: {
				stage_id: stageId,
				is_deleted: isDeletedFilter,
			},
			orderBy: {
				sort_key: { sort: "asc", nulls: "last" },
			},
		});

		return { success: true, data: phases };
	} catch (error) {
		console.error("Failed to fetch phases for stage:", error);
		return { success: false, error: "Failed to fetch phases." };
	}
}

/**
 * Updates an existing stage's details in the database.
 * Note: The stage 'number' is excluded from this function to protect the sequential order.
 *
 * @param {string} stageId - The UUID of the stage to update.
 * @param {string} [stageName] - (Optional) The new name for the stage.
 * @param {Date | null} [startDate] - (Optional) The new scheduled start date.
 * @param {Date | null} [endDate] - (Optional) The new scheduled end date.
 * @returns {Promise<{success: boolean, data?: any, error?: string}>}
 * Returns `success: true` and the updated stage object if successful.
 * Returns `success: false` and an error message if the update fails.
 */
export async function updateStage(
	stageId: string,
	stageName?: string,
	startDate?: Date | null,
	endDate?: Date | null,
	actualStart?: Date | null,
	actualEnd?: Date | null,
) {
	// Authorization: caller must be a member of the parent project
	const projectId = await resolveStageProject(stageId);
	if (!projectId) return { success: false, error: "Stage not found." };
	const auth = await assertProjectMember(projectId);
	if (!auth.ok) return { success: false, error: auth.error };
	try {
		const updatedStage = await prisma.stages.update({
			where: {
				stage_id: stageId,
			},
			data: {
				name: stageName,
				plan_start_at: startDate ?? undefined,
				plan_end_at: endDate ?? undefined,
				actual_start_at: actualStart ?? undefined,
				actual_end_at: actualEnd ?? undefined,
			},
		});
		return { success: true, data: updatedStage };
	} catch (error) {
		console.error("Failed to update stage:", error);
		return { success: false, error: "Failed to update stage details." };
	}
}

/**
 * Performs a "soft delete" on a stage by marking it as deleted instead of permanently erasing it.
 * This acts like a recycle bin, preserving historical data and preventing database corruption.
 * Note: Archiving is blocked if the stage contains active child phases to ensure operational integrity.
 *
 * @param {string} stageId - The UUID of the stage to soft delete.
 * @returns {Promise<{success: boolean, error?: string}>}
 * Returns `success: true` if the stage was successfully archived.
 * Returns `success: false` and an error message if the stage contains phases or the query fails.
 */
export async function softDeleteStage(stageId: string) {
	// Authorization: caller must be a member of the parent project
	const projectId = await resolveStageProject(stageId);
	if (!projectId) return { success: false, error: "Stage not found." };
	const auth = await assertProjectMember(projectId);
	if (!auth.ok) return { success: false, error: auth.error };
	try {
		const attachedPhasesCount = await prisma.phases.count({
			where: {
				stage_id: stageId,
				is_deleted: false,
			},
		});
		if (attachedPhasesCount > 0) {
			return {
				success: false,
				error: `Cannot archive stage. Please remove or archive all ${attachedPhasesCount} associated phase(s) first.`,
			};
		}

		await prisma.stages.update({
			where: { stage_id: stageId },
			data: {
				is_deleted: true,
				deleted_at: new Date(),
				number: null,
			},
		});
		return { success: true };
	} catch (error) {
		console.error("Failed to soft delete stage:", error);
		return {
			success: false,
			error: "Failed to archive the stage due to a database error.",
		};
	}
}

/**
 * Performs a cascading soft delete on a stage and all its nested children.
 * This function manages transaction continuity: if an existing transaction client (txClient)
 * is passed from a higher-level function, it executes within that transaction to ensure
 * complete rollback on failure. If none is provided, it initiates a new Prisma interactive transaction.
 * The function soft deletes the stage, fetches all direct child phases, and recursively calls
 * the phase-level cascade function, passing the transaction context forward.
 *
 * @param {string} stageId - The UUID of the stage to archive.
 * @param {any} [txClient] - (Optional) The Prisma transaction context to maintain database integrity.
 * @returns {Promise<{success: boolean, error?: string}>}
 * Returns `success: true` upon successful cascade.
 * Returns `success: false` and an error message if the operation fails, or throws an error to trigger a rollback if executed within a parent transaction. */
export async function cascadeSoftDeleteStage(
	stageId: string,
	txClient?: Prisma.TransactionClient,
) {
	// Authorization: caller must be a member of the parent project
	const projectId = await resolveStageProject(stageId);
	if (!projectId) return { success: false, error: "Stage not found." };
	const auth = await assertProjectMember(projectId);
	if (!auth.ok) return { success: false, error: auth.error };
	const executeLogic = async (tx: Prisma.TransactionClient) => {
		await tx.stages.update({
			where: { stage_id: stageId },
			data: { is_deleted: true, deleted_at: new Date(), number: null },
		});

		// Batch the whole subtree: one updateMany per level instead of
		// per-child cascade calls.
		const childPhases = await tx.phases.findMany({
			where: { stage_id: stageId, is_deleted: false },
			select: { phase_id: true },
		});
		const phaseIds = childPhases.map((p) => p.phase_id);

		if (phaseIds.length > 0) {
			await tx.phases.updateMany({
				where: { phase_id: { in: phaseIds } },
				data: { is_deleted: true, deleted_at: new Date() },
			});

			const childModules = await tx.modules.findMany({
				where: { phase_id: { in: phaseIds }, is_deleted: false },
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
		console.error("Failed cascading soft delete for stage:", error);
		if (txClient) throw error;
		return { success: false, error: "Failed to cascade archive stage." };
	}
}

/**
 * Swaps the sequential 'number' values of two stages.
 * This function utilizes a Prisma interactive transaction to fetch the current
 * numbers of both stages and perform the updates simultaneously. This approach
 * guarantees database consistency by ensuring that if one update fails, the
 * other is rolled back, preventing duplicate sequence numbers from being assigned.
 *
 * @param {string} stageId1 - The UUID of the first stage.
 * @param {string} stageId2 - The UUID of the second stage.
 * @returns {Promise<{success: boolean, error?: string}>}
 * Returns `success: true` if the transaction completes successfully.
 * Returns `success: false` and an error message if the stages cannot be found or the database update fails.
 */
export async function swapStageOrder(stageId1: string, stageId2: string) {
	// Authorization: caller must be a member of both stages' project
	const projectId1 = await resolveStageProject(stageId1);
	const projectId2 = await resolveStageProject(stageId2);
	if (!projectId1 || !projectId2)
		return { success: false, error: "Stage not found." };
	if (projectId1 !== projectId2)
		return {
			success: false,
			error: "Stages must belong to the same project.",
		};
	const auth = await assertProjectMember(projectId1);
	if (!auth.ok) return { success: false, error: auth.error };
	try {
		await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
			const stage1 = await tx.stages.findUnique({
				where: { stage_id: stageId1 },
			});
			const stage2 = await tx.stages.findUnique({
				where: { stage_id: stageId2 },
			});

			if (!stage1 || !stage2) {
				throw new Error("One or both stages could not be found.");
			}

			// Fractional-indexing swap: exchange sort keys (O(1), no renumbering)
			await tx.stages.update({
				where: { stage_id: stageId1 },
				data: { sort_key: stage2.sort_key },
			});

			await tx.stages.update({
				where: { stage_id: stageId2 },
				data: { sort_key: stage1.sort_key },
			});
		});

		return { success: true };
	} catch (error) {
		console.error("Failed to swap stage orders:", error);
		return { success: false, error: "Failed to reorder stages." };
	}
}

/**
 * Fetches a stage and its full nested tree: Phases → Modules → Workflows.
 * Returns the stage with a `phases` array — each phase containing its `modules`,
 * and each module containing its `workflows`.
 *
 * @param {string} stageId - The UUID of the stage to load.
 * @returns {Promise<object | null>} The stage tree object, or null if not found / error.
 */
export async function getStageTree(stageId: string) {
	try {
		const stage = await prisma.stages.findUnique({
			where: { stage_id: stageId, is_deleted: false },
		});
		if (!stage) return null;

		const phases = await prisma.phases.findMany({
			where: { stage_id: stageId, is_deleted: false },
			orderBy: { sort_key: { sort: "asc", nulls: "last" } },
		});

		const phaseIds = phases.map((p) => p.phase_id);
		const modules = await prisma.modules.findMany({
			where: { phase_id: { in: phaseIds }, is_deleted: false },
			orderBy: { plan_start_at: "asc" },
		});

		const moduleIds = modules.map((m) => m.module_id);
		const workflows = await prisma.workflows.findMany({
			where: { module_id: { in: moduleIds }, is_deleted: false },
			orderBy: [
				{ sort_key: { sort: "asc", nulls: "last" } },
				{ plan_start_at: "asc" },
			],
		});

		const workflowIds = workflows.map((w) => w.workflow_id);

		// ── Fetch all tickets for these workflows ────────────────────────
		let tickets: {
			workflow_id: string | null;
			status: string;
			actual_end_at: Date | null;
		}[] = [];
		if (workflowIds.length > 0) {
			try {
				tickets = await prisma.tickets.findMany({
					where: { workflow_id: { in: workflowIds }, is_deleted: false },
					select: { workflow_id: true, status: true, actual_end_at: true },
				});
			} catch (err) {
				console.error("Failed to fetch tickets for stage tree:", err);
				// Continue with empty tickets — progress bars will show "- %"
			}
		}

		// Group tickets by workflow
		const ticketsByWorkflow = new Map<
			string,
			{ status: string; actual_end_at: Date | null }[]
		>();
		for (const t of tickets) {
			const wfId = t.workflow_id ?? "";
			const list = ticketsByWorkflow.get(wfId) ?? [];
			list.push({ status: t.status, actual_end_at: t.actual_end_at });
			ticketsByWorkflow.set(wfId, list);
		}

		// ── Compute ticketCount, progress, and computed finish_date per workflow ──
		const workflowStats = new Map<
			string,
			{ ticketCount: number; progress: number; computedFinishDate: Date | null }
		>();
		for (const wf of workflows) {
			const wfId = wf.workflow_id;
			const wfTickets = ticketsByWorkflow.get(wfId) ?? [];
			const total = wfTickets.length;
			const finished = wfTickets.filter((t) => t.status === "FINISHED").length;
			const progress = total > 0 ? Math.round((finished / total) * 100) : 0;

			// Finish date = max actual_end_at of finished tickets, but only when ALL are finished
			const allFinished = total > 0 && finished === total;
			let computedFinishDate: Date | null = null;
			if (allFinished) {
				for (const t of wfTickets) {
					if (
						t.actual_end_at &&
						(!computedFinishDate || t.actual_end_at > computedFinishDate)
					) {
						computedFinishDate = t.actual_end_at;
					}
				}
			}

			workflowStats.set(wfId, {
				ticketCount: total,
				progress,
				computedFinishDate,
			});
		}

		// ── Build nested tree ────────────────────────────────────────────
		const workflowsByModule = new Map<string, object[]>();
		for (const wf of workflows) {
			const wfModId = wf.module_id;
			const wfId = wf.workflow_id;
			const stats = workflowStats.get(wfId) ?? {
				ticketCount: 0,
				progress: 0,
				computedFinishDate: null,
			};
			const list = workflowsByModule.get(wfModId) ?? [];
			list.push({
				...wf,
				number: list.length + 1, // display number derived from sort order (WorkflowsList reorder uses it)
				ticketCount: stats.ticketCount,
				progress: stats.progress,
				planStart: wf.plan_start_at,
				planEnd: wf.plan_end_at,
				actualStart: wf.actual_start_at,
				actualEnd: stats.computedFinishDate, // computed: date last ticket finished
			});
			workflowsByModule.set(wfModId, list);
		}

		const modulesByPhase = new Map<string, object[]>();
		for (const mod of modules) {
			const modPhaseId = mod.phase_id;
			const modId = mod.module_id;
			const modWorkflows = workflowsByModule.get(modId) ?? [];

			// Module actualEnd = max of workflow actualEnd, but only if ALL are finished
			let modActualEnd: Date | null = null;
			let allWfsFinished = modWorkflows.length > 0;
			for (const w of modWorkflows) {
				const ce = (w as { actualEnd: Date | null }).actualEnd;
				if (!ce) {
					allWfsFinished = false;
					break;
				}
				if (!modActualEnd || ce > modActualEnd) modActualEnd = ce;
			}
			if (!allWfsFinished) modActualEnd = null;

			const list = modulesByPhase.get(modPhaseId) ?? [];
			list.push({
				...mod,
				workflows: modWorkflows,
				planStart: mod.plan_start_at,
				planEnd: mod.plan_end_at,
				actualStart: mod.actual_start_at,
				actualEnd: modActualEnd,
			});
			modulesByPhase.set(modPhaseId, list);
		}

		const phasesWithModules = phases.map((p, index) => {
			const phId = p.phase_id;
			const phModules = modulesByPhase.get(phId) ?? [];

			// Phase actualEnd = max of module actualEnd, but only if ALL are finished
			let phActualEnd: Date | null = null;
			let allModsFinished = phModules.length > 0;
			for (const m of phModules) {
				const ce = (m as { actualEnd: Date | null }).actualEnd;
				if (!ce) {
					allModsFinished = false;
					break;
				}
				if (!phActualEnd || ce > phActualEnd) phActualEnd = ce;
			}
			if (!allModsFinished) phActualEnd = null;

			return {
				...p,
				number: index + 1, // display number derived from sort order
				modules: phModules,
				planStart: p.plan_start_at,
				planEnd: p.plan_end_at,
				actualStart: p.actual_start_at,
				actualEnd: phActualEnd,
			};
		});

		return { ...stage, phases: phasesWithModules };
	} catch (error) {
		console.error("Failed to fetch stage tree:", error);
		return null;
	}
}
