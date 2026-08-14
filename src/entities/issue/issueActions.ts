"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/auth/projectAccess";

export interface IssueStats {
	total: number;
	byUrgency: { urgency: "LOW" | "MEDIUM" | "HIGH"; count: number }[];
	assigned: number;
	unassigned: number;
}

/**
 * Issue stats for the landing-dashboard charts:
 *  - byUrgency: issue counts per IssueUrgency (LOW / MEDIUM / HIGH)
 *  - assigned / unassigned: whether any ticket links the issue
 *    (team members must manually assign issues to tickets, so the
 *    unassigned slice is the actionable signal).
 *
 * Issues are not user- or project-scoped in the schema, so the stats are
 * system-wide. Returns null when there is no authenticated user.
 */
export async function getIssueStats(): Promise<IssueStats | null> {
	const userId = await getCurrentUserId();
	if (!userId) return null;

	// Staff-facing aggregate: client profiles must not read system-wide
	// counts even by calling the action directly (matches the UI gate).
	const profile = await prisma.profiles.findUnique({
		where: { profile_id: userId },
		select: { client_id: true },
	});
	if (!profile || profile.client_id) return null;

	const issues = await prisma.issues.findMany({
		select: {
			urgency: true,
			_count: { select: { Tickets: true } },
		},
	});

	const byUrgency: Record<"LOW" | "MEDIUM" | "HIGH", number> = {
		LOW: 0,
		MEDIUM: 0,
		HIGH: 0,
	};
	let assigned = 0;

	for (const issue of issues) {
		byUrgency[issue.urgency] += 1;
		if (issue._count.Tickets > 0) assigned += 1;
	}

	return {
		total: issues.length,
		byUrgency: [
			{ urgency: "LOW", count: byUrgency.LOW },
			{ urgency: "MEDIUM", count: byUrgency.MEDIUM },
			{ urgency: "HIGH", count: byUrgency.HIGH },
		],
		assigned,
		unassigned: issues.length - assigned,
	};
}
