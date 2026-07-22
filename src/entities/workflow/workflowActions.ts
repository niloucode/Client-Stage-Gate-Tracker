"use server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/lib/generated/prisma";
import { cascadeSoftDeleteTicket } from "../ticket/ticketActions";

export type EntityFilterStatus = "active" | "deleted" | "all";

/**
 * Creates a new workflow and maps it to its parent module.
 *
 * @param {string} moduleId - The UUID of the parent module this workflow belongs to.
 * @param {string} workflowName - The display name of the workflow (e.g., "Workflow 1").
 * @param {Date | null} [startDate] - (Optional) The scheduled start date of the workflow.
 * @param {Date | null} [endDate] - (Optional) The scheduled end date of the workflow.
 * @param {boolean} [isApproved=false] - (Optional) The approval status of the workflow.
 * @returns {Promise<{success: boolean, data?: any, error?: string}>}
 * Returns `success: true` and the newly created workflow object if successful.
 * Returns `success: false` and an error message if the creation fails.
 */
export async function createWorkflow(
	moduleId: string,
	workflowName: string,
	startDate?: Date | null,
	endDate?: Date | null,
	deadlineDate?: Date | null,
	isApproved: boolean = false,
) {
	try {
		const maxNumber = await prisma.workflows.aggregate({
			where: { module_id: moduleId, is_deleted: false },
			_max: { number: true },
		});
		const nextNumber = (maxNumber._max.number ?? 0) + 1;

		const newWorkflow = await prisma.workflows.create({
			data: {
				name: workflowName,
				start_date: startDate,
				finish_date: endDate,
				is_approved: isApproved,
				number: nextNumber,
				module_id: moduleId,
				deadline_date: deadlineDate ?? null,
			},
		});
		return { success: true, data: newWorkflow };
	} catch (error) {
		console.error("Failed to create workflow:", error);
		return { success: false, error: "Failed to create workflow." };
	}
}

/**
 * Retrieves a specific workflow from the database using its unique ID.
 * Includes the relational link to its parent module.
 * Uses a status filter to determine if the workflow can be retrieved based on its deletion state:
 * - 'active' (default): Only retrieves the workflow if it is NOT soft-deleted.
 * - 'deleted': Only retrieves the workflow if it IS soft-deleted (useful for recycle bin views).
 * - 'all': Retrieves the workflow regardless of its deletion status.
 * Security Note: Ensure user authorization claims are verified before execution.
 *
 * @param {string} workflowId - The UUID of the workflow to retrieve.
 * @param {EntityFilterStatus} [status='active'] - The deletion status filter.
 * @returns {Promise<{success: boolean, data?: any, error?: string}>}
 * Returns `success: true` and the workflow object if found.
 * Returns `success: false` and an error message if the workflow does not exist, does not match the requested status, or the query fails.
 */
export async function getWorkflowById(
	workflowId: string,
	status: EntityFilterStatus = "active",
) {
	try {
		const isDeletedFilter =
			status === "active" ? false : status === "deleted" ? true : undefined;

		const workflowData = await prisma.workflows.findUnique({
			where: {
				workflow_id: workflowId,
				is_deleted: isDeletedFilter,
			},
			include: {
				Modules: true,
			},
		});

		if (!workflowData) {
			return {
				success: false,
				error: "Workflow not found or does not match the requested status.",
			};
		}
		return { success: true, data: workflowData };
	} catch (error) {
		console.error("Failed to fetch workflow:", error);
		return { success: false, error: "Failed to fetch workflow details." };
	}
}

/**
 * Retrieves all tickets belonging to a specific workflow.
 * Uses a status filter to determine which tickets to return based on their deletion state:
 * - 'active' (default): Returns only tickets that are NOT soft-deleted.
 * - 'deleted': Returns only tickets that ARE soft-deleted (useful for recycle bin views).
 * - 'all': Bypasses the filter and returns everything.
 * Tickets are returned in ascending chronological order based on their 'start_date' field.
 *
 * @param {string} workflowId - The UUID of the parent workflow.
 * @param {EntityFilterStatus} [status='active'] - The deletion status filter.
 * @returns {Promise<{success: boolean, data?: any, error?: string}>}
 * Returns `success: true` and an array of tickets if the query is successful.
 * Returns `success: false` and an error message if the query fails.
 */
export async function getTicketsByWorkflowId(
	workflowId: string,
	status: EntityFilterStatus = "active",
) {
	try {
		const isDeletedFilter =
			status === "active" ? false : status === "deleted" ? true : undefined;

		const tickets = await prisma.tickets.findMany({
			where: {
				workflow_id: workflowId,
				is_deleted: isDeletedFilter,
			},
			orderBy: {
				start_date: "asc",
			},
		});

		return { success: true, data: tickets };
	} catch (error) {
		console.error("Failed to fetch tickets for workflow:", error);
		return { success: false, error: "Failed to fetch tickets." };
	}
}

/**
 * Updates an existing workflow's details in the database.
 *
 * @param {string} workflowId - The UUID of the workflow to update.
 * @param {string} [workflowName] - (Optional) The new name for the workflow.
 * @param {Date | null} [startDate] - (Optional) The new scheduled start date.
 * @param {Date | null} [endDate] - (Optional) The new scheduled end date.
 * @param {boolean} [isApproved] - (Optional) The new approval status.
 * @returns {Promise<{success: boolean, data?: any, error?: string}>}
 * Returns `success: true` and the updated workflow object if successful.
 * Returns `success: false` and an error message if the update fails.
 */
export async function updateWorkflow(
	workflowId: string,
	workflowName?: string,
	startDate?: Date | null,
	endDate?: Date | null,
	isApproved?: boolean,
	deadlineDate?: Date | null,
) {
	try {
		const updatedWorkflow = await prisma.workflows.update({
			where: {
				workflow_id: workflowId,
			},
			data: {
				name: workflowName,
				start_date: startDate,
				finish_date: endDate,
				deadline_date: deadlineDate,
				is_approved: isApproved,
			},
		});
		return { success: true, data: updatedWorkflow };
	} catch (error) {
		console.error("Failed to update workflow:", error);
		return { success: false, error: "Failed to update workflow details." };
	}
}

/**
 * Performs a "soft delete" on a workflow by marking it as deleted instead of permanently erasing it.
 * This acts like a recycle bin, preserving historical data and preventing database corruption.
 * Note: Archiving is blocked if the workflow contains active child tickets to ensure operational integrity.
 *
 * @param {string} workflowId - The UUID of the workflow to soft delete.
 * @returns {Promise<{success: boolean, error?: string}>}
 * Returns `success: true` if the workflow was successfully archived.
 * Returns `success: false` and an error message if the workflow contains tickets or the query fails.
 */
export async function softDeleteWorkflow(workflowId: string) {
	try {
		const attachedTicketsCount = await prisma.tickets.count({
			where: {
				workflow_id: workflowId,
				is_deleted: false,
			},
		});
		if (attachedTicketsCount > 0) {
			return {
				success: false,
				error: `Cannot archive workflow. Please remove or archive all ${attachedTicketsCount} associated ticket(s) first.`,
			};
		}

		await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
			// Read the workflow's number before nulling it
			const wf = await tx.workflows.findUnique({
				where: { workflow_id: workflowId },
				select: { module_id: true, number: true },
			});

			await tx.workflows.update({
				where: { workflow_id: workflowId },
				data: {
					is_deleted: true,
					deleted_at: new Date(),
					number: null,
				} as any,
			});

			// Renumber remaining workflows to close the gap
			if (wf?.number != null) {
				const higherWorkflows = await tx.workflows.findMany({
					where: {
						module_id: wf.module_id,
						number: { gt: wf.number },
						is_deleted: false,
					},
					select: { workflow_id: true, number: true },
					orderBy: { number: "asc" },
				});

				if (higherWorkflows.length > 0) {
					await tx.workflows.updateMany({
						where: {
							workflow_id: {
								in: higherWorkflows.map((w) => w.workflow_id),
							},
						},
						data: { number: null },
					});

					for (const w of higherWorkflows) {
						await tx.workflows.update({
							where: { workflow_id: w.workflow_id },
							data: { number: w.number! - 1 },
						});
					}
				}
			}
		});

		return { success: true };
	} catch (error) {
		console.error("Failed to soft delete workflow:", error);
		return {
			success: false,
			error: "Failed to archive the workflow due to a database error.",
		};
	}
}

/**
 * Performs a cascading soft delete on a workflow and all its nested tickets.
 * This function operates inside a provided Prisma transaction (txClient) to ensure
 * rollback integrity. It soft deletes the workflow and retrieves all associated tickets.
 * A placeholder is currently set in the execution loop to await the creation of
 * a future 'cascadeSoftDeleteTicket' action.
 *
 * @param {string} workflowId - The UUID of the workflow to archive.
 * @param {any} [txClient] - (Optional) The Prisma transaction context to maintain database integrity.
 * @returns {Promise<{success: boolean, error?: string}>}
 * Returns `success: true` upon successful cascade.
 * Returns `success: false` and an error message if the operation fails, or throws an error to trigger a rollback if executed within a parent transaction.
 */
export async function cascadeSoftDeleteWorkflow(
	workflowId: string,
	txClient?: Prisma.TransactionClient,
) {
	const executeLogic = async (tx: Prisma.TransactionClient) => {
		// Read the workflow's number before nulling it
		const wf = await tx.workflows.findUnique({
			where: { workflow_id: workflowId },
			select: { module_id: true, number: true },
		});

		await tx.workflows.update({
			where: { workflow_id: workflowId },
			data: { is_deleted: true, deleted_at: new Date(), number: null } as any,
		});

		const childTickets = await tx.tickets.findMany({
			where: { workflow_id: workflowId, is_deleted: false },
			select: { ticket_id: true },
		});

		for (const ticket of childTickets) {
			await cascadeSoftDeleteTicket(ticket.ticket_id, undefined, tx);
		}

		// Renumber remaining workflows to close the gap
		if (wf?.number != null) {
			const higherWorkflows = await tx.workflows.findMany({
				where: {
					module_id: wf.module_id,
					number: { gt: wf.number },
					is_deleted: false,
				},
				select: { workflow_id: true, number: true },
				orderBy: { number: "asc" },
			});

			if (higherWorkflows.length > 0) {
				await tx.workflows.updateMany({
					where: {
						workflow_id: {
							in: higherWorkflows.map((w) => w.workflow_id),
						},
					},
					data: { number: null },
				});

				for (const w of higherWorkflows) {
					await tx.workflows.update({
						where: { workflow_id: w.workflow_id },
						data: { number: w.number! - 1 },
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
		console.error("Failed cascading soft delete for workflow:", error);
		if (txClient) throw error;
		return { success: false, error: "Failed to cascade archive workflow." };
	}
}

/**
 * Moves a workflow to a new sequential position by its target number.
 * Uses an insertion-based algorithm inside a Prisma interactive transaction:
 *  1. Fetch all affected workflows (dragged + every workflow between old and target).
 *  2. Null ALL their numbers in one updateMany (multiple NULLs don't violate
 *     the @@unique([number, module_id]) constraint).
 *  3. Reassign each workflow one at a time: the dragged workflow gets the target
 *     number, every other workflow shifts by ±1.
 *
 * This avoids PostgreSQL per-row unique checks on intermediate states.
 *
 * @param {string} workflowId   - The UUID of the workflow being moved.
 * @param {number} targetNumber - The desired sequential position (1-based).
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function reorderWorkflow(
	workflowId: string,
	targetNumber: number,
) {
	try {
		await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
			const wf = await tx.workflows.findUnique({
				where: { workflow_id: workflowId },
			});

			if (!wf) {
				throw new Error(`Workflow ${workflowId} not found.`);
			}
			if (wf.number === null) {
				throw new Error(
					`Workflow ${workflowId} has no sequence number (number is null).`,
				);
			}

			const moduleId = wf.module_id;
			const oldNumber = wf.number;

			// No-op if already at the target position
			if (oldNumber === targetNumber) return;

			// Validate target range
			const activeCount = await tx.workflows.count({
				where: { module_id: moduleId, is_deleted: false },
			});
			if (targetNumber < 1 || targetNumber > activeCount) {
				throw new Error(
					`Target number ${targetNumber} is out of bounds (1–${activeCount}).`,
				);
			}

			// Step 1: Fetch every workflow in the affected range (dragged + shifted)
			const rangeStart = Math.min(oldNumber, targetNumber);
			const rangeEnd = Math.max(oldNumber, targetNumber);
			const affected = await tx.workflows.findMany({
				where: {
					module_id: moduleId,
					number: { gte: rangeStart, lte: rangeEnd },
					is_deleted: false,
				},
				select: { workflow_id: true, number: true },
			});

			// Step 2: Null ALL affected workflows at once —
			//         multiple NULLs don't violate the unique constraint
			await tx.workflows.updateMany({
				where: {
					workflow_id: { in: affected.map((w) => w.workflow_id) },
				},
				data: { number: null },
			});

			// Step 3: Reassign each workflow one at a time (safe — all numbers are null)
			for (const w of affected) {
				if (w.workflow_id === workflowId) {
					// The dragged workflow lands at the target
					await tx.workflows.update({
						where: { workflow_id: w.workflow_id },
						data: { number: targetNumber },
					});
				} else if (oldNumber < targetNumber) {
					// Moving right: items shift down by 1
					await tx.workflows.update({
						where: { workflow_id: w.workflow_id },
						data: { number: w.number! - 1 },
					});
				} else {
					// Moving left: items shift up by 1
					await tx.workflows.update({
						where: { workflow_id: w.workflow_id },
						data: { number: w.number! + 1 },
					});
				}
			}
		});

		return { success: true };
	} catch (error) {
		console.error("Failed to reorder workflow:", error);
		return { success: false, error: "Failed to reorder workflows." };
	}
}
