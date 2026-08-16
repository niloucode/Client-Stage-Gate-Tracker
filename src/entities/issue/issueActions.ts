"use server";

import { prisma } from "@/lib/prisma";
import {
	getCurrentUserId,
	assertProjectMemberOrClient,
} from "@/lib/auth/projectAccess";
import type { Prisma, IssueUrgency } from "@/lib/generated/prisma";
import {
	issueCreateSchema,
	type IssueCreateInput,
} from "@/shared/schemas/issue";
import { mapIssueRow } from "./lib/mappers";
import type { IssueItem } from "./types";

export interface IssueStats {
	total: number;
	byUrgency: { urgency: "LOW" | "MEDIUM" | "HIGH"; count: number }[];
	assigned: number;
	unassigned: number;
}

/**
 * Server-side include for issue reads. 1-to-1 issue↔ticket: `Tickets` carries
 * at most one row (FINISHED soft-deleted tickets keep their link per spec).
 * Module-private: a "use server" file may only export async functions
 * (Next.js rule — an exported object breaks every import of this module).
 * @returns The result.
 */
const issueDetailInclude = {
	IssueSteps: { orderBy: { number: "asc" as const } },
	Tickets: { take: 1 },
	Profile: { select: { first_name: true, last_name: true } },
} satisfies Prisma.IssuesInclude;

/**
 * Creates a project-scoped issue. Both clients and project team/owners may
 * report issues (spec 2026-08-15); the reporter profile is recorded
 * server-side from the session.
 * @param projectId
 * @param data
 * @returns The result.
 */
export async function createIssue(
	projectId: string,
	data: IssueCreateInput,
): Promise<IssueItem> {
	const auth = await assertProjectMemberOrClient(projectId);
	if (!auth.ok) throw new Error(auth.error);

	const parsed = issueCreateSchema.parse(data);
	// "other" stores the free text in the DB `type` column (the UI renders
	// raw type strings via bugTypeLabel).
	const dbType =
		parsed.type === "other" && parsed.specificType.trim()
			? parsed.specificType.trim()
			: parsed.type;
	const steps = parsed.steps.filter(
		(s) => s.description.trim() !== "" || !!s.image,
	);

	const created = await prisma.issues.create({
		data: {
			project_id: projectId,
			reported_by: auth.userId,
			status: "UNLINKED",
			name: parsed.name,
			type: dbType,
			description: parsed.description || null,
			urgency: parsed.urgency.toUpperCase() as IssueUrgency,
			system_environment: parsed.systemEnv || null,
			time_of_error: parsed.timeOfError,
			IssueSteps: {
				create: steps.map((s, index) => ({
					number: index + 1,
					step: s.description,
					image: s.image ?? null,
				})),
			},
		},
		include: issueDetailInclude,
	});
	return mapIssueRow(created);
}

/**
 * Project-scoped issue list (newest first), mapped to the UI shape.
 * Any project member — including the contract client — may read.
 * @param projectId
 * @returns The result.
 */
export async function listIssues(projectId: string): Promise<IssueItem[]> {
	const auth = await assertProjectMemberOrClient(projectId);
	if (!auth.ok) throw new Error(auth.error);

	const rows = await prisma.issues.findMany({
		where: { project_id: projectId },
		orderBy: { reported_at: "desc" },
		include: issueDetailInclude,
	});
	return rows.map(mapIssueRow);
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
 * @returns The result.
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
