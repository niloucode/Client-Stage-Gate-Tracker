"use server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/lib/generated/prisma";
import {
	assertProjectMemberNotClient,
	assertProjectMemberOrClient,
	resolveModuleProject,
	resolvePhaseProject,
} from "@/lib/auth/projectAccess";
import {
	moduleCreateSchema,
	moduleUpdateSchema,
	type ModuleCreateInput,
	type ModuleUpdateInput,
} from "@/shared/schemas";
import { softDeleteWorkflowSubtree } from "@/entities/ticket/lib/softDelete";
import { moduleGanttSelect } from "./ganttTypes";

/**
 * Creates a module under a phase. Scheduling fields use the canonical
 * vocabulary (planStart/planEnd/actualStart/actualEnd); missing plan dates
 * default to now so the module is immediately schedulable.
 *
 * @param phaseId - UUID of the parent phase.
 * @param input - Validated create payload (moduleCreateSchema).
 */
export async function createModule(phaseId: string, input: ModuleCreateInput) {
	const parsed = moduleCreateSchema.safeParse(input);
	if (!parsed.success) {
		return { success: false, error: "Invalid module data." };
	}
	const { name, planStart, planEnd, actualStart, actualEnd } = parsed.data;

	// Authorization: caller must be a member of the parent project
	const projectId = await resolvePhaseProject(phaseId);
	if (!projectId) return { success: false, error: "Phase not found." };
	const auth = await assertProjectMemberNotClient(projectId);
	if (!auth.ok) return { success: false, error: auth.error };
	try {
		const newModule = await prisma.modules.create({
			data: {
				name,
				// Date rules: plan dates required (schema-enforced) — no fallback
				plan_start_at: planStart,
				actual_end_at: actualEnd ?? null,
				actual_start_at: actualStart ?? null,
				plan_end_at: planEnd,
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
 * Updates a module's scheduling/name fields. Only provided fields are
 * written (undefined values are skipped by Prisma).
 *
 * @param moduleId - UUID of the module to update.
 * @param input - Validated partial payload (moduleUpdateSchema).
 */
export async function updateModule(moduleId: string, input: ModuleUpdateInput) {
	const parsed = moduleUpdateSchema.safeParse(input);
	if (!parsed.success) {
		return { success: false, error: "Invalid module data." };
	}
	const { name, planStart, planEnd, actualStart, actualEnd } = parsed.data;

	// Authorization: caller must be a member of the parent project
	const projectId = await resolveModuleProject(moduleId);
	if (!projectId) return { success: false, error: "Module not found." };
	const auth = await assertProjectMemberNotClient(projectId);
	if (!auth.ok) return { success: false, error: auth.error };
	try {
		const updatedModule = await prisma.modules.update({
			where: {
				module_id: moduleId,
			},
			data: {
				name: name ?? undefined,
				plan_start_at: planStart ?? undefined,
				actual_end_at: actualEnd ?? undefined,
				actual_start_at: actualStart ?? undefined,
				plan_end_at: planEnd ?? undefined,
			},
		});
		return { success: true, data: updatedModule };
	} catch (error) {
		console.error("Failed to update module:", error);
		return { success: false, error: "Failed to update module details." };
	}
}

/**
 * Cascading soft delete: module + its workflows + their tickets, batched
 * per level (one updateMany each). Runs in the caller's transaction when
 * `txClient` is provided, otherwise in its own; inside a parent transaction
 * failures rethrow so the parent rolls back.
 *
 * @param moduleId - UUID of the module to archive.
 * @param txClient - Optional Prisma transaction to join (used by stage-level cascades).
 */
export async function cascadeSoftDeleteModule(
	moduleId: string,
	txClient?: Prisma.TransactionClient,
) {
	// Authorization: caller must be a member of the parent project
	const projectId = await resolveModuleProject(moduleId);
	if (!projectId) return { success: false, error: "Module not found." };
	const auth = await assertProjectMemberNotClient(projectId);
	if (!auth.ok) return { success: false, error: auth.error };
	const executeLogic = async (tx: Prisma.TransactionClient) => {
		await tx.modules.update({
			where: { module_id: moduleId },
			data: { is_deleted: true, deleted_at: new Date() },
		});

		// Batch the whole subtree: one updateMany per level instead of
		// per-child cascade calls.
		const childWorkflows = await tx.workflows.findMany({
			where: { module_id: moduleId, is_deleted: false },
			select: { workflow_id: true },
		});
		const workflowIds = childWorkflows.map((w) => w.workflow_id);

		await softDeleteWorkflowSubtree(tx, workflowIds);
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

/**
 * Project-scoped module rows for the gantt chart (read-only). Any project
 * profile — team, owners AND clients — may view (2026-08-15 spec).
 */
export async function getProjectModulesGantt(projectId: string) {
	z.uuid().parse(projectId);
	const auth = await assertProjectMemberOrClient(projectId);
	if (!auth.ok) return { success: false as const, error: auth.error };
	try {
		const modules = await prisma.modules.findMany({
			where: {
				is_deleted: false,
				Phases: {
					is_deleted: false,
					Stages: { is_deleted: false, project_id: projectId },
				},
			},
			orderBy: { plan_start_at: "asc" },
			select: moduleGanttSelect,
		});
		return { success: true as const, data: modules };
	} catch (error) {
		console.error("Failed to fetch project modules for gantt:", error);
		return { success: false as const, error: "Failed to load modules." };
	}
}
