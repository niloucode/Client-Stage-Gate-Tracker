"use server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/lib/generated/prisma";
import {
	assertProjectMember,
	resolveStageProject,
} from "@/lib/auth/projectAccess";
import { generateKeyBetween } from "fractional-indexing";

/**
 * Creates a stage under a project. Appends after the last sibling via a
 * fractional sort key (no renumbering); missing plan dates default to now.
 *
 * @param projectId - UUID of the parent project.
 * @param stageName - Display name of the stage.
 * @param startDate - Scheduled start (defaults to now).
 * @param endDate - Scheduled end (defaults to now).
 * @param actualStart - Actual start, once the stage is in progress.
 * @param actualEnd - Actual end, once the stage is finished.
 */
export async function createStage(
	projectId: string,
	stageName: string,
	startDate?: Date | null,
	endDate?: Date | null,
	actualStart?: Date | null,
	actualEnd?: Date | null,
) {
	z.uuid().parse(projectId);

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

		// TODO(date-rules): plan_start_at/plan_end_at must be REQUIRED for
		// stages — drop the `?? new Date()` fallbacks once the stage schema
		// enforces them. See "Follow-up plan (TODO — future session): Date
		// input rules" in docs/code-review-plan.md.
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

export async function updateStage(
	stageId: string,
	stageName?: string,
	startDate?: Date | null,
	endDate?: Date | null,
	actualStart?: Date | null,
	actualEnd?: Date | null,
) {
	z.uuid().parse(stageId);

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

export async function cascadeSoftDeleteStage(
	stageId: string,
	txClient?: Prisma.TransactionClient,
) {
	z.uuid().parse(stageId);

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
 * Fetches a stage and its full nested tree: Phases → Modules → Workflows,
 * with per-node ticket progress and computed finish dates. Requires
 * project membership.
 *
 * @param stageId - UUID of the stage to load.
 */
export async function getStageTree(stageId: string) {
	z.uuid().parse(stageId);

	const projectId = await resolveStageProject(stageId);
	if (!projectId) return null;
	const auth = await assertProjectMember(projectId);
	if (!auth.ok) return null;

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

		// ── Compute ticketCount, progress, and computed finish_date per workflow ──
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

		// ── Build nested tree (typed nodes — no object[] casts) ──────────
		type WorkflowNode = Prisma.WorkflowsGetPayload<object> & {
			number: number;
			ticketCount: number;
			progress: number;
			planStart: Date | null;
			planEnd: Date | null;
			actualStart: Date | null;
			actualEnd: Date | null;
		};
		type ModuleNode = Prisma.ModulesGetPayload<object> & {
			workflows: WorkflowNode[];
			planStart: Date | null;
			planEnd: Date | null;
			actualStart: Date | null;
			actualEnd: Date | null;
		};
		type PhaseNode = Prisma.PhasesGetPayload<object> & {
			number: number;
			modules: ModuleNode[];
			planStart: Date | null;
			planEnd: Date | null;
			actualStart: Date | null;
			actualEnd: Date | null;
		};

		const workflowsByModule = new Map<string, WorkflowNode[]>();
		for (const wf of workflows) {
			const stats = workflowStats.get(wf.workflow_id) ?? {
				ticketCount: 0,
				progress: 0,
				computedFinishDate: null,
			};
			const list = workflowsByModule.get(wf.module_id) ?? [];
			list.push({
				...wf,
				number: list.length + 1, // display number derived from sort order (WorkflowCard reorder uses it)
				ticketCount: stats.ticketCount,
				progress: stats.progress,
				planStart: wf.plan_start_at,
				planEnd: wf.plan_end_at,
				actualStart: wf.actual_start_at,
				actualEnd: stats.computedFinishDate, // computed: date last ticket finished
			});
			workflowsByModule.set(wf.module_id, list);
		}

		const modulesByPhase = new Map<string, ModuleNode[]>();
		for (const mod of modules) {
			const modWorkflows = workflowsByModule.get(mod.module_id) ?? [];

			// Module actualEnd = max of workflow actualEnd, but only if ALL are finished
			let modActualEnd: Date | null = null;
			let allWfsFinished = modWorkflows.length > 0;
			for (const w of modWorkflows) {
				if (!w.actualEnd) {
					allWfsFinished = false;
					break;
				}
				if (!modActualEnd || w.actualEnd > modActualEnd)
					modActualEnd = w.actualEnd;
			}
			if (!allWfsFinished) modActualEnd = null;

			const list = modulesByPhase.get(mod.phase_id) ?? [];
			list.push({
				...mod,
				workflows: modWorkflows,
				planStart: mod.plan_start_at,
				planEnd: mod.plan_end_at,
				actualStart: mod.actual_start_at,
				actualEnd: modActualEnd,
			});
			modulesByPhase.set(mod.phase_id, list);
		}

		const phasesWithModules: PhaseNode[] = phases.map((p, index) => {
			const phModules = modulesByPhase.get(p.phase_id) ?? [];

			// Phase actualEnd = max of module actualEnd, but only if ALL are finished
			let phActualEnd: Date | null = null;
			let allModsFinished = phModules.length > 0;
			for (const m of phModules) {
				if (!m.actualEnd) {
					allModsFinished = false;
					break;
				}
				if (!phActualEnd || m.actualEnd > phActualEnd)
					phActualEnd = m.actualEnd;
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
		throw error;
	}
}
