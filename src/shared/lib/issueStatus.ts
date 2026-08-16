import type { status } from "@/lib/generated/prisma";

export type IssueStatusValue = "UNLINKED" | "LINKED" | "RESOLVED";

/**
 * 1-to-1 issue↔ticket rule (2026-08-15 spec): an issue is RESOLVED when its
 * linked ticket is FINISHED, LINKED while the linked ticket is pending or in
 * progress, and UNLINKED when no ticket is linked.
 *
 * Used by the ticket mutations (ticketActions) to keep Issues.status in sync
 * when a ticket is linked/unlinked, changes status, or is soft-deleted.
 * @param ticketStatus - The linked ticket's status, or null when unlinked.
 * @returns The derived issue status.
 */
export function deriveIssueStatus(
	ticketStatus: status | null,
): IssueStatusValue {
	if (ticketStatus === null) return "UNLINKED";
	return ticketStatus === "FINISHED" ? "RESOLVED" : "LINKED";
}

/**
 * Soft-delete rule (2026-08-15 spec): a FINISHED ticket keeps its issue link
 * (the issue stays resolved); a PENDING/IN_PROGRESS ticket releases the link
 * when it is soft-deleted (the issue goes back to UNLINKED).
 * @param ticketStatus - The ticket's status at delete time.
 * @returns True when the soft-deleted ticket keeps its issue link.
 */
export function shouldKeepLinkOnDelete(ticketStatus: status): boolean {
	return ticketStatus === "FINISHED";
}
