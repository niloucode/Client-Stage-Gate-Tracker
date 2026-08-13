import type { GanttEvent, GanttResource } from "@/components/reui/gantt/gantt-types";
import type {
	GanttBarEventData,
	GanttLevel,
	GanttRowData,
	GanttRowStatus,
	GanttTab,
} from "../types";

/** Singular label for the sub-filter level, used in the row's number badge. */
export const LEVEL_SINGULAR: Record<GanttLevel, string> = {
	phases: "Phase",
	modules: "Module",
	workflows: "Workflow",
};

/** A tree-panel resource carrying the row's display number, for the "PHASE 01" badge. */
export type GanttRowResource = GanttResource & { number: number | null };

/**
 * Row status is derived from actual_start_at/actual_end_at only — it reflects
 * real progress the same way on both tabs; only bar position differs.
 */
export function deriveRowStatus(row: GanttRowData): GanttRowStatus {
	if (row.actual_end_at) return "completed";
	if (row.actual_start_at) return "in_progress";
	return "upcoming";
}

/**
 * Theme-token color per status; never a literal hex. The base green-500/
 * primary tokens read as too saturated at bar scale — color-mix darkens
 * each toward black a bit while staying derived from the same tokens.
 */
export function statusColorToken(status: GanttRowStatus): string {
	switch (status) {
		case "completed":
			return "color-mix(in oklch, var(--color-green-500) 78%, black)";
		case "in_progress":
			return "color-mix(in oklch, var(--color-primary) 82%, black)";
		case "upcoming":
			return "var(--muted-foreground)";
	}
}

export function getPlannedRange(row: GanttRowData): { start: Date; end: Date } {
	return { start: row.plan_start_at, end: row.plan_end_at };
}

/**
 * Actual range is null until the row has actually started. An in-progress
 * row (actual_end_at not yet set) draws through `now` so the bar visibly
 * keeps growing until it's marked done.
 */
export function getActualRange(
	row: GanttRowData,
	now: Date,
): { start: Date; end: Date } | null {
	if (!row.actual_start_at) return null;
	return { start: row.actual_start_at, end: row.actual_end_at ?? now };
}

/**
 * Resource color carries the row's status (completed/in_progress/upcoming)
 * so renderResourceLabel can color the "PHASE 01" badge the same way the
 * bar itself is colored, without needing a second data channel.
 */
export function buildGanttResources(rows: GanttRowData[]): GanttRowResource[] {
	return rows.map((row) => ({
		id: row.id,
		title: row.title,
		number: row.number,
		color: statusColorToken(deriveRowStatus(row)),
	}));
}

export function buildGanttEvents(
	rows: GanttRowData[],
	tab: GanttTab,
	now: Date,
): GanttEvent<GanttBarEventData>[] {
	const events: GanttEvent<GanttBarEventData>[] = [];

	for (const row of rows) {
		const range = tab === "planned" ? getPlannedRange(row) : getActualRange(row, now);
		if (!range) continue;

		const status = deriveRowStatus(row);
		events.push({
			id: `${row.id}-${tab}`,
			title: row.title,
			start: range.start,
			end: range.end,
			resourceId: row.id,
			color: statusColorToken(status),
			readOnly: true,
			draggable: false,
			resizable: false,
			data: { tab, status },
		});
	}

	return events;
}
