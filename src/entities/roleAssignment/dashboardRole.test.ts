import { describe, expect, it } from "vitest";
import { resolveDashboardRole } from "./dashboardRole";

describe("resolveDashboardRole", () => {
	it("returns 'client' for a profile with client_id even when the user owns projects", () => {
		expect(
			resolveDashboardRole({ clientId: "c1", ownerProjectIds: ["p1"] }),
		).toBe("client");
	});

	it("returns 'owner' for a non-client user who owns at least one project", () => {
		expect(
			resolveDashboardRole({ clientId: null, ownerProjectIds: ["p1"] }),
		).toBe("owner");
	});

	it("returns 'staff' for a non-client user with no owned projects", () => {
		expect(resolveDashboardRole({ clientId: null, ownerProjectIds: [] })).toBe(
			"staff",
		);
	});

	it("returns 'client' even with zero owned projects", () => {
		expect(resolveDashboardRole({ clientId: "c1", ownerProjectIds: [] })).toBe(
			"client",
		);
	});
});
