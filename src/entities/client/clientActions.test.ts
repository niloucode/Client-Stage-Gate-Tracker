import { describe, expect, it, vi, beforeEach } from "vitest";

// Mock the DB + session boundary so the server actions are testable without
// a database. The REAL invite-code hashing runs (dev pepper) — only prisma
// and the session lookup are stubbed.
vi.mock("@/lib/prisma", () => ({
	prisma: {
		clients: {
			findUnique: vi.fn(),
			findMany: vi.fn(),
			update: vi.fn(),
			create: vi.fn(),
		},
		profiles: { findUnique: vi.fn() },
	},
}));
vi.mock("@/lib/auth/projectAccess", () => ({
	getCurrentUserId: vi.fn(),
}));

import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/auth/projectAccess";
import {
	resolveClientByInviteCode,
	regenerateClientInviteCode,
	clientCreate,
	clientUpdate,
	clientSelectAll,
	clientSelectOwn,
} from "./clientActions";
import { hashInviteCode } from "@/shared/lib/inviteCode";

const mockedPrisma = vi.mocked(prisma, true);
const mockedUserId = vi.mocked(getCurrentUserId);

const CLIENT = {
	client_id: "9a0e8f25-4b3c-4f1e-9a2d-7c6b5a4f3e2d",
	client_name: "Acme Corp",
	tin: "123-456-789",
	billing_address: "1 Test St",
	is_deleted: false,
	deleted_at: null,
	email: "hello@acme.test",
	phone: "+1 555 000 0000",
	invite_code_hash: null,
};

/** Signed-in PROJECT OWNER profile (passes requireProjectOwner). */
const OWNER_PROFILE = {
	client_id: null,
	Department: { name: "Project Owner" },
};

function mockOwnerSession() {
	mockedUserId.mockResolvedValue("owner-profile-id");
	mockedPrisma.profiles.findUnique.mockResolvedValue(OWNER_PROFILE as never);
}

beforeEach(() => {
	vi.clearAllMocks();
});

describe("resolveClientByInviteCode", () => {
	it("resolves a valid code to its client (case-insensitive)", async () => {
		const code = "K7Q2M9XWAB";
		mockedPrisma.clients.findUnique.mockResolvedValue(CLIENT);

		const result = await resolveClientByInviteCode(code.toLowerCase());

		expect(result).toEqual({
			success: true,
			client_id: CLIENT.client_id,
			client_name: CLIENT.client_name,
		});
		expect(mockedPrisma.clients.findUnique).toHaveBeenCalledWith({
			where: { invite_code_hash: hashInviteCode(code) },
			select: { client_id: true, client_name: true, is_deleted: true },
		});
	});

	it("rejects an unknown code with a non-enumerating message", async () => {
		mockedPrisma.clients.findUnique.mockResolvedValue(null);

		const result = await resolveClientByInviteCode("AAAAAAAAAAAA");

		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.error).toContain("Invalid invite code");
		}
	});

	it("rejects a code belonging to a deleted client", async () => {
		mockedPrisma.clients.findUnique.mockResolvedValue({
			...CLIENT,
			is_deleted: true,
		});

		const result = await resolveClientByInviteCode("AAAAAAAAAAAA");

		expect(result.success).toBe(false);
	});

	it("rejects an empty code", async () => {
		const result = await resolveClientByInviteCode("   ");

		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.error).toContain("Enter your invite code");
		}
		expect(mockedPrisma.clients.findUnique).not.toHaveBeenCalled();
	});
});

describe("regenerateClientInviteCode", () => {
	it("allows the project owner and returns the new code exactly once", async () => {
		mockOwnerSession();
		mockedPrisma.clients.update.mockResolvedValue(CLIENT);

		const result = await regenerateClientInviteCode(CLIENT.client_id);

		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.inviteCode).toMatch(/^[A-Z2-9]{12}$/);
			expect(mockedPrisma.clients.update).toHaveBeenCalledTimes(1);
		}
	});

	it("rejects client employees (profile linked to a client)", async () => {
		mockedUserId.mockResolvedValue("client-profile-id");
		mockedPrisma.profiles.findUnique.mockResolvedValue({
			client_id: CLIENT.client_id,
		} as never);

		const result = await regenerateClientInviteCode(CLIENT.client_id);

		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.error).toBe("Only the project owner can manage clients.");
		}
		expect(mockedPrisma.clients.update).not.toHaveBeenCalled();
	});

	it("rejects Project Team members", async () => {
		mockedUserId.mockResolvedValue("team-profile-id");
		mockedPrisma.profiles.findUnique.mockResolvedValue({
			client_id: null,
			Department: { name: "Project Team" },
		} as never);

		const result = await regenerateClientInviteCode(CLIENT.client_id);

		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.error).toBe("Only the project owner can manage clients.");
		}
		expect(mockedPrisma.clients.update).not.toHaveBeenCalled();
	});

	it("rejects unauthenticated callers", async () => {
		mockedUserId.mockResolvedValue(null);

		const result = await regenerateClientInviteCode(CLIENT.client_id);

		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.error).toBe("Authentication required.");
		}
		expect(mockedPrisma.clients.update).not.toHaveBeenCalled();
	});
});

describe("clientCreate", () => {
	const input = {
		client_name: "Acme Corp",
		tin: "123-456-789",
		email: "hello@acme.test",
		phone: "+1 555 000 0000",
		billing_address: "1 Test St",
	};

	it("creates the client with a hashed code and returns the code once", async () => {
		mockOwnerSession();
		mockedPrisma.clients.create.mockResolvedValue(CLIENT);

		const result = await clientCreate(input);

		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.inviteCode).toMatch(/^[A-Z2-9]{12}$/);
			const createdData = mockedPrisma.clients.create.mock.calls[0][0]
				.data as { invite_code_hash: string };
			expect(createdData.invite_code_hash).toBe(
				hashInviteCode(result.inviteCode!),
			);
		}
	});

	it("rejects non-owners before touching the database", async () => {
		mockedUserId.mockResolvedValue("team-profile-id");
		mockedPrisma.profiles.findUnique.mockResolvedValue({
			client_id: null,
			Department: { name: "Project Team" },
		} as never);

		const result = await clientCreate(input);

		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.error).toBe("Only the project owner can manage clients.");
		}
		expect(mockedPrisma.clients.create).not.toHaveBeenCalled();
	});

	it("retries on an invite-code hash collision, then succeeds", async () => {
		mockOwnerSession();
		const collision = {
			code: "P2002",
			meta: { target: ["invite_code_hash"] },
		};
		mockedPrisma.clients.create
			.mockRejectedValueOnce(collision)
			.mockResolvedValueOnce(CLIENT);

		const result = await clientCreate(input);

		expect(result.success).toBe(true);
		expect(mockedPrisma.clients.create).toHaveBeenCalledTimes(2);
	});

	it("surfaces the actionable TIN-duplicate error", async () => {
		mockOwnerSession();
		mockedPrisma.clients.create.mockRejectedValue({
			code: "P2002",
			meta: { target: ["tin"] },
		});

		const result = await clientCreate(input);

		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.error).toBe("A client with this TIN already exists.");
		}
	});
});

describe("clientSelectAll (read-path guard)", () => {
	it("returns the registry for staff", async () => {
		mockedUserId.mockResolvedValue("staff-profile-id");
		mockedPrisma.profiles.findUnique.mockResolvedValue({
			client_id: null,
		} as never);
		mockedPrisma.clients.findMany.mockResolvedValue([CLIENT]);

		const result = await clientSelectAll();

		expect(result).toHaveLength(1);
		expect(result[0]).not.toHaveProperty("invite_code_hash");
		expect(result[0]).toHaveProperty("has_invite_code", false);
	});

	it("throws for client employees (no registry access)", async () => {
		mockedUserId.mockResolvedValue("client-profile-id");
		mockedPrisma.profiles.findUnique.mockResolvedValue({
			client_id: CLIENT.client_id,
		} as never);

		await expect(clientSelectAll()).rejects.toThrow(
			"Only staff can view clients.",
		);
		expect(mockedPrisma.clients.findMany).not.toHaveBeenCalled();
	});

	it("throws for unauthenticated callers", async () => {
		mockedUserId.mockResolvedValue(null);

		await expect(clientSelectAll()).rejects.toThrow(
			"Authentication required.",
		);
		expect(mockedPrisma.clients.findMany).not.toHaveBeenCalled();
	});
});

describe("clientSelectOwn", () => {
	it("returns the caller's own client row for client profiles", async () => {
		mockedUserId.mockResolvedValue("client-profile-id");
		mockedPrisma.profiles.findUnique.mockResolvedValue({
			client_id: CLIENT.client_id,
		} as never);
		mockedPrisma.clients.findUnique.mockResolvedValue({
			client_id: CLIENT.client_id,
			client_name: CLIENT.client_name,
		} as never);

		const result = await clientSelectOwn();

		expect(result).toEqual({
			client_id: CLIENT.client_id,
			client_name: CLIENT.client_name,
		});
		expect(mockedPrisma.clients.findUnique).toHaveBeenCalledWith({
			where: { client_id: CLIENT.client_id, is_deleted: false },
			select: { client_id: true, client_name: true },
		});
	});

	it("returns null for staff (no client linked)", async () => {
		mockedUserId.mockResolvedValue("staff-profile-id");
		mockedPrisma.profiles.findUnique.mockResolvedValue({
			client_id: null,
		} as never);

		const result = await clientSelectOwn();

		expect(result).toBeNull();
		expect(mockedPrisma.clients.findUnique).not.toHaveBeenCalled();
	});
});

describe("clientUpdate", () => {
	const updateInput = {
		client_id: CLIENT.client_id,
		client_name: "Acme Corp",
		tin: "123-456-789",
		email: "hello@acme.test",
		phone: "+1 555 000 0000",
		billing_address: "1 Test St",
		is_deleted: false,
	};

	it("allows the project owner to update a client", async () => {
		mockOwnerSession();
		mockedPrisma.clients.update.mockResolvedValue(CLIENT);

		const result = await clientUpdate(updateInput);

		expect(result.success).toBe(true);
		expect(mockedPrisma.clients.update).toHaveBeenCalledTimes(1);
	});

	it("rejects Project Team members before touching the database", async () => {
		mockedUserId.mockResolvedValue("team-profile-id");
		mockedPrisma.profiles.findUnique.mockResolvedValue({
			client_id: null,
			Department: { name: "Project Team" },
		} as never);

		const result = await clientUpdate(updateInput);

		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.error).toBe("Only the project owner can manage clients.");
		}
		expect(mockedPrisma.clients.update).not.toHaveBeenCalled();
	});
});
