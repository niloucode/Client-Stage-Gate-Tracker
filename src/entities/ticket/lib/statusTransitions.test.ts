import { describe, it, expect } from "vitest";
import { computeActualDates } from "./statusTransitions";

const NOW = new Date("2026-08-15T10:00:00.000Z");

describe("computeActualDates (2026-08-15 spec)", () => {
	it("PENDING -> IN_PROGRESS sets actual_start_at", () => {
		expect(computeActualDates("PENDING", "IN_PROGRESS", NOW)).toEqual({
			actual_start_at: NOW,
		});
	});

	it("IN_PROGRESS -> FINISHED sets actual_end_at only", () => {
		expect(computeActualDates("IN_PROGRESS", "FINISHED", NOW)).toEqual({
			actual_end_at: NOW,
		});
	});

	it("PENDING -> FINISHED sets actual_start_at and actual_end_at to the SAME timestamp", () => {
		const patch = computeActualDates("PENDING", "FINISHED", NOW);
		expect(patch.actual_start_at).toBe(NOW);
		expect(patch.actual_end_at).toBe(NOW);
		expect(patch.actual_start_at).toBe(patch.actual_end_at);
	});

	it("FINISHED -> IN_PROGRESS reverts actual_end_at only", () => {
		expect(computeActualDates("FINISHED", "IN_PROGRESS", NOW)).toEqual({
			actual_end_at: null,
		});
	});

	it("FINISHED -> PENDING reverts both actual dates", () => {
		expect(computeActualDates("FINISHED", "PENDING", NOW)).toEqual({
			actual_start_at: null,
			actual_end_at: null,
		});
	});

	it("IN_PROGRESS -> PENDING reverts actual_start_at only", () => {
		expect(computeActualDates("IN_PROGRESS", "PENDING", NOW)).toEqual({
			actual_start_at: null,
		});
	});

	it("same status produces no patch", () => {
		expect(computeActualDates("FINISHED", "FINISHED", NOW)).toEqual({});
		expect(computeActualDates("PENDING", "PENDING", NOW)).toEqual({});
		expect(computeActualDates("IN_PROGRESS", "IN_PROGRESS", NOW)).toEqual({});
	});
});
