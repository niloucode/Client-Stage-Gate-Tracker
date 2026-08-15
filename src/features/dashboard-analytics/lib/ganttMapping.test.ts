import { describe, expect, it } from "vitest";
import {
	buildGanttEvents,
	buildGanttResources,
	deriveRowStatus,
	getActualRange,
	getPlannedRange,
	statusColorToken,
} from "./ganttMapping";
import type { GanttRowData } from "../types";

function makeRow(overrides: Partial<GanttRowData> = {}): GanttRowData {
	return {
		id: "11111111-1111-1111-1111-111111111111",
		title: "Discovery",
		number: 1,
		plan_start_at: new Date("2026-07-01T00:00:00.000Z"),
		plan_end_at: new Date("2026-07-18T00:00:00.000Z"),
		actual_start_at: null,
		actual_end_at: null,
		...overrides,
	};
}

const NOW = new Date("2026-08-11T12:00:00.000Z");

describe("deriveRowStatus", () => {
	it("returns completed when actual_end_at is set", () => {
		expect(
			deriveRowStatus(makeRow({ actual_start_at: NOW, actual_end_at: NOW })),
		).toBe("completed");
	});

	it("returns in_progress when only actual_start_at is set", () => {
		expect(deriveRowStatus(makeRow({ actual_start_at: NOW }))).toBe("in_progress");
	});

	it("returns upcoming when no actual dates exist", () => {
		expect(deriveRowStatus(makeRow())).toBe("upcoming");
	});
});

describe("statusColorToken", () => {
	it("maps completed to a green-derived token", () => {
		expect(statusColorToken("completed")).toContain("--color-green-500");
	});

	it("maps in_progress to a primary-derived token", () => {
		expect(statusColorToken("in_progress")).toContain("--color-primary");
	});

	it("maps upcoming to the muted-foreground token", () => {
		expect(statusColorToken("upcoming")).toBe("var(--muted-foreground)");
	});
});

describe("getPlannedRange", () => {
	it("returns the plan dates", () => {
		const row = makeRow();
		expect(getPlannedRange(row)).toEqual({
			start: row.plan_start_at,
			end: row.plan_end_at,
		});
	});
});

describe("getActualRange", () => {
	it("returns null when the row never started", () => {
		expect(getActualRange(makeRow(), NOW)).toBeNull();
	});

	it("extends an in-progress row through now", () => {
		const start = new Date("2026-08-04T00:00:00.000Z");
		expect(getActualRange(makeRow({ actual_start_at: start }), NOW)).toEqual({
			start,
			end: NOW,
		});
	});

	it("uses actual_end_at for finished rows", () => {
		const start = new Date("2026-07-01T00:00:00.000Z");
		const end = new Date("2026-07-20T00:00:00.000Z");
		expect(
			getActualRange(makeRow({ actual_start_at: start, actual_end_at: end }), NOW),
		).toEqual({ start, end });
	});

	it("skips degenerate ranges where end <= start (future in-progress start)", () => {
		const start = new Date("2026-09-01T00:00:00.000Z"); // after NOW
		expect(getActualRange(makeRow({ actual_start_at: start }), NOW)).toBeNull();
	});
});

describe("buildGanttResources", () => {
	it("maps rows to resources with status-colored badges", () => {
		const resources = buildGanttResources([
			makeRow({ id: "r1", number: 3, actual_start_at: NOW }),
		]);
		expect(resources[0]).toMatchObject({
			id: "r1",
			title: "Discovery",
			number: 3,
		});
		expect(resources[0].color).toContain("--color-primary");
	});
});

describe("buildGanttEvents", () => {
	it("builds planned events from plan dates for every row", () => {
		const events = buildGanttEvents([makeRow({ id: "r1" })], "planned", NOW);
		expect(events).toHaveLength(1);
		expect(events[0]).toMatchObject({
			id: "r1-planned",
			resourceId: "r1",
			readOnly: true,
			draggable: false,
			resizable: false,
			data: { tab: "planned", status: "upcoming" },
		});
		expect(events[0].start).toEqual(new Date("2026-07-01T00:00:00.000Z"));
	});

	it("skips rows without actual dates on the actual tab", () => {
		const events = buildGanttEvents([makeRow({ id: "r1" })], "actual", NOW);
		expect(events).toHaveLength(0);
	});

	it("draws in-progress rows through now on the actual tab", () => {
		const start = new Date("2026-08-04T00:00:00.000Z");
		const events = buildGanttEvents(
			[makeRow({ id: "r1", actual_start_at: start })],
			"actual",
			NOW,
		);
		expect(events).toHaveLength(1);
		expect(events[0].id).toBe("r1-actual");
		expect(events[0].end).toEqual(NOW);
		expect(events[0].data).toEqual({ tab: "actual", status: "in_progress" });
	});

	it("skips degenerate actual ranges entirely", () => {
		const start = new Date("2026-09-01T00:00:00.000Z");
		const events = buildGanttEvents(
			[makeRow({ id: "r1", actual_start_at: start })],
			"actual",
			NOW,
		);
		expect(events).toHaveLength(0);
	});
});
