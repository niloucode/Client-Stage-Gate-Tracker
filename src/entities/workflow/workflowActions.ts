"use server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/lib/generated/prisma";
import {
	assertProjectMember,
	assertProjectMemberNotClient,
	resolveModuleProject,
	resolveWorkflowProject,
} from "@/lib/auth/projectAccess";
import { generateKeyBetween } from "fractional-indexing";
import { reorderBySortKey } from "@/shared/lib/fractionalSort";
import {
	workflowCreateSchema,
	workflowUpdateSchema,
	type WorkflowCreateInput,
	type WorkflowUpdateInput,
} from "@/shared/schemas";
import type { EntityFilterStatus } from "@/entities/types";

/**
 * Creates a workflow under a module. Appends after the last sibling via a
 * fractional sort key (no renumbering); missing plan dates default to now.
 *
 * @param moduleId - UUID of the parent module.
 * @param input - Validated create payload (workflowCreateSchema).
 */
export async function createWorkflow(
	moduleId: string,
	input: WorkflowCreateInput,
) {
	z.uuid().parse(moduleId);
	const parsed = workflowCreateSchema.safeParse(input);
	if (!parsed.success) {
		return { success: false, error: "Invalid workflow data." };
	}
	const { name, planStart, planEnd, actualStart, actualEnd, isApproved } =
		parsed.data;

	// Authorization: caller must be a member of the parent project
	const projectId = await resolveModuleProject(moduleId);
	if (!projectId) return { success: false, error: "Module not found." };
	const auth = await assertProjectMemberNotClient(projectId);
	if (!auth.ok) return { success: false, error: auth.error };
	try {
		// Fractional sort key: append after the last sibling — a single-key
		// insert that never requires renumbering existing rows.
		const lastWorkflow = await prisma.workflows.findFirst({
			where: { module_id: moduleId, is_deleted: false },
			orderBy: { sort_key: { sort: "desc", nulls: "last" } },
			select: { sort_key: true },
		});
		const nextKey = generateKeyBetween(lastWorkflow?.sort_key ?? null, null);

		const newWorkflow = await prisma.workflows.create({
			data: {
				name,
				sort_key: nextKey,
				plan_start_at: planStart ?? new Date(),
				actual_end_at: actualEnd ?? null,
				actual_start_at: actualStart ?? null,
				is_approved: isApproved ?? false,
				module_id: moduleId,
				plan_end_at: planEnd ?? new Date(),
			},
		});
		return { success: true, data: newWorkflow };
	} catch (error) {
		console.error("Failed to create workflow:", error);
		return { success: false, error: "Failed to create workflow." };
	}
}

/**
 * Fetches one workflow (with its module + phase) by deletion status.
 *
 * @param workflowId - UUID of the workflow.
 * @param status - active (default) | deleted | all.
 */
export async function getWorkflowById(
	workflowId: string,
	status: EntityFilterStatus = "active",
) {
	z.uuid().parse(workflowId);
	try {
		const isDeletedFilter =
			status === "active" ? false : status === "deleted" ? true : undefined;

		// Membership guard (2026-08-14, ticket deep-link audit): the
		// workflow board is now reachable via ticket links from the
		// dashboards — non-members (including anonymous) must not read the
		// workflow tree. Clients pass as members (read-only).
		const projectId = await resolveWorkflowProject(workflowId);
		if (!projectId) {
			return {
				success: false,
				error: "Workflow not found or does not match the requested status.",
			};
		}
		const auth = await assertProjectMember(projectId);
		if (!auth.ok) {
			return { success: false, error: auth.error };
		}

		const workflowData = await prisma.workflows.findUnique({
			where: {
				workflow_id: workflowId,
				is_deleted: isDeletedFilter,
			},
			include: {
				Modules: {
					include: {
						Phases: true,
					},
				},
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
 * Updates a workflow's scheduling/approval fields. Only provided fields are
 * written (undefined values are skipped by Prisma).
 *
 * @param workflowId - UUID of the workflow to update.
 * @param input - Validated partial payload (workflowUpdateSchema).
 */
export async function updateWorkflow(
	workflowId: string,
	input: WorkflowUpdateInput,
) {
	z.uuid().parse(workflowId);
	const parsed = workflowUpdateSchema.safeParse(input);
	if (!parsed.success) {
		return { success: false, error: "Invalid workflow data." };
	}
	const { name, planStart, planEnd, actualStart, actualEnd, isApproved } =
		parsed.data;

	// Authorization: caller must be a member of the parent project
	const projectId = await resolveWorkflowProject(workflowId);
	if (!projectId) return { success: false, error: "Workflow not found." };
	const auth = await assertProjectMemberNotClient(projectId);
	if (!auth.ok) return { success: false, error: auth.error };
	try {
		const updatedWorkflow = await prisma.workflows.update({
			where: {
				workflow_id: workflowId,
			},
			data: {
				name: name ?? undefined,
				plan_start_at: planStart ?? undefined,
				actual_end_at: actualEnd ?? undefined,
				actual_start_at: actualStart ?? undefined,
				plan_end_at: planEnd ?? undefined,
				is_approved: isApproved,
			},
		});
		return { success: true, data: updatedWorkflow };
	} catch (error) {
		console.error("Failed to update workflow:", error);
		return { success: false, error: "Failed to update workflow details." };
	}
}

export async function cascadeSoftDeleteWorkflow(
	workflowId: string,
	txClient?: Prisma.TransactionClient,
) {
	// Authorization: caller must be a member of the parent project
	const projectId = await resolveWorkflowProject(workflowId);
	if (!projectId) return { success: false, error: "Workflow not found." };
	const auth = await assertProjectMemberNotClient(projectId);
	if (!auth.ok) return { success: false, error: auth.error };
	const executeLogic = async (tx: Prisma.TransactionClient) => {
		await tx.workflows.update({
			where: { workflow_id: workflowId },
			data: { is_deleted: true, deleted_at: new Date(), number: null },
		});

		// Batch child tickets with a single updateMany instead of per-ticket calls
		const childTickets = await tx.tickets.findMany({
			where: { workflow_id: workflowId, is_deleted: false },
			select: { ticket_id: true },
		});
		const ticketIds = childTickets.map((t) => t.ticket_id);

		if (ticketIds.length > 0) {
			await tx.tickets.updateMany({
				where: { ticket_id: { in: ticketIds } },
				data: { is_deleted: true, deleted_at: new Date() },
			});
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
 * Moves a workflow to a new sequential position via fractional indexing:
 * computes the sort key between the neighbors at the target position and
 * updates a single row (see shared/lib/fractionalSort). No renumbering,
 * no unique-constraint intermediate states.
 *
 * @param workflowId - UUID of the workflow being moved.
 * @param targetNumber - The desired 1-based position.
 */
export async function reorderWorkflow(
	workflowId: string,
	targetNumber: number,
) {
	z.uuid().parse(workflowId);
	z.number().int().min(1).parse(targetNumber);

	// Authorization: caller must be a member of the parent project
	const projectId = await resolveWorkflowProject(workflowId);
	if (!projectId) return { success: false, error: "Workflow not found." };
	const auth = await assertProjectMemberNotClient(projectId);
	if (!auth.ok) return { success: false, error: auth.error };
	try {
		await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
			const wf = await tx.workflows.findUnique({
				where: { workflow_id: workflowId },
				select: { module_id: true },
			});

			if (!wf) {
				throw new Error(`Workflow ${workflowId} not found.`);
			}

			// Fractional-indexing move via the shared core (Task 3.4):
			// compute the key between the neighbors at the target position
			// and update a single row. No renumbering.
			const siblings = await tx.workflows.findMany({
				where: {
					module_id: wf.module_id,
					is_deleted: false,
					sort_key: { not: null },
				},
				select: { workflow_id: true, sort_key: true },
				orderBy: { sort_key: { sort: "asc", nulls: "last" } },
			});

			const result = reorderBySortKey(
				siblings.map((s) => ({ id: s.workflow_id, sort_key: s.sort_key })),
				workflowId,
				targetNumber,
			);
			if (!result.success) {
				throw new Error(result.error);
			}
			if (result.newKey === undefined) return;

			await tx.workflows.update({
				where: { workflow_id: workflowId },
				data: { sort_key: result.newKey },
			});
		});

		return { success: true };
	} catch (error) {
		console.error("Failed to reorder workflow:", error);
		return { success: false, error: "Failed to reorder workflows." };
	}
}
