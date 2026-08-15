import type { Prisma } from "@/lib/generated/prisma";

/** Scheduling columns only — the client-side Gantt never needs the full row. */
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
