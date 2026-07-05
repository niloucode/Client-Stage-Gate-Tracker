"use server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/lib/generated/prisma";
import { cascadeSoftDeleteWorkflow } from "../workflow/workflowActions";

export type EntityFilterStatus = 'active' | 'deleted' | 'all';

/**
 * Creates a new module and maps it to its parent phase.
 *
 * @param {string} phaseId - The UUID of the parent phase this module belongs to.
 * @param {string} moduleName - The display name of the module (e.g., "Module 1", "Authentication").
 * @param {string | null} [description] - (Optional) A brief description of the module's purpose.
 * @param {Date | null} [startDate] - (Optional) The scheduled start date of the module.
 * @param {Date | null} [endDate] - (Optional) The scheduled end date of the module.
 * @returns {Promise<{success: boolean, data?: any, error?: string}>}
 * Returns `success: true` and the newly created module object if successful.
 * Returns `success: false` and an error message if the creation fails.
 */
export async function createModule(
    phaseId: string,
    moduleName: string,
    startDate?: Date | null,
    endDate?: Date | null
) {
    try {
        const newModule = await prisma.modules.create({
            data: {
                name: moduleName,                end_date: endDate,
                phase_id: phaseId,
            },
        });
        return { success: true, data: newModule };
    } catch (error) {
        console.error("Failed to create module:", error);
        return { success: false, error: "Failed to create module." };
    }
}


/**
 * Retrieves a specific module from the database using its unique ID.
 * Includes the relational link to its parent phase.
 * Uses a status filter to determine if the module can be retrieved based on its deletion state:
 * - 'active' (default): Only retrieves the module if it is NOT soft-deleted.
 * - 'deleted': Only retrieves the module if it IS soft-deleted (useful for recycle bin views).
 * - 'all': Retrieves the module regardless of its deletion status.
 * Security Note: Ensure user authorization claims are verified before execution.
 *
 * @param {string} moduleId - The UUID of the module to retrieve.
 * @returns {Promise<{success: boolean, data?: any, error?: string}>}
 * Returns `success: true` and the module object if found.
 * Returns `success: false` and an error message if the module does not exist, does not match the requested status, or the query fails.
 */
export async function getModuleById(moduleId: string, status: EntityFilterStatus = 'active') {
    try {
        const isDeletedFilter = status === 'active' ? false : status === 'deleted' ? true : undefined;

        const moduleData = await prisma.modules.findUnique({
            where: {
                module_id: moduleId,
                is_deleted: isDeletedFilter,
            },
            include: {
                Phases: true,
            },
        });

        if (!moduleData) {
            return { success: false, error: "Module not found or does not match the requested status." };
        }
        return { success: true, data: moduleData };
    } catch (error) {
        console.error("Failed to fetch module:", error);
        return { success: false, error: "Failed to fetch module details." };
    }
}

/**
 * Retrieves all workflows belonging to a specific module.
 * Uses a status filter to determine which workflows to return based on their deletion state:
 * - 'active' (default): Returns only workflows that are NOT soft-deleted.
 * - 'deleted': Returns only workflows that ARE soft-deleted (useful for recycle bin views).
 * - 'all': Bypasses the filter and returns everything.
 * Workflows are returned in ascending chronological order based on their 'creation_date' field.
 *
 * @param {string} moduleId - The UUID of the parent module.
 * @param {EntityFilterStatus} [status='active'] - The deletion status filter.
 * @returns {Promise<{success: boolean, data?: any, error?: string}>}
 * Returns `success: true` and an array of workflows if the query is successful.
 * Returns `success: false` and an error message if the query fails.
 */
export async function getWorkflowsByModuleId(moduleId: string, status: EntityFilterStatus = 'active') {
    try {
        const isDeletedFilter = status === 'active' ? false : status === 'deleted' ? true : undefined;

        const workflows = await prisma.workflows.findMany({
            where: {
                module_id: moduleId,
                is_deleted: isDeletedFilter,
            },
            orderBy: {
                creation_date: 'asc',
            },
        });

        return { success: true, data: workflows };
    } catch (error) {
        console.error("Failed to fetch workflows for module:", error);
        return { success: false, error: "Failed to fetch workflows." };
    }
}

/**
 * Updates an existing module's details in the database.
 *
 * @param {string} moduleId - The UUID of the module to update.
 * @param {string} [moduleName] - (Optional) The new name for the module.
 * @param {string | null} [description] - (Optional) The new description for the module.
 * @param {Date | null} [startDate] - (Optional) The new scheduled start date.
 * @param {Date | null} [endDate] - (Optional) The new scheduled end date.
 * @returns {Promise<{success: boolean, data?: any, error?: string}>}
 * Returns `success: true` and the updated module object if successful.
 * Returns `success: false` and an error message if the update fails.
 */
export async function updateModule(
    moduleId: string,
    moduleName?: string,
    startDate?: Date | null,
    endDate?: Date | null
) {
    try {
        const updatedModule = await prisma.modules.update({
            where: {
                module_id: moduleId,
            },
            data: {
                name: moduleName,                end_date: endDate,
            },
        });
        return { success: true, data: updatedModule };
    } catch (error) {
        console.error("Failed to update module:", error);
        return { success: false, error: "Failed to update module details." };
    }
}


/**
 * Performs a "soft delete" on a module by marking it as deleted instead of permanently erasing it.
 * This acts like a recycle bin, preserving historical data and preventing database corruption.
 * Note: Archiving is blocked if the module contains active child workflows to ensure operational integrity.
 *
 * @param {string} moduleId - The UUID of the module to soft delete.
 * @returns {Promise<{success: boolean, error?: string}>}
 * Returns `success: true` if the module was successfully archived.
 * Returns `success: false` and an error message if the module contains workflows or the query fails.
 */
export async function softDeleteModule(moduleId: string) {
    try {
        const attachedWorkflowsCount = await prisma.workflows.count({
            where: {
                module_id: moduleId,
                is_deleted: false
            },
        });
        if (attachedWorkflowsCount > 0) {
            return {
                success: false,
                error: `Cannot archive module. Please remove or archive all ${attachedWorkflowsCount} associated workflow(s) first.`
            };
        }

        await prisma.modules.update({
            where: { module_id: moduleId },
            data: {
                is_deleted: true,
                deleted_at: new Date(),
            },
        });
        return { success: true };
    } catch (error) {
        console.error("Failed to soft delete module:", error);
        return { success: false, error: "Failed to archive the module due to a database error." };
    }
}

/**
 * Performs a cascading soft delete on a module and all its nested children.
 * This function integrates with Prisma interactive transactions by accepting an optional
 * txClient. It soft deletes the targeted module, retrieves all dependent workflows,
 * and iterates through them to execute the workflow-level cascade function, passing
 * the transaction forward to maintain consistency.
 *
 * @param {string} moduleId - The UUID of the module to archive.
 * @param {any} [txClient] - (Optional) The Prisma transaction context to maintain database integrity.
 * @returns {Promise<{success: boolean, error?: string}>}
 * Returns `success: true` upon successful cascade.
 * Returns `success: false` and an error message if the operation fails, or throws an error to trigger a rollback if executed within a parent transaction.
 */
export async function cascadeSoftDeleteModule(moduleId: string, txClient?: Prisma.TransactionClient) {
    const executeLogic = async (tx: Prisma.TransactionClient) => {
        await tx.modules.update({
            where: { module_id: moduleId },
            data: { is_deleted: true, deleted_at: new Date() }
        });

        const childWorkflows = await tx.workflows.findMany({
            where: { module_id: moduleId, is_deleted: false },
            select: { workflow_id: true }
        });

        for (const workflow of childWorkflows) {
            await cascadeSoftDeleteWorkflow(workflow.workflow_id, tx);
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
        console.error("Failed cascading soft delete for module:", error);
        if (txClient) throw error;
        return { success: false, error: "Failed to cascade archive module." };
    }
}