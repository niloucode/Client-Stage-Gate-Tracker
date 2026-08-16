"use client";

import { queryOptions, useQuery } from "@tanstack/react-query";
import { getProjectModulesGantt } from "@/entities/module";
import { getProjectPhasesGantt } from "@/entities/phase";
import { getProjectWorkflowsGantt } from "@/entities/workflow";
import { dashboardAnalyticsKeys } from "@/shared/query/keys";
import type {
	GanttRowData,
	ModuleGanttPayload,
	PhaseGanttPayload,
	WorkflowGanttPayload,
} from "./types";

// ── Normalization: each level's id/name column flattens into GanttRowData ──
// Actual dates are rolled up server-side by rollupTicketAncestors
// (src/entities/ticket/lib/dateRollup.ts), so the client reads the columns
// directly — it never re-derives them from ticketHistory.

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
			queryFn: async () => {
				const result = await getProjectPhasesGantt(projectId);
				if (!result.success) return [];
				return result.data.map(normalizePhase);
			},
			enabled: !!projectId,
		}),
	modules: (projectId: string) =>
		queryOptions({
			queryKey: dashboardAnalyticsKeys.modules(projectId),
			queryFn: async () => {
				const result = await getProjectModulesGantt(projectId);
				if (!result.success) return [];
				return result.data.map(normalizeModule);
			},
			enabled: !!projectId,
		}),
	workflows: (projectId: string) =>
		queryOptions({
			queryKey: dashboardAnalyticsKeys.workflows(projectId),
			queryFn: async () => {
				const result = await getProjectWorkflowsGantt(projectId);
				if (!result.success) return [];
				return result.data.map(normalizeWorkflow);
			},
			enabled: !!projectId,
		}),
};

/**
 * Gantt data for the phases level.
 * @param projectId
 * @returns The result.
 */
export function usePhasesGantt(projectId: string) {
	return useQuery(dashboardAnalyticsQueryOptions.phases(projectId));
}

/**
 * Gantt data for the modules level.
 * @param projectId
 * @returns The result.
 */
export function useModulesGantt(projectId: string) {
	return useQuery(dashboardAnalyticsQueryOptions.modules(projectId));
}

/**
 * Gantt data for the workflows level.
 * @param projectId
 * @returns The result.
 */
export function useWorkflowsGantt(projectId: string) {
	return useQuery(dashboardAnalyticsQueryOptions.workflows(projectId));
}
