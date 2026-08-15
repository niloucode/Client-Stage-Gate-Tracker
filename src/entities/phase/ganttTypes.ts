import type { Prisma } from "@/lib/generated/prisma";

/**
 * Scheduling columns only — the client-side Gantt never needs the full row.
 * Lives in a plain module (NOT "use server"): the use-server-exports
 * regression test forbids non-async exports from directive files.
 */
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
