import { describe, expect, it, vi, beforeEach } from "vitest";

/**
 * Mock-faithful integration tests for the 1-to-1 issue↔ticket sync paths
 * (2026-08-15 spec) inside the REAL ticketActions server actions.
 *
 * The prisma mock is shaped like the real client: `$transaction(fn)` executes
 * `fn` with the SAME object, so every `tx.*` call inside a transaction routes
 * to the same vi.fn() spies as the top-level calls — the orchestration
 * (guards, ordering, status derivation, release rules) is tested exactly as
 * it runs, with deterministic DB responses.
 */

vi.mock("@/lib/prisma", () => ({
	prisma: {
		$transaction: vi.fn(),
		tickets: {
			findUnique: vi.fn(),
			findMany: vi.fn(),
			create: vi.fn(),
			update: vi.fn(),
			updateMany: vi.fn(),
		},
		issues: { findUnique: vi.fn(), update: vi.fn() },
		historyEvent: { create: vi.fn(), createMany: vi.fn() },
		workflows: { findUnique: vi.fn(), findMany: vi.fn(), update: vi.fn() },
		modules: { update: vi.fn() },
	},
}));
vi.mock("@/lib/auth/projectAccess", () => ({
	resolveWorkflowProject: vi.fn(),
	resolveTicketProject: vi.fn(),
	assertProjectMemberNotClient: vi.fn(),
	getCurrentUserId: vi.fn(),
}));

import { prisma } from "@/lib/prisma";
import { Prisma } from "@/lib/generated/prisma";
import {
	resolveWorkflowProject,
	resolveTicketProject,
	assertProjectMemberNotClient,
} from "@/lib/auth/projectAccess";
import {
	createTicket,
	updateTicket,
	updateTicketStatus,
	cascadeSoftDeleteTicket,
} from "./ticketActions";

const mockedPrisma = vi.mocked(prisma, true);
const mockedResolveWorkflow = vi.mocked(resolveWorkflowProject);
const mockedResolveTicket = vi.mocked(resolveTicketProject);
const mockedAssertMember = vi.mocked(assertProjectMemberNotClient);

// ── Fixtures ────────────────────────────────────────────────────────────────

const ISSUE_ID = "11111111-1111-4111-8111-111111111111";
const TICKET_ID = "22222222-2222-4222-8222-222222222222";
const WORKFLOW_ID = "33333333-3333-4333-8333-333333333333";
const PROJECT_ID = "44444444-4444-4444-8444-444444444444";

const TICKET_ROW = {
	ticket_id: TICKET_ID,
	workflow_id: WORKFLOW_ID,
	name: "Login bug",
	status: "IN_PROGRESS",
	issue_id: ISSUE_ID,
	watcher_id: null,
	plan_start_at: null,
	plan_end_at: new Date("2026-08-20T00:00:00Z"),
	actual_start_at: null,
	actual_end_at: null,
	description: null,
	api_route: null,
	api_method: null,
	parent_id: null,
	is_deleted: false,
	deleted_at: null,
};

const EXISTING_SELECT = {
	name: "Login bug",
	status: "IN_PROGRESS",
	watcher_id: null,
	workflow_id: WORKFLOW_ID,
	issue_id: ISSUE_ID,
	TicketAssigned: [],
	TicketTags: [],
};

/** Valid payloads that pass the zod schemas. */
const CREATE_INPUT = {
	name: "Login bug",
	plan_end_at: new Date("2026-08-20T00:00:00Z"),
	workflow_id: WORKFLOW_ID,
	status: "IN_PROGRESS" as const,
	TicketAssigned: [],
	tagIds: [],
};

function setupDefaults() {
	mockedPrisma.$transaction.mockImplementation((async (
		fn: (tx: typeof prisma) => unknown,
	) => fn(prisma)) as never);
	mockedPrisma.tickets.findUnique.mockResolvedValue(EXISTING_SELECT as never);
	mockedPrisma.tickets.findMany.mockResolvedValue([] as never);
	mockedPrisma.tickets.create.mockResolvedValue(TICKET_ROW as never);
	mockedPrisma.tickets.update.mockResolvedValue({
		...TICKET_ROW,
		status: "FINISHED",
	} as never);
	mockedPrisma.tickets.updateMany.mockResolvedValue({ count: 1 } as never);
	// Default: the linked ticket is pending → derived status LINKED.
	mockedPrisma.issues.findUnique.mockResolvedValue({
		Tickets: [{ status: "IN_PROGRESS", is_deleted: false }],
	} as never);
	mockedPrisma.issues.update.mockResolvedValue({} as never);
	mockedPrisma.historyEvent.create.mockResolvedValue({} as never);
	mockedPrisma.historyEvent.createMany.mockResolvedValue({ count: 0 } as never);
	mockedPrisma.workflows.findUnique.mockResolvedValue({
		module_id: null,
	} as never);
	mockedPrisma.workflows.findMany.mockResolvedValue([] as never);
	mockedPrisma.workflows.update.mockResolvedValue({} as never);
	mockedPrisma.modules.update.mockResolvedValue({} as never);

	mockedResolveWorkflow.mockResolvedValue(PROJECT_ID);
	mockedResolveTicket.mockResolvedValue(PROJECT_ID);
	mockedAssertMember.mockResolvedValue({ ok: true } as never);
}

beforeEach(() => {
	vi.clearAllMocks();
	setupDefaults();
});

// ── createTicket: link guard + initial sync ────────────────────────────────

describe("createTicket — issue link", () => {
	it("syncs a freshly linked issue to LINKED", async () => {
		// Guard consumes the first issues.findUnique (project check); the
		// status sync consumes the second (linked ticket lookup).
		mockedPrisma.issues.findUnique
			.mockResolvedValueOnce({ project_id: PROJECT_ID } as never)
			.mockResolvedValueOnce({
				Tickets: [{ status: "IN_PROGRESS", is_deleted: false }],
			} as never);

		const created = await createTicket({ ...CREATE_INPUT, issue_id: ISSUE_ID });

		expect(created.ticket_id).toBe(TICKET_ID);
		expect(mockedPrisma.issues.update).toHaveBeenCalledWith({
			where: { issue_id: ISSUE_ID },
			data: { status: "LINKED" },
		});
	});

	it("rejects a cross-project issue before touching the DB", async () => {
		mockedPrisma.issues.findUnique.mockResolvedValueOnce({
			project_id: "some-other-project",
		} as never);

		await expect(
			createTicket({ ...CREATE_INPUT, issue_id: ISSUE_ID }),
		).rejects.toThrow("This issue does not belong to this project.");

		expect(mockedPrisma.tickets.create).not.toHaveBeenCalled();
		expect(mockedPrisma.issues.update).not.toHaveBeenCalled();
	});

	it("surfaces the friendly 1-to-1 conflict when the issue is already linked", async () => {
		mockedPrisma.issues.findUnique.mockResolvedValueOnce({
			project_id: PROJECT_ID,
		} as never);
		mockedPrisma.tickets.create.mockRejectedValueOnce(
			new Prisma.PrismaClientKnownRequestError("Unique constraint failed", {
				code: "P2002",
				clientVersion: "test",
				meta: { target: ["issue_id"] },
			}),
		);

		await expect(
			createTicket({ ...CREATE_INPUT, issue_id: ISSUE_ID }),
		).rejects.toThrow("This issue is already linked to another ticket.");
	});
});

// ── updateTicket: link moves / status transitions ─────────────────────────

describe("updateTicket — issue sync", () => {
	it("resolves the issue when the linked ticket becomes FINISHED", async () => {
		mockedPrisma.tickets.findUnique.mockResolvedValueOnce({
			...EXISTING_SELECT,
			status: "IN_PROGRESS",
		} as never);
		// assertIssueInProject (guard) → then sync sees the FINISHED ticket.
		mockedPrisma.issues.findUnique
			.mockResolvedValueOnce({ project_id: PROJECT_ID } as never)
			.mockResolvedValueOnce({
				Tickets: [{ status: "FINISHED", is_deleted: false }],
			} as never);

		const updated = await updateTicket({
			ticket_id: TICKET_ID,
			workflow_id: WORKFLOW_ID,
			status: "FINISHED",
			issue_id: ISSUE_ID,
			TicketAssigned: [],
			tagIds: [],
		});

		expect(updated.status).toBe("FINISHED");
		expect(mockedPrisma.issues.update).toHaveBeenCalledWith({
			where: { issue_id: ISSUE_ID },
			data: { status: "RESOLVED" },
		});
	});

	it("unlinks the previous issue to UNLINKED when issue_id is cleared", async () => {
		mockedPrisma.tickets.findUnique.mockResolvedValueOnce(
			EXISTING_SELECT as never,
		);
		mockedPrisma.issues.findUnique.mockResolvedValueOnce({
			Tickets: [],
		} as never);

		await updateTicket({
			ticket_id: TICKET_ID,
			workflow_id: WORKFLOW_ID,
			issue_id: null,
			TicketAssigned: [],
			tagIds: [],
		});

		expect(mockedPrisma.issues.update).toHaveBeenCalledWith({
			where: { issue_id: ISSUE_ID },
			data: { status: "UNLINKED" },
		});
	});

	it("syncs the linked issue on a status-only change (no issue_id in the payload)", async () => {
		mockedPrisma.tickets.findUnique.mockResolvedValueOnce({
			...EXISTING_SELECT,
			status: "IN_PROGRESS",
		} as never);
		mockedPrisma.issues.findUnique.mockResolvedValueOnce({
			Tickets: [{ status: "FINISHED", is_deleted: false }],
		} as never);

		await updateTicket({
			ticket_id: TICKET_ID,
			workflow_id: WORKFLOW_ID,
			status: "FINISHED",
			TicketAssigned: [],
			tagIds: [],
		});

		expect(mockedPrisma.issues.update).toHaveBeenCalledWith({
			where: { issue_id: ISSUE_ID },
			data: { status: "RESOLVED" },
		});
	});
});

// ── updateTicketStatus ─────────────────────────────────────────────────────

describe("updateTicketStatus — issue sync", () => {
	it("resolves the linked issue on a FINISHED transition", async () => {
		mockedPrisma.tickets.findUnique.mockResolvedValueOnce({
			status: "IN_PROGRESS",
			workflow_id: WORKFLOW_ID,
			issue_id: ISSUE_ID,
		} as never);
		mockedPrisma.issues.findUnique.mockResolvedValueOnce({
			Tickets: [{ status: "FINISHED", is_deleted: false }],
		} as never);

		await updateTicketStatus(TICKET_ID, "FINISHED");

		expect(mockedPrisma.issues.update).toHaveBeenCalledWith({
			where: { issue_id: ISSUE_ID },
			data: { status: "RESOLVED" },
		});
	});

	it("does not touch the issue when the status is unchanged", async () => {
		mockedPrisma.tickets.findUnique.mockResolvedValueOnce({
			status: "FINISHED",
			workflow_id: WORKFLOW_ID,
			issue_id: ISSUE_ID,
		} as never);

		await updateTicketStatus(TICKET_ID, "FINISHED");

		expect(mockedPrisma.issues.update).not.toHaveBeenCalled();
	});
});

// ── cascadeSoftDeleteTicket: release rules ─────────────────────────────────

describe("cascadeSoftDeleteTicket — link release rules", () => {
	function mockTicketRow(status: string) {
		mockedPrisma.tickets.findUnique.mockResolvedValueOnce({
			name: "Login bug",
			workflow_id: WORKFLOW_ID,
			issue_id: ISSUE_ID,
			status,
		} as never);
	}

	it("releases a non-FINISHED ticket's issue and sets it UNLINKED", async () => {
		mockTicketRow("IN_PROGRESS");
		mockedPrisma.issues.findUnique.mockResolvedValueOnce({
			Tickets: [],
		} as never);

		const result = await cascadeSoftDeleteTicket(
			TICKET_ID,
			undefined,
			"cascade",
		);

		expect(result).toEqual({ success: true });
		// Call 1 = soft-delete flag, call 2 = the link release.
		expect(mockedPrisma.tickets.updateMany).toHaveBeenNthCalledWith(
			2,
			expect.objectContaining({ data: { issue_id: null } }),
		);
		expect(mockedPrisma.issues.update).toHaveBeenCalledWith({
			where: { issue_id: ISSUE_ID },
			data: { status: "UNLINKED" },
		});
	});

	it("keeps a FINISHED ticket's link (issue stays resolved) on soft delete", async () => {
		mockTicketRow("FINISHED");

		const result = await cascadeSoftDeleteTicket(
			TICKET_ID,
			undefined,
			"cascade",
		);

		expect(result).toEqual({ success: true });
		// Only the soft-delete update ran — no release update, no sync.
		expect(mockedPrisma.tickets.updateMany).toHaveBeenCalledTimes(1);
		expect(mockedPrisma.issues.update).not.toHaveBeenCalled();
	});

	it("releases the links of cascaded children (whole subtree)", async () => {
		const CHILD_ID = "55555555-5555-4555-8555-555555555555";
		const CHILD_ISSUE = "66666666-6666-4666-8666-666666666666";
		mockTicketRow("PENDING");
		// First findMany = direct children of the deleted ticket.
		mockedPrisma.tickets.findMany.mockResolvedValueOnce([
			{ ticket_id: CHILD_ID, issue_id: CHILD_ISSUE, status: "IN_PROGRESS" },
		] as never);
		mockedPrisma.issues.findUnique
			.mockResolvedValueOnce({ Tickets: [] } as never) // parent issue
			.mockResolvedValueOnce({ Tickets: [] } as never); // child issue

		await cascadeSoftDeleteTicket(TICKET_ID, undefined, "cascade");

		// Soft-delete covered both rows; the release pass cleared both links.
		expect(mockedPrisma.tickets.updateMany).toHaveBeenNthCalledWith(
			2,
			expect.objectContaining({
				where: {
					ticket_id: { in: expect.arrayContaining([TICKET_ID, CHILD_ID]) },
				},
				data: { issue_id: null },
			}),
		);
		expect(mockedPrisma.issues.update).toHaveBeenCalledTimes(2);
		expect(mockedPrisma.issues.update).toHaveBeenCalledWith({
			where: { issue_id: CHILD_ISSUE },
			data: { status: "UNLINKED" },
		});
	});
});
