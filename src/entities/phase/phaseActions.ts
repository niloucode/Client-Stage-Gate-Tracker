"use server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/lib/generated/prisma";
import { cascadeSoftDeleteModule } from "../module/moduleActions";

export type EntityFilterStatus = "active" | "deleted" | "all";

/**
 * Creates a new phase and automatically assigns it a scoped sequential number
 * based on its parent stage.
 *
 * @param {string} stageId - The UUID of the parent stage this phase belongs to.
 * @param {string} phaseName - The display name of the phase (e.g., "Planning", "Execution").
 * @param {Date | null} [startDate] - (Optional) The scheduled start date of the phase.
 * @param {Date | null} [endDate] - (Optional) The scheduled end date of the phase.
 * @returns {Promise<{success: boolean, data?: any, error?: string}>}
 * Returns `success: true` and the newly created phase object if successful.
 * Returns `success: false` and an error message if the creation fails.
 */
export async function createPhase(
	stageId: string,
	phaseName: string,
	startDate?: Date | null,
	endDate?: Date | null,
	deadlineDate?: Date | null,
	description?: string | null,
) {
	try {
		const maxNumber = await prisma.phases.aggregate({
			where: { stage_id: stageId, is_deleted: false },
			_max: { number: true },
		});
		const nextPhaseNumber = (maxNumber._max.number ?? 0) + 1;

		const newPhase = await prisma.phases.create({
			data: {
				name: phaseName,
				description: description,
				number: nextPhaseNumber,
				end_date: endDate,
				deadline_date: deadlineDate,
				stage_id: stageId,
			},
		});
		return { success: true, data: newPhase };
	} catch (error) {
		console.error("Failed to create phase:", error);
		return { success: false, error: "Failed to create phase." };
	}
}

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
 * Modules are returned in ascending chronological order based on their 'creation_date' field.
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
				creation_date: "asc",
			},
		});

		return { success: true, data: modules };
	} catch (error) {
		console.error("Failed to fetch modules for phase:", error);
		return { success: false, error: "Failed to fetch modules." };
	}
}

/**
 * Updates an existing phase's details in the database.
 * Note: The phase 'number' is excluded from this function to protect the sequential order.
 *
 * @param {string} phaseId - The UUID of the phase to update.
 * @param {string} [phaseName] - (Optional) The new name for the phase.
 * @param {string | null} [description] - (Optional) The new description for the phase.
 * @param {Date | null} [startDate] - (Optional) The new scheduled start date.
 * @param {Date | null} [endDate] - (Optional) The new scheduled end date.
 * @returns {Promise<{success: boolean, data?: any, error?: string}>}
 * Returns `success: true` and the updated phase object if successful.
 * Returns `success: false` and an error message if the update fails.
 */
export async function updatePhase(
	phaseId: string,
	phaseName?: string,
	description?: string | null,
	startDate?: Date | null,
	endDate?: Date | null,
	deadlineDate?: Date | null,
) {
	try {
		const updatedPhase = await prisma.phases.update({
			where: {
				phase_id: phaseId,
			},
			data: {
				name: phaseName,
				description: description,
				end_date: endDate,
				deadline_date: deadlineDate,
			},
		});
		return { success: true, data: updatedPhase };
	} catch (error) {
		console.error("Failed to update phase:", error);
		return { success: false, error: "Failed to update phase details." };
	}
}

/**
 * Performs a "soft delete" on a phase by marking it as deleted instead of permanently erasing it.
 * This acts like a recycle bin, preserving historical data and preventing database corruption.
 * Note: Archiving is blocked if the phase contains active child modules to ensure operational integrity.
 *
 * @param {string} phaseId - The UUID of the phase to soft delete.
 * @returns {Promise<{success: boolean, error?: string}>}
 * Returns `success: true` if the phase was successfully archived.
 * Returns `success: false` and an error message if the phase contains modules or the query fails.
 */
export async function softDeletePhase(phaseId: string) {
	try {
		const attachedModulesCount = await prisma.modules.count({
			where: {
				phase_id: phaseId,
				is_deleted: false,
			},
		});
		if (attachedModulesCount > 0) {
			return {
				success: false,
				error: `Cannot archive phase. Please remove or archive all ${attachedModulesCount} associated module(s) first.`,
			};
		}

		await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
			// Read the phase's number before nulling it
			const phase = await tx.phases.findUnique({
				where: { phase_id: phaseId },
				select: { stage_id: true, number: true },
			});

			// Mark the phase as deleted and release its number slot
			await tx.phases.update({
				where: { phase_id: phaseId },
				data: {
					is_deleted: true,
					deleted_at: new Date(),
					number: null,
				} as any,
			});

			// Renumber remaining phases to close the gap
			if (phase?.number != null) {
				const higherPhases = await tx.phases.findMany({
					where: {
						stage_id: phase.stage_id,
						number: { gt: phase.number },
						is_deleted: false,
					},
					select: { phase_id: true, number: true },
					orderBy: { number: "asc" },
				});

				if (higherPhases.length > 0) {
					// Null all affected phases (safe — multiple NULLs allowed)
					await tx.phases.updateMany({
						where: {
							phase_id: { in: higherPhases.map((p) => p.phase_id) },
						},
						data: { number: null },
					});

					// Reassign each to its new number
					for (const p of higherPhases) {
						await tx.phases.update({
							where: { phase_id: p.phase_id },
							data: { number: p.number! - 1 },
						});
					}
				}
			}
		});

		return { success: true };
	} catch (error) {
		console.error("Failed to soft delete phase:", error);
		return {
			success: false,
			error: "Failed to archive the phase due to a database error.",
		};
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
	const executeLogic = async (tx: Prisma.TransactionClient) => {
		// Read the phase's number before nulling it
		const phase = await tx.phases.findUnique({
			where: { phase_id: phaseId },
			select: { stage_id: true, number: true },
		});

		await tx.phases.update({
			where: { phase_id: phaseId },
			data: { is_deleted: true, deleted_at: new Date(), number: null } as any,
		});

		const childModules = await tx.modules.findMany({
			where: { phase_id: phaseId, is_deleted: false },
			select: { module_id: true },
		});

		for (const childModule of childModules) {
			await cascadeSoftDeleteModule(childModule.module_id, tx);
		}

		// Renumber remaining phases to close the gap
		if (phase?.number != null) {
			const higherPhases = await tx.phases.findMany({
				where: {
					stage_id: phase.stage_id,
					number: { gt: phase.number },
					is_deleted: false,
				},
				select: { phase_id: true, number: true },
				orderBy: { number: "asc" },
			});

			if (higherPhases.length > 0) {
				await tx.phases.updateMany({
					where: {
						phase_id: { in: higherPhases.map((p) => p.phase_id) },
					},
					data: { number: null },
				});

				for (const p of higherPhases) {
					await tx.phases.update({
						where: { phase_id: p.phase_id },
						data: { number: p.number! - 1 },
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
	try {
		await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
			const phase = await tx.phases.findUnique({
				where: { phase_id: phaseId },
			});

			if (!phase) {
				throw new Error(`Phase ${phaseId} not found.`);
			}
			if (phase.number === null) {
				throw new Error(
					`Phase ${phaseId} has no sequence number (number is null).`,
				);
			}

			const stageId = phase.stage_id;
			const oldNumber = phase.number;

			// No-op if already at the target position
			if (oldNumber === targetNumber) return;

			// Validate target range
			const activeCount = await tx.phases.count({
				where: { stage_id: stageId, is_deleted: false },
			});
			if (targetNumber < 1 || targetNumber > activeCount) {
				throw new Error(
					`Target number ${targetNumber} is out of bounds (1–${activeCount}).`,
				);
			}

			// Step 1: Fetch every phase in the affected range (dragged + shifted)
			const rangeStart = Math.min(oldNumber, targetNumber);
			const rangeEnd = Math.max(oldNumber, targetNumber);
			const affected = await tx.phases.findMany({
				where: {
					stage_id: stageId,
					number: { gte: rangeStart, lte: rangeEnd },
					is_deleted: false,
				},
				select: { phase_id: true, number: true },
			});

			// Step 2: Null ALL affected phases at once —
			//         multiple NULLs don't violate the unique constraint
			await tx.phases.updateMany({
				where: {
					phase_id: { in: affected.map((p) => p.phase_id) },
				},
				data: { number: null },
			});

			// Step 3: Reassign each phase one at a time (safe — all numbers are null)
			for (const p of affected) {
				if (p.phase_id === phaseId) {
					// The dragged phase lands at the target
					await tx.phases.update({
						where: { phase_id: p.phase_id },
						data: { number: targetNumber },
					});
				} else if (oldNumber < targetNumber) {
					// Moving right: items shift down by 1
					await tx.phases.update({
						where: { phase_id: p.phase_id },
						data: { number: p.number! - 1 },
					});
				} else {
					// Moving left: items shift up by 1
					await tx.phases.update({
						where: { phase_id: p.phase_id },
						data: { number: p.number! + 1 },
					});
				}
			}
		});

		return { success: true };
	} catch (error) {
		console.error("Failed to reorder phase:", error);
		return { success: false, error: "Failed to reorder phases." };
	}
}
