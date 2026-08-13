import type { Prisma } from "@/lib/generated/prisma";

// ── Prisma-derived payloads (client-side Gantt only needs the scheduling
// columns, never the full row) ──────────────────────────────────────────────

export const phaseGanttSelect = {
	phase_id: true,
	name: true,
	number: true,
	plan_start_at: true,
	plan_end_at: true,
	actual_start_at: true,
	actual_end_at: true,
} as const;

export type PhaseGanttPayload = Prisma.PhasesGetPayload<{
	select: typeof phaseGanttSelect;
}>;

export const moduleGanttSelect = {
	module_id: true,
	name: true,
	plan_start_at: true,
	plan_end_at: true,
	actual_start_at: true,
	actual_end_at: true,
} as const;

export type ModuleGanttPayload = Prisma.ModulesGetPayload<{
	select: typeof moduleGanttSelect;
}>;

export const workflowGanttSelect = {
	workflow_id: true,
	name: true,
	number: true,
	plan_start_at: true,
	plan_end_at: true,
	actual_start_at: true,
	actual_end_at: true,
} as const;

export type WorkflowGanttPayload = Prisma.WorkflowsGetPayload<{
	select: typeof workflowGanttSelect;
}>;

// ── UI-facing unions ─────────────────────────────────────────────────────────

/** Which date pair the Gantt bars are drawn from. */
export type GanttTab = "planned" | "actual";

/** Which hierarchy level the sub-filter pills request. */
export type GanttLevel = "phases" | "modules" | "workflows";

export type GanttRowStatus = "completed" | "in_progress" | "upcoming";

/**
 * Normalized row shape the Gantt mapping layer consumes. Phases, Modules and
 * Workflows all carry the same four scheduling columns in Prisma; each level's
 * fetch function projects its own id/name field into this shape so the
 * mapping + rendering code stays level-agnostic.
 */
export interface GanttRowData {
	id: string;
	title: string;
	/** Phases/Workflows carry a display number; Modules don't. */
	number: number | null;
	plan_start_at: Date;
	plan_end_at: Date;
	actual_start_at: Date | null;
	actual_end_at: Date | null;
}

/** Consumer payload carried on each reui GanttEvent for this feature. */
export interface GanttBarEventData {
	tab: GanttTab;
	status: GanttRowStatus;
}
