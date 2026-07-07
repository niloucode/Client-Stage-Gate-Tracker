"use server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/lib/generated/prisma";
import { cascadeSoftDeletePhase } from "../phase/phaseActions";

export type EntityFilterStatus = "active" | "deleted" | "all";

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
) {
	try {
		const maxNumber = await prisma.stages.aggregate({
			where: { project_id: projectId, is_deleted: false },
			_max: { number: true },
		});
		const nextStageNumber = (maxNumber._max.number ?? 0) + 1;

		const newStage = await prisma.stages.create({
			data: {
				name: stageName,
				number: nextStageNumber,
				end_date: endDate,
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
				number: "asc",
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
) {
	try {
		const updatedStage = await prisma.stages.update({
			where: {
				stage_id: stageId,
			},
			data: {
				name: stageName,
				end_date: endDate,
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
			} as any,
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
	const executeLogic = async (tx: Prisma.TransactionClient) => {
		await tx.stages.update({
			where: { stage_id: stageId },
			data: { is_deleted: true, deleted_at: new Date(), number: null } as any,
		});

		const childPhases = await tx.phases.findMany({
			where: { stage_id: stageId, is_deleted: false },
			select: { phase_id: true },
		});

		for (const phase of childPhases) {
			await cascadeSoftDeletePhase(phase.phase_id, tx);
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

			await tx.stages.update({
				where: { stage_id: stageId1 },
				data: { number: stage2.number },
			});

			await tx.stages.update({
				where: { stage_id: stageId2 },
				data: { number: stage1.number },
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
			orderBy: { number: "asc" },
		});

		const phaseIds = phases.map((p) => p.phase_id);
		const modules = await prisma.modules.findMany({
			where: { phase_id: { in: phaseIds }, is_deleted: false },
			orderBy: { creation_date: "asc" },
		});

		const moduleIds = modules.map(
			(m: Record<string, unknown>) => m.module_id as string,
		);
		const workflows = await prisma.workflows.findMany({
			where: { module_id: { in: moduleIds }, is_deleted: false },
			orderBy: [
				{ number: { sort: "asc", nulls: "last" } },
				{ creation_date: "asc" },
			],
		});

		const workflowIds = workflows.map(
			(w: Record<string, unknown>) => w.workflow_id as string,
		);

		// ── Fetch all tickets for these workflows ────────────────────────
		let tickets: {
			workflow_id: string;
			status: string;
			end_date: Date | null;
		}[] = [];
		if (workflowIds.length > 0) {
			try {
				tickets = (await prisma.tickets.findMany({
					where: { workflow_id: { in: workflowIds }, is_deleted: false },
					select: { workflow_id: true, status: true, end_date: true },
				})) as any[];
			} catch (err) {
				console.error("Failed to fetch tickets for stage tree:", err);
				// Continue with empty tickets — progress bars will show "- %"
			}
		}

		// Group tickets by workflow
		const ticketsByWorkflow = new Map<
			string,
			{ status: string; end_date: Date | null }[]
		>();
		for (const t of tickets) {
			const wfId = (t as Record<string, unknown>).workflow_id as string;
			const list = ticketsByWorkflow.get(wfId) ?? [];
			list.push({ status: t.status, end_date: t.end_date });
			ticketsByWorkflow.set(wfId, list);
		}

		// ── Compute ticketCount, progress, and computed end_date per workflow ──
		const workflowStats = new Map<
			string,
			{ ticketCount: number; progress: number; computedEndDate: Date | null }
		>();
		for (const wf of workflows) {
			const wfId = (wf as Record<string, unknown>).workflow_id as string;
			const wfTickets = ticketsByWorkflow.get(wfId) ?? [];
			const total = wfTickets.length;
			const finished = wfTickets.filter((t) => t.status === "FINISHED").length;
			const progress = total > 0 ? Math.round((finished / total) * 100) : 0;

			// End date = max end_date of finished tickets, but only when ALL are finished
			const allFinished = total > 0 && finished === total;
			let computedEndDate: Date | null = null;
			if (allFinished) {
				for (const t of wfTickets) {
					if (
						t.end_date &&
						(!computedEndDate || t.end_date > computedEndDate)
					) {
						computedEndDate = t.end_date;
					}
				}
			}

			workflowStats.set(wfId, {
				ticketCount: total,
				progress,
				computedEndDate,
			});
		}

		// ── Build nested tree ────────────────────────────────────────────
		const workflowsByModule = new Map<string, object[]>();
		for (const wf of workflows) {
			const wfModId = (wf as Record<string, unknown>).module_id as string;
			const wfId = (wf as Record<string, unknown>).workflow_id as string;
			const stats = workflowStats.get(wfId) ?? {
				ticketCount: 0,
				progress: 0,
				computedEndDate: null,
			};
			const list = workflowsByModule.get(wfModId) ?? [];
			list.push({
				...wf,
				ticketCount: stats.ticketCount,
				progress: stats.progress,
				end_date: stats.computedEndDate, // override DB end_date with computed value
			});
			workflowsByModule.set(wfModId, list);
		}

		const modulesByPhase = new Map<string, object[]>();
		for (const mod of modules) {
			const modPhaseId = (mod as Record<string, unknown>).phase_id as string;
			const modId = (mod as Record<string, unknown>).module_id as string;
			const modWorkflows = workflowsByModule.get(modId) ?? [];

			// Module end_date = max of workflow end_dates, but only if ALL are finished
			let modEndDate: Date | null = null;
			let allWfsFinished = modWorkflows.length > 0;
			for (const w of modWorkflows) {
				const ce = (w as Record<string, unknown>).end_date as Date | null;
				if (!ce) {
					allWfsFinished = false;
					break;
				}
				if (!modEndDate || ce > modEndDate) modEndDate = ce;
			}
			if (!allWfsFinished) modEndDate = null;

			const list = modulesByPhase.get(modPhaseId) ?? [];
			list.push({ ...mod, workflows: modWorkflows, end_date: modEndDate });
			modulesByPhase.set(modPhaseId, list);
		}

		const phasesWithModules = phases.map((p) => {
			const phId = (p as Record<string, unknown>).phase_id as string;
			const phModules = modulesByPhase.get(phId) ?? [];

			// Phase end_date = max of module end_dates, but only if ALL are finished
			let phEndDate: Date | null = null;
			let allModsFinished = phModules.length > 0;
			for (const m of phModules) {
				const ce = (m as Record<string, unknown>).end_date as Date | null;
				if (!ce) {
					allModsFinished = false;
					break;
				}
				if (!phEndDate || ce > phEndDate) phEndDate = ce;
			}
			if (!allModsFinished) phEndDate = null;

			return { ...p, modules: phModules, end_date: phEndDate };
		});

		return { ...stage, phases: phasesWithModules };
	} catch (error) {
		console.error("Failed to fetch stage tree:", error);
		return null;
	}
}
