import type { GanttLevel, GanttTab } from "./lib/schema";

export type { GanttLevel, GanttTab } from "./lib/schema";
export type { ModuleGanttPayload } from "@/entities/module";
export type { PhaseGanttPayload } from "@/entities/phase";
export type { WorkflowGanttPayload } from "@/entities/workflow";

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
