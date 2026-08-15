import { describe, expect, it } from "vitest";
import type { status } from "@/lib/generated/prisma";
import { deriveIssueStatus, shouldKeepLinkOnDelete } from "./issueStatus";

describe("deriveIssueStatus (1-to-1 issue↔ticket rule)", () => {
	it("returns UNLINKED when no ticket is linked", () => {
		expect(deriveIssueStatus(null)).toBe("UNLINKED");
	});

	it("returns LINKED while the linked ticket is pending", () => {
		expect(deriveIssueStatus("PENDING" as status)).toBe("LINKED");
	});

	it("returns LINKED while the linked ticket is in progress", () => {
		expect(deriveIssueStatus("IN_PROGRESS" as status)).toBe("LINKED");
	});

	it("returns RESOLVED when the linked ticket is finished", () => {
		expect(deriveIssueStatus("FINISHED" as status)).toBe("RESOLVED");
	});
});

describe("shouldKeepLinkOnDelete (soft-delete rule)", () => {
	it("keeps the link when the ticket is already finished", () => {
		expect(shouldKeepLinkOnDelete("FINISHED" as status)).toBe(true);
	});

	it("releases the link when the ticket is pending or in progress", () => {
		expect(shouldKeepLinkOnDelete("PENDING" as status)).toBe(false);
		expect(shouldKeepLinkOnDelete("IN_PROGRESS" as status)).toBe(false);
	});
});
