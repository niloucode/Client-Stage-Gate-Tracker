import { describe, expect, it } from "vitest";
import { ImageParentType } from "@/lib/generated/prisma";
import {
	allPhasesFinished,
	deriveNextGateNumber,
	imageParentTypeFor,
} from "./gateRules";

describe("deriveNextGateNumber (spec 2/9: later gates have larger numbers)", () => {
	it("returns 1 for a stage with no gates", () => {
		expect(deriveNextGateNumber([])).toBe(1);
	});

	it("returns max + 1 for existing gates", () => {
		expect(deriveNextGateNumber([1, 3, 2])).toBe(4);
	});

	it("ignores null numbers", () => {
		expect(deriveNextGateNumber([null, 5])).toBe(6);
	});

	it("returns 1 when every number is null", () => {
		expect(deriveNextGateNumber([null])).toBe(1);
	});
});

describe("imageParentTypeFor (comment-slice fix)", () => {
	it("maps TICKET_COMMENT comments to TICKET_COMMENT images", () => {
		expect(imageParentTypeFor("TICKET_COMMENT")).toBe(
			ImageParentType.TICKET_COMMENT,
		);
	});

	it("maps GATE_COMMENT comments to GATE_COMMENT images", () => {
		expect(imageParentTypeFor("GATE_COMMENT")).toBe(
			ImageParentType.GATE_COMMENT,
		);
	});
});

describe("allPhasesFinished (approval gating)", () => {
	it("is true when every phase has an actual end", () => {
		expect(
			allPhasesFinished([
				{ actual_end_at: new Date("2026-01-01T00:00:00Z") },
				{ actual_end_at: new Date("2026-01-02T00:00:00Z") },
			]),
		).toBe(true);
	});

	it("is false when a phase is unfinished", () => {
		expect(
			allPhasesFinished([
				{ actual_end_at: new Date("2026-01-01T00:00:00Z") },
				{ actual_end_at: null },
			]),
		).toBe(false);
	});

	it("is true when the stage has no phases (vacuously decidable)", () => {
		expect(allPhasesFinished([])).toBe(true);
	});
});
