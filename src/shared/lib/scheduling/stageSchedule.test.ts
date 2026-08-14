import { describe, it, expect } from "vitest";
import { contractSignedStart, gateApprovalDates } from "./stageSchedule";

describe("contractSignedStart (spec 1)", () => {
	it("returns null while either party is unsigned", () => {
		expect(contractSignedStart(null, null)).toBeNull();
		expect(contractSignedStart(new Date("2026-08-01"), null)).toBeNull();
		expect(contractSignedStart(null, new Date("2026-08-01"))).toBeNull();
	});

	it("returns the client date when the client signed later", () => {
		const owner = new Date("2026-08-01T10:00:00Z");
		const client = new Date("2026-08-02T09:00:00Z");
		expect(contractSignedStart(owner, client)).toBe(client);
	});

	it("returns the owner date when the owner signed later", () => {
		const owner = new Date("2026-08-03T10:00:00Z");
		const client = new Date("2026-08-02T09:00:00Z");
		expect(contractSignedStart(owner, client)).toBe(owner);
	});

	it("returns either date when both signed at the same time", () => {
		const same = new Date("2026-08-02T09:00:00Z");
		expect(contractSignedStart(same, new Date(same.getTime()))).toEqual(same);
	});
});

describe("gateApprovalDates (specs 2-3)", () => {
	const approvedAt = new Date("2026-08-14T12:00:00Z");

	it("sets the stage's actual end to the approval timestamp", () => {
		expect(gateApprovalDates(approvedAt, true).actualEnd).toBe(approvedAt);
	});

	it("starts the next stage on the same date when one exists", () => {
		expect(gateApprovalDates(approvedAt, true).nextStageStart).toBe(
			approvedAt,
		);
	});

	it("does not touch the next stage when the approved stage is last", () => {
		expect(gateApprovalDates(approvedAt, false).nextStageStart).toBeNull();
	});
});
