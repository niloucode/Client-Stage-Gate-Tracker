import { describe, it, expect } from "vitest";
import { nextStageNumber, renumberAfterDelete } from "./stageNumbers";

describe("nextStageNumber", () => {
	it("assigns 1 to the first stage", () => {
		expect(nextStageNumber([])).toBe(1);
	});

	it("assigns max + 1 for consecutive stages", () => {
		expect(nextStageNumber([1, 2, 3])).toBe(4);
	});

	it("skips over NULL numbers (deleted stages)", () => {
		expect(nextStageNumber([1, null, 3])).toBe(4);
	});

	it("handles gaps from shifted sequences", () => {
		expect(nextStageNumber([2, 5])).toBe(6);
	});

	it("ignores all-null lists", () => {
		expect(nextStageNumber([null, null])).toBe(1);
	});
});

describe("renumberAfterDelete", () => {
	it("shifts every stage after the deleted one down by one (middle delete)", () => {
		// deleting stage 2 of [1,2,3,4] shifts stages 3 and 4
		expect(renumberAfterDelete([1, 2, 3, 4], 2)).toBe(2);
	});

	it("shifts nothing when deleting the last stage", () => {
		expect(renumberAfterDelete([1, 2, 3, 4], 4)).toBe(0);
	});

	it("shifts everything when deleting the first stage", () => {
		expect(renumberAfterDelete([1, 2, 3], 1)).toBe(2);
	});

	it("shifts nothing for a single-stage project", () => {
		expect(renumberAfterDelete([1], 1)).toBe(0);
	});

	it("shifts nothing when the deleted stage has no number", () => {
		expect(renumberAfterDelete([1, 2, 3], null)).toBe(0);
	});

	it("ignores NULL numbers when counting the shift", () => {
		expect(renumberAfterDelete([1, null, 3, 4], 1)).toBe(2);
	});
});
