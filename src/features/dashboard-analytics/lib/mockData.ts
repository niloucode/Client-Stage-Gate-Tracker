import type {
	ModuleGanttPayload,
	PhaseGanttPayload,
	WorkflowGanttPayload,
} from "../types";

// ============ MOCK DATA (replace with API responses) ============
// Same 4 phases back both tabs — Planned reads plan_start_at/plan_end_at,
// Actual reads actual_start_at/actual_end_at off the exact same rows.

/** "Now" for this demo dataset — falls inside Phase 3's in-progress bar. */
export const MOCK_TODAY = new Date("2026-08-11T12:00:00.000Z");

export const MOCK_PHASES: PhaseGanttPayload[] = [
	{
		phase_id: "mock-phase-1",
		name: "Discovery & Requirements",
		number: 1,
		plan_start_at: new Date("2026-07-01T00:00:00.000Z"),
		plan_end_at: new Date("2026-07-18T00:00:00.000Z"),
		actual_start_at: new Date("2026-07-01T00:00:00.000Z"),
		actual_end_at: new Date("2026-07-20T00:00:00.000Z"),
	},
	{
		phase_id: "mock-phase-2",
		name: "UI/UX Design",
		number: 2,
		plan_start_at: new Date("2026-07-15T00:00:00.000Z"),
		plan_end_at: new Date("2026-08-05T00:00:00.000Z"),
		actual_start_at: new Date("2026-07-18T00:00:00.000Z"),
		actual_end_at: new Date("2026-08-08T00:00:00.000Z"),
	},
	{
		phase_id: "mock-phase-3",
		name: "Core Development",
		number: 3,
		plan_start_at: new Date("2026-08-01T00:00:00.000Z"),
		plan_end_at: new Date("2026-09-05T00:00:00.000Z"),
		actual_start_at: new Date("2026-08-04T00:00:00.000Z"),
		actual_end_at: null,
	},
	{
		phase_id: "mock-phase-4",
		name: "QA & Launch Prep",
		number: 4,
		plan_start_at: new Date("2026-09-01T00:00:00.000Z"),
		plan_end_at: new Date("2026-09-25T00:00:00.000Z"),
		actual_start_at: null,
		actual_end_at: null,
	},
];

// Modules and Workflows have no seeded rows yet for this project — the sub-
// filter pills exercise the Gantt's empty state for these two levels.
export const MOCK_MODULES: ModuleGanttPayload[] = [];
export const MOCK_WORKFLOWS: WorkflowGanttPayload[] = [];
