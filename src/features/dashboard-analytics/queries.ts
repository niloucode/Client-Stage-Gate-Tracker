"use client";

import { queryOptions, useQuery } from "@tanstack/react-query";
import { dashboardAnalyticsKeys } from "@/shared/query/keys";
import { MOCK_MODULES, MOCK_PHASES, MOCK_WORKFLOWS } from "./lib/mockData";
import type {
	GanttRowData,
	ModuleGanttPayload,
	PhaseGanttPayload,
	WorkflowGanttPayload,
} from "./types";

// ============ DATA LAYER (replace with API calls) ============
// TODO: fetch phases from GET /projects/:id/phases (select: phaseGanttSelect)
// TODO: fetch modules from GET /projects/:id/modules (select: moduleGanttSelect)
// TODO: fetch workflows from GET /projects/:id/workflows (select: workflowGanttSelect)
// TODO: Planned Gantt uses <row>.plan_start_at + <row>.plan_end_at directly.
// TODO: Actual Gantt uses <row>.actual_start_at + <row>.actual_end_at — these
//       are already rolled up server-side from ticket status transitions by
//       rollupTicketAncestors (src/entities/ticket/lib/dateRollup.ts), so the
//       client never re-derives them from ticketHistory itself.

async function fetchPhases(projectId: string): Promise<PhaseGanttPayload[]> {
	void projectId;
	return Promise.resolve(MOCK_PHASES);
}

async function fetchModules(projectId: string): Promise<ModuleGanttPayload[]> {
	void projectId;
	return Promise.resolve(MOCK_MODULES);
}

async function fetchWorkflows(projectId: string): Promise<WorkflowGanttPayload[]> {
	void projectId;
	return Promise.resolve(MOCK_WORKFLOWS);
}

// ── Normalization: each level's id/name column flattens into GanttRowData ──

function normalizePhase(phase: PhaseGanttPayload): GanttRowData {
	return {
		id: phase.phase_id,
		title: phase.name,
		number: phase.number,
		plan_start_at: phase.plan_start_at,
		plan_end_at: phase.plan_end_at,
		actual_start_at: phase.actual_start_at,
		actual_end_at: phase.actual_end_at,
	};
}

function normalizeModule(module_: ModuleGanttPayload): GanttRowData {
	return {
		id: module_.module_id,
		title: module_.name,
		number: null,
		plan_start_at: module_.plan_start_at,
		plan_end_at: module_.plan_end_at,
		actual_start_at: module_.actual_start_at,
		actual_end_at: module_.actual_end_at,
	};
}

function normalizeWorkflow(workflow: WorkflowGanttPayload): GanttRowData {
	return {
		id: workflow.workflow_id,
		title: workflow.name,
		number: workflow.number,
		plan_start_at: workflow.plan_start_at,
		plan_end_at: workflow.plan_end_at,
		actual_start_at: workflow.actual_start_at,
		actual_end_at: workflow.actual_end_at,
	};
}

// ============ QUERY HOOKS ============

const dashboardAnalyticsQueryOptions = {
	phases: (projectId: string) =>
		queryOptions({
			queryKey: dashboardAnalyticsKeys.phases(projectId),
			queryFn: async () => (await fetchPhases(projectId)).map(normalizePhase),
			enabled: !!projectId,
		}),
	modules: (projectId: string) =>
		queryOptions({
			queryKey: dashboardAnalyticsKeys.modules(projectId),
			queryFn: async () => (await fetchModules(projectId)).map(normalizeModule),
			enabled: !!projectId,
		}),
	workflows: (projectId: string) =>
		queryOptions({
			queryKey: dashboardAnalyticsKeys.workflows(projectId),
			queryFn: async () =>
				(await fetchWorkflows(projectId)).map(normalizeWorkflow),
			enabled: !!projectId,
		}),
};

export function usePhasesGantt(projectId: string) {
	return useQuery(dashboardAnalyticsQueryOptions.phases(projectId));
}

export function useModulesGantt(projectId: string) {
	return useQuery(dashboardAnalyticsQueryOptions.modules(projectId));
}

export function useWorkflowsGantt(projectId: string) {
	return useQuery(dashboardAnalyticsQueryOptions.workflows(projectId));
}
