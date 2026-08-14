import type { IssueStatus, IssueUrgency } from "@/lib/generated/prisma";
import type { IssueItem, UrgencyLevel } from "../types";

/** Server row shapes (Prisma include payloads for an issue). */

export interface IssueStepRow {
	number: number;
	step: string;
	image: string | null;
}

export interface IssueTicketLinkRow {
	ticket_id: string;
	name: string;
}

export interface IssueReporterRow {
	first_name: string;
	last_name: string;
}

export interface IssueRow {
	issue_id: string;
	project_id: string;
	reported_by: string | null;
	reported_at: Date;
	status: IssueStatus;
	name: string;
	type: string;
	description: string | null;
	urgency: IssueUrgency;
	system_environment: string | null;
	time_of_error: Date | null;
	IssueSteps: IssueStepRow[];
	/** 1-to-1: at most one linked ticket (FINISHED soft-deleted tickets keep the link). */
	Tickets: IssueTicketLinkRow[];
	Profile: IssueReporterRow | null;
}

/** Matches the legacy mock's display format: "08/02/2026, 14:30" (24h). */
export function formatIssueDateTime(date: Date): string {
	return `${date.toLocaleDateString("en-US", {
		month: "2-digit",
		day: "2-digit",
		year: "numeric",
	})}, ${date.toLocaleTimeString("en-US", {
		hour: "2-digit",
		minute: "2-digit",
		hour12: false,
	})}`;
}

/**
 * Maps a server issue row (with IssueSteps / Tickets / Profile includes) to
 * the UI `IssueItem` shape used by the issue page and the ticket-board picker.
 */
export function mapIssueRow(row: IssueRow): IssueItem {
	const ticket = row.Tickets[0] ?? null;
	return {
		id: row.issue_id,
		name: row.name,
		type: row.type,
		urgency: row.urgency.toLowerCase() as UrgencyLevel,
		status: row.status.toLowerCase() as IssueItem["status"],
		clientName: row.Profile
			? `${row.Profile.first_name} ${row.Profile.last_name}`
			: "Unknown",
		reportedAt: formatIssueDateTime(row.reported_at),
		description: row.description ?? "",
		systemEnv: row.system_environment ?? "",
		timeOfError: row.time_of_error ? formatIssueDateTime(row.time_of_error) : "N/A",
		ticketName: ticket?.name,
		ticketId: ticket?.ticket_id,
		steps: row.IssueSteps.map((s) => ({
			id: String(s.number),
			description: s.step,
			image: s.image ?? undefined,
		})),
	};
}
