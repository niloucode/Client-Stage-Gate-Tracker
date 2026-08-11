import { describe, expect, it } from "vitest";
import {
	isChronologyValid,
	hasValidPlannedRange,
	hasValidActualRange,
	earliestDate,
	latestDate,
} from "./chronology";
import { rollupStart, rollupEnd, rollupChildrenDates } from "./rollup";
import { schedulingDatesSchema } from "./scheduling";

const d = (iso: string) => new Date(iso);

describe("chronology helpers", () => {
	it("accepts empty scheduling blocks", () => {
		const empty = {
			planStart: null,
			planEnd: null,
			actualStart: null,
			actualEnd: null,
		};
		expect(isChronologyValid(empty)).toBe(true);
		expect(hasValidPlannedRange(empty)).toBe(true);
		expect(hasValidActualRange(empty)).toBe(true);
	});

	it("accepts valid planned ranges", () => {
		expect(
			hasValidPlannedRange({
				planStart: d("2024-01-01T00:00:00Z"),
				planEnd: d("2024-01-10T00:00:00Z"),
				actualStart: null,
				actualEnd: null,
			}),
		).toBe(true);
	});

	it("rejects planStart after planEnd", () => {
		expect(
			hasValidPlannedRange({
				planStart: d("2024-01-10T00:00:00Z"),
				planEnd: d("2024-01-01T00:00:00Z"),
				actualStart: null,
				actualEnd: null,
			}),
		).toBe(false);
	});

	it("rejects actualStart after actualEnd", () => {
		expect(
			hasValidActualRange({
				planStart: null,
				planEnd: null,
				actualStart: d("2024-02-02T00:00:00Z"),
				actualEnd: d("2024-02-01T00:00:00Z"),
			}),
		).toBe(false);
	});
});

describe("earliest/latest", () => {
	const block = {
		planStart: d("2024-03-01T00:00:00Z"),
		planEnd: d("2024-03-20T00:00:00Z"),
		actualStart: d("2024-03-05T00:00:00Z"),
		actualEnd: null,
	};

	it("picks the earliest non-null date", () => {
		expect(earliestDate(block)?.toISOString()).toBe("2024-03-01T00:00:00.000Z");
	});

	it("picks the latest non-null date", () => {
		expect(latestDate(block)?.toISOString()).toBe("2024-03-20T00:00:00.000Z");
	});

	it("returns null when no dates are set", () => {
		expect(
			earliestDate({
				planStart: null,
				planEnd: null,
				actualStart: null,
				actualEnd: null,
			}),
		).toBeNull();
	});
});

describe("rollup helpers", () => {
	const childA = {
		planStart: d("2024-04-01T00:00:00Z"),
		planEnd: d("2024-04-10T00:00:00Z"),
		actualStart: null,
		actualEnd: d("2024-04-09T00:00:00Z"),
	};
	const childB = {
		planStart: d("2024-04-05T00:00:00Z"),
		planEnd: d("2024-04-15T00:00:00Z"),
		actualStart: null,
		actualEnd: null,
	};

	it("rolls up the earliest start and latest end across children", () => {
		const { start, end } = rollupChildrenDates([childA, childB]);
		expect(start?.toISOString()).toBe("2024-04-01T00:00:00.000Z");
		expect(end?.toISOString()).toBe("2024-04-15T00:00:00.000Z");
	});

	it("returns nulls for an empty children list", () => {
		expect(rollupChildrenDates([])).toEqual({ start: null, end: null });
	});

	it("rollupStart/rollupEnd mirror earliest/latest", () => {
		expect(rollupStart(childA)?.toISOString()).toBe("2024-04-01T00:00:00.000Z");
		expect(rollupEnd(childA)?.toISOString()).toBe("2024-04-10T00:00:00.000Z");
	});
});

describe("schedulingDatesSchema", () => {
	it("rejects planStart after planEnd with a field error", () => {
		const result = schedulingDatesSchema.safeParse({
			planStart: d("2024-05-10T00:00:00Z"),
			planEnd: d("2024-05-01T00:00:00Z"),
			actualStart: null,
			actualEnd: null,
		});
		expect(result.success).toBe(false);
		if (!result.success) {
			const issues = result.error.issues;
			expect(issues.some((i) => i.path.includes("planStart"))).toBe(true);
		}
	});

	it("rejects actualStart after actualEnd with a field error", () => {
		const result = schedulingDatesSchema.safeParse({
			planStart: null,
			planEnd: null,
			actualStart: d("2024-05-10T00:00:00Z"),
			actualEnd: d("2024-05-01T00:00:00Z"),
		});
		expect(result.success).toBe(false);
		if (!result.success) {
			const issues = result.error.issues;
			expect(issues.some((i) => i.path.includes("actualStart"))).toBe(true);
		}
	});

	it("accepts a fully empty block", () => {
		expect(
			schedulingDatesSchema.safeParse({
				planStart: null,
				planEnd: null,
				actualStart: null,
				actualEnd: null,
			}).success,
		).toBe(true);
	});
});
