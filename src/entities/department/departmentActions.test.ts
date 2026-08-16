import { describe, expect, it, vi, beforeEach } from "vitest";

// Mock the DB + session boundary so the server action is testable without a
// database. The REAL invite-code hashing runs (dev pepper) — only prisma
// and the session lookup are stubbed (same pattern as clientActions.test.ts).
vi.mock("@/lib/prisma", () => ({
	prisma: {
		profiles: { findUnique: vi.fn() },
		department: { updateMany: vi.fn() },
	},
}));
vi.mock("@/lib/auth/projectAccess", () => ({
	getCurrentUserId: vi.fn(),
}));

import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/auth/projectAccess";
import { generateStaffInviteCode } from "./departmentActions";
import { hashInviteCode } from "@/shared/lib/inviteCode";

const mockedPrisma = vi.mocked(prisma, true);
const mockedUserId = vi.mocked(getCurrentUserId);

const OWNER_PROFILE = {
	profile_id: "u-owner",
	client_id: null,
	Department: { name: "Project Owner" },
};

const TEAM_PROFILE = {
	profile_id: "u-team",
	client_id: null,
	Department: { name: "Project Team" },
};

const CLIENT_PROFILE = {
	profile_id: "u-client",
	client_id: "c-1",
	Department: null,
};

describe("generateStaffInviteCode", () => {
	beforeEach(() => {
		vi.resetAllMocks();
		mockedPrisma.department.updateMany.mockResolvedValue({ count: 1 });
	});

	it("rejects unauthenticated callers", async () => {
		mockedUserId.mockResolvedValue(null);
		const result = await generateStaffInviteCode("Project Team");
		expect(result.success).toBe(false);
		expect(result.error).toContain("Authentication required");
		expect(mockedPrisma.department.updateMany).not.toHaveBeenCalled();
	});

	it("rejects client profiles", async () => {
		mockedUserId.mockResolvedValue("u-client");
		mockedPrisma.profiles.findUnique.mockResolvedValue(CLIENT_PROFILE as never);
		const result = await generateStaffInviteCode("Project Team");
		expect(result.success).toBe(false);
		expect(result.error).toContain("Only the project owner");
	});

	it("rejects project team members (non-owner)", async () => {
		mockedUserId.mockResolvedValue("u-team");
		mockedPrisma.profiles.findUnique.mockResolvedValue(TEAM_PROFILE as never);
		const result = await generateStaffInviteCode("Project Team");
		expect(result.success).toBe(false);
		expect(result.error).toContain("Only the project owner");
	});

	it("persists only the HMAC hash and returns the plaintext once", async () => {
		mockedUserId.mockResolvedValue("u-owner");
		mockedPrisma.profiles.findUnique.mockResolvedValue(OWNER_PROFILE as never);

		const result = await generateStaffInviteCode("Project Team");

		expect(result.success).toBe(true);
		if (!result.success) return;
		expect(result.inviteCode).toBeDefined();
		expect(result.inviteCode).toMatch(/^[A-Z2-9]{12}$/);
		expect(mockedPrisma.department.updateMany).toHaveBeenCalledWith({
			where: { name: "Project Team", is_deleted: false },
			data: { invite_code_hash: hashInviteCode(result.inviteCode!) },
		});
	});

	it("fails when the target department row does not exist", async () => {
		mockedUserId.mockResolvedValue("u-owner");
		mockedPrisma.profiles.findUnique.mockResolvedValue(OWNER_PROFILE as never);
		mockedPrisma.department.updateMany.mockResolvedValue({ count: 0 });

		const result = await generateStaffInviteCode("Project Owner");
		expect(result.success).toBe(false);
		expect(result.error).toContain("not found");
	});

	it("retries with a fresh code on a P2002 invite_code_hash collision", async () => {
		mockedUserId.mockResolvedValue("u-owner");
		mockedPrisma.profiles.findUnique.mockResolvedValue(OWNER_PROFILE as never);

		const collision = {
			code: "P2002",
			meta: { target: ["invite_code_hash"] },
		};
		mockedPrisma.department.updateMany
			.mockRejectedValueOnce(collision)
			.mockResolvedValueOnce({ count: 1 });

		const result = await generateStaffInviteCode("Project Team");
		expect(result.success).toBe(true);
		expect(mockedPrisma.department.updateMany).toHaveBeenCalledTimes(2);
	});
});
