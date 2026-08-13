import { describe, expect, it } from "vitest";
import { computeProjectStatus, isProjectOwnerRole } from "./projectStatus";

describe("computeProjectStatus", () => {
	it("returns PENDING while the contract is not fully signed", () => {
		expect(
			computeProjectStatus({
				contractSigned: false,
				totalStages: 3,
				finishedStages: 3,
			}),
		).toBe("PENDING");
	});

	it("returns ACTIVE once signed while stages remain unfinished", () => {
		expect(
			computeProjectStatus({
				contractSigned: true,
				totalStages: 3,
				finishedStages: 1,
			}),
		).toBe("ACTIVE");
	});

	it("returns COMPLETED once signed and all stages are finished", () => {
		expect(
			computeProjectStatus({
				contractSigned: true,
				totalStages: 3,
				finishedStages: 3,
			}),
		).toBe("COMPLETED");
	});

	it("returns ACTIVE for a signed project with no stages yet", () => {
		expect(
			computeProjectStatus({
				contractSigned: true,
				totalStages: 0,
				finishedStages: 0,
			}),
		).toBe("ACTIVE");
	});
});

describe("isProjectOwnerRole", () => {
	it("returns true only for the exact Project Owner role name", () => {
		expect(isProjectOwnerRole("Project Owner")).toBe(true);
		expect(isProjectOwnerRole("Project Team")).toBe(false);
		expect(isProjectOwnerRole("Client Viewer")).toBe(false);
		expect(isProjectOwnerRole(null)).toBe(false);
		expect(isProjectOwnerRole(undefined)).toBe(false);
	});
});
