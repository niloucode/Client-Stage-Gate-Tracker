import { describe, expect, it } from "vitest";
import {
	rollupWorkflowDates,
	rollupModuleDates,
} from "./dateRollup";

const d = (iso: string) => new Date(iso);
const t = (
	planStart: string,
	planEnd: string,
	status: string,
	actualStart: string | null = null,
	actualEnd: string | null = null,
) => ({
	plan_start_at: d(planStart),
	plan_end_at: d(planEnd),
	actual_start_at: actualStart ? d(actualStart) : null,
	actual_end_at: actualEnd ? d(actualEnd) : null,
	status,
});

describe("rollupWorkflowDates (Task 3.2)", () => {
	it("returns nulls for an empty ticket list", () => {
		expect(rollupWorkflowDates([])).toEqual({
			plan_start_at: null,
			plan_end_at: null,
			actual_start_at: null,
			actual_end_at: null,
		});
	});

	it("rolls planStart = earliest, planEnd = latest across tickets", () => {
		const result = rollupWorkflowDates([
			t("2024-01-05T00:00:00Z", "2024-01-20T00:00:00Z", "PENDING"),
			t("2024-01-01T00:00:00Z", "2024-01-10T00:00:00Z", "PENDING"),
		]);
		expect(result.plan_start_at?.toISOString()).toBe(
			"2024-01-01T00:00:00.000Z",
		);
		expect(result.plan_end_at?.toISOString()).toBe(
			"2024-01-20T00:00:00.000Z",
		);
	});

	it("actualStart falls back to plan_start_at when unset", () => {
		const result = rollupWorkflowDates([
			t("2024-02-01T00:00:00Z", "2024-02-10T00:00:00Z", "PENDING"),
			t("2024-02-05T00:00:00Z", "2024-02-15T00:00:00Z", "IN_PROGRESS"),
		]);
		expect(result.actual_start_at?.toISOString()).toBe(
			"2024-02-01T00:00:00.000Z",
		);
	});

	it("actualEnd is null until ALL tickets are finished", () => {
		const result = rollupWorkflowDates([
			t(
				"2024-03-01T00:00:00Z",
				"2024-03-10T00:00:00Z",
				"FINISHED",
				"2024-03-02T00:00:00Z",
				"2024-03-09T00:00:00Z",
			),
			t("2024-03-05T00:00:00Z", "2024-03-12T00:00:00Z", "PENDING"),
		]);
		expect(result.actual_end_at).toBeNull();
	});

	it("actualEnd = latest actual_end_at when all tickets are finished", () => {
		const result = rollupWorkflowDates([
			t(
				"2024-03-01T00:00:00Z",
				"2024-03-10T00:00:00Z",
				"FINISHED",
				"2024-03-02T00:00:00Z",
				"2024-03-09T00:00:00Z",
			),
			t(
				"2024-03-05T00:00:00Z",
				"2024-03-12T00:00:00Z",
				"FINISHED",
				"2024-03-06T00:00:00Z",
				"2024-03-11T00:00:00Z",
			),
		]);
		expect(result.actual_end_at?.toISOString()).toBe(
			"2024-03-11T00:00:00.000Z",
		);
	});
});

describe("rollupModuleDates (Task 3.2)", () => {
	const wf = (
		planStart: string,
		planEnd: string,
		actualStart: string | null,
		actualEnd: string | null,
	) => ({
		plan_start_at: d(planStart),
		plan_end_at: d(planEnd),
		actual_start_at: actualStart ? d(actualStart) : null,
		actual_end_at: actualEnd ? d(actualEnd) : null,
	});

	it("returns nulls for an empty workflow list", () => {
		expect(rollupModuleDates([])).toEqual({
			plan_start_at: null,
			plan_end_at: null,
			actual_start_at: null,
			actual_end_at: null,
		});
	});

	it("rolls plan boundaries from children workflows", () => {
		const result = rollupModuleDates([
			wf("2024-04-01T00:00:00Z", "2024-04-10T00:00:00Z", null, null),
			wf("2024-04-05T00:00:00Z", "2024-04-15T00:00:00Z", null, null),
		]);
		expect(result.plan_start_at?.toISOString()).toBe(
			"2024-04-01T00:00:00.000Z",
		);
		expect(result.plan_end_at?.toISOString()).toBe(
			"2024-04-15T00:00:00.000Z",
		);
	});

	it("actualEnd requires every workflow to have finished", () => {
		const result = rollupModuleDates([
			wf(
				"2024-04-01T00:00:00Z",
				"2024-04-10T00:00:00Z",
				"2024-04-02T00:00:00Z",
				"2024-04-09T00:00:00Z",
			),
			wf("2024-04-05T00:00:00Z", "2024-04-15T00:00:00Z", null, null),
		]);
		expect(result.actual_end_at).toBeNull();
	});

	it("rolls actualStart = earliest across children", () => {
		const result = rollupModuleDates([
			wf(
				"2024-04-01T00:00:00Z",
				"2024-04-10T00:00:00Z",
				"2024-04-03T00:00:00Z",
				null,
			),
			wf(
				"2024-04-05T00:00:00Z",
				"2024-04-15T00:00:00Z",
				"2024-04-02T00:00:00Z",
				null,
			),
		]);
		expect(result.actual_start_at?.toISOString()).toBe(
			"2024-04-02T00:00:00.000Z",
		);
	});
});
