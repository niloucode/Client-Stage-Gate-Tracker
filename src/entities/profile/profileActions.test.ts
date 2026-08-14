import { describe, expect, it, vi, beforeEach } from "vitest";

// Mock the DB + session boundary so the server action is testable without a
// database. The REAL invite-code hashing runs (dev pepper) — only prisma
// and the session lookup are stubbed (same pattern as clientActions.test.ts).
vi.mock("@/lib/prisma", () => ({
	prisma: {
		profiles: { findUnique: vi.fn(), create: vi.fn(), update: vi.fn() },
		clients: { findUnique: vi.fn() },
		department: { findUnique: vi.fn() },
		users: { findUnique: vi.fn() },
	},
}));
vi.mock("@/lib/auth/projectAccess", () => ({
	getCurrentUserId: vi.fn(),
}));

import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/auth/projectAccess";
import { createProfileForCurrentUser } from "./profileActions";
import { hashInviteCode } from "@/shared/lib/inviteCode";

const mockedPrisma = vi.mocked(prisma, true);
const mockedUserId = vi.mocked(getCurrentUserId);

const STAFF_ROW = {
	profile_id: "u-1",
	email: "staff@example.com",
	client_id: null,
	department_id: null,
	first_name: "Staff",
	last_name: "One",
	job_title: null,
	phone: null,
	image_id: null,
	is_deleted: false,
	deleted_at: null,
};

const CLIENT_ROW = {
	...STAFF_ROW,
	client_id: "c-1",
	email: "client@example.com",
};

const DEPT = { department_id: "d-1", is_deleted: false };

const baseInput = {
	first_name: "Staff",
	last_name: "One",
	email: "staff@example.com",
	phone: null,
	job_title: null,
	department_id: null,
	inviteCode: undefined,
	departmentInviteCode: undefined,
	userId: undefined,
};

describe("createProfileForCurrentUser — invite-code rules (2026-08-14)", () => {
	beforeEach(() => {
		vi.resetAllMocks();
		mockedUserId.mockResolvedValue("u-1");
		mockedPrisma.profiles.create.mockResolvedValue(STAFF_ROW);
	});

	it("rejects a signup with no invite code at all", async () => {
		const result = await createProfileForCurrentUser({
			...baseInput,
		} as never);
		expect(result.success).toBe(false);
		if (!result.success) expect(result.error).toContain("invite code");
		expect(mockedPrisma.profiles.create).not.toHaveBeenCalled();
	});

	it("resolves the department from a valid department invite code", async () => {
		mockedPrisma.department.findUnique.mockResolvedValue(DEPT as never);
		const code = "ABC234XYZ789";
		const result = await createProfileForCurrentUser({
			...baseInput,
			departmentInviteCode: code,
		} as never);
		expect(result.success).toBe(true);
		expect(mockedPrisma.department.findUnique).toHaveBeenCalledWith({
			where: { invite_code_hash: hashInviteCode(code) },
			select: { department_id: true, is_deleted: true },
		});
		expect(mockedPrisma.profiles.create).toHaveBeenCalledWith(
			expect.objectContaining({
				data: expect.objectContaining({ department_id: "d-1" }),
			}),
		);
	});

	it("rejects an unknown department invite code", async () => {
		mockedPrisma.department.findUnique.mockResolvedValue(null);
		const result = await createProfileForCurrentUser({
			...baseInput,
			departmentInviteCode: "NOPE12345678",
		} as never);
		expect(result.success).toBe(false);
		if (!result.success) expect(result.error).toContain("Invalid invite code");
	});

	it("stamps the department on a retried STAFF submit (P2002, missing department)", async () => {
		mockedPrisma.department.findUnique.mockResolvedValue(DEPT as never);
		mockedPrisma.profiles.create.mockRejectedValueOnce({ code: "P2002" });
		mockedPrisma.profiles.findUnique.mockResolvedValue(STAFF_ROW as never);
		mockedPrisma.profiles.update.mockResolvedValue({
			...STAFF_ROW,
			department_id: "d-1",
		} as never);

		const result = await createProfileForCurrentUser({
			...baseInput,
			departmentInviteCode: "ABC234XYZ789",
		} as never);
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.department_id).toBe("d-1");
		}
		expect(mockedPrisma.profiles.update).toHaveBeenCalledWith({
			where: { profile_id: "u-1" },
			data: { department_id: "d-1" },
		});
	});

	it("stays idempotent-success when the department stamp itself fails", async () => {
		mockedPrisma.department.findUnique.mockResolvedValue(DEPT as never);
		mockedPrisma.profiles.create.mockRejectedValueOnce({ code: "P2002" });
		mockedPrisma.profiles.findUnique.mockResolvedValue(STAFF_ROW as never);
		mockedPrisma.profiles.update.mockRejectedValueOnce(new Error("db down"));

		const result = await createProfileForCurrentUser({
			...baseInput,
			departmentInviteCode: "ABC234XYZ789",
		} as never);
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.department_id).toBeNull();
		}
	});

	it("never stamps a CLIENT profile and still returns idempotent success", async () => {
		mockedPrisma.clients.findUnique.mockResolvedValue({
			client_id: "c-1",
			is_deleted: false,
		} as never);
		mockedPrisma.department.findUnique.mockResolvedValue(DEPT as never);
		mockedPrisma.profiles.create.mockRejectedValueOnce({ code: "P2002" });
		mockedPrisma.profiles.findUnique.mockResolvedValue(CLIENT_ROW as never);

		const result = await createProfileForCurrentUser({
			...baseInput,
			email: "client@example.com",
			inviteCode: "CLIENT12345",
			departmentInviteCode: "ABC234XYZ789",
		} as never);
		expect(result.success).toBe(true);
		expect(mockedPrisma.profiles.update).not.toHaveBeenCalled();
	});
});
