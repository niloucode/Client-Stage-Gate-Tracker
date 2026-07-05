"use server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/lib/generated/prisma";
import { cascadeSoftDeleteModule } from "../module/moduleActions";

export type EntityFilterStatus = 'active' | 'deleted' | 'all';

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
    endDate?: Date | null
) {
    try {
        const existingPhasesCount = await prisma.phases.count({
            where: {
                stage_id: stageId,
                is_deleted: false,
            },
        });
        const nextPhaseNumber = existingPhasesCount + 1;

        const newPhase = await prisma.phases.create({
            data: {
                name: phaseName,
                number: nextPhaseNumber,                end_date: endDate,
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
export async function getPhaseById(phaseId: string, status: EntityFilterStatus = 'active') {
    try {
        const isDeletedFilter = status === 'active' ? false : status === 'deleted' ? true : undefined;

        const phase = await prisma.phases.findUnique({
            where: {
                phase_id: phaseId,
                is_deleted: isDeletedFilter,
            },
        });

        if (!phase) {
            return { success: false, error: "Phase not found or does not match the requested status." };
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
export async function getModulesByPhaseId(phaseId: string, status: EntityFilterStatus = 'active') {
    try {
        const isDeletedFilter = status === 'active' ? false : status === 'deleted' ? true : undefined;

        const modules = await prisma.modules.findMany({
            where: {
                phase_id: phaseId,
                is_deleted: isDeletedFilter,
            },
            orderBy: {
                creation_date: 'asc',
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
    endDate?: Date | null
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
                is_deleted: false
            },
        });
        if (attachedModulesCount > 0) {
            return {
                success: false,
                error: `Cannot archive phase. Please remove or archive all ${attachedModulesCount} associated module(s) first.`
            };
        }

        await prisma.phases.update({
            where: { phase_id: phaseId },
            data: {
                is_deleted: true,
                deleted_at: new Date(),
                number: null,
            } as any,
        });
        return { success: true };
    } catch (error) {
        console.error("Failed to soft delete phase:", error);
        return { success: false, error: "Failed to archive the phase due to a database error." };
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
export async function cascadeSoftDeletePhase(phaseId: string, txClient?: Prisma.TransactionClient) {
    const executeLogic = async (tx: Prisma.TransactionClient) => {
        await tx.phases.update({
            where: { phase_id: phaseId },
            data: { is_deleted: true, deleted_at: new Date(), number: null } as any
        });

        const childModules = await tx.modules.findMany({
            where: { phase_id: phaseId, is_deleted: false },
            select: { module_id: true }
        });

        for (const childModule of childModules) {
            await cascadeSoftDeleteModule(childModule.module_id, tx);
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
 * Swaps the sequential 'number' values of two phases.
 * This function utilizes a Prisma interactive transaction to fetch the current
 * numbers of both phases and perform the updates simultaneously. This approach
 * guarantees database consistency by ensuring that if one update fails, the
 * other is rolled back, preventing duplicate sequence numbers from being assigned.
 *
 * @param {string} phaseId1 - The UUID of the first phase.
 * @param {string} phaseId2 - The UUID of the second phase.
 * @returns {Promise<{success: boolean, error?: string}>}
 * Returns `success: true` if the transaction completes successfully.
 * Returns `success: false` and an error message if the phases cannot be found or the database update fails.
 */
export async function swapPhaseOrder(phaseId1: string, phaseId2: string) {
    try {
        await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
            const phase1 = await tx.phases.findUnique({ where: { phase_id: phaseId1 } });
            const phase2 = await tx.phases.findUnique({ where: { phase_id: phaseId2 } });

            if (!phase1 || !phase2) {
                throw new Error("One or both phases could not be found.");
            }

            await tx.phases.update({
                where: { phase_id: phaseId1 },
                data: { number: phase2.number },
            });

            await tx.phases.update({
                where: { phase_id: phaseId2 },
                data: { number: phase1.number },
            });
        });

        return { success: true };
    } catch (error) {
        console.error("Failed to swap phase orders:", error);
        return { success: false, error: "Failed to reorder phases." };
    }
}