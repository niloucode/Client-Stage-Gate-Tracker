// Canonical issue types — moved here from features/issue-reporting (2026-08-15)
// so the ticket-board (features layer) can import them without a same-layer
// feature→feature dependency. The server row shape lives in lib/mappers.ts;
// `mapIssueRow` produces this UI shape.

export type UrgencyLevel = "low" | "medium" | "high";

export type BugType =
	| "feature_request"
	| "deadlinks"
	| "missing_fields"
	| "not_saving"
	| "slow_loading"
	| "other";

/** Lowercase mirror of the DB IssueStatus enum, matching the legacy UI tabs. */
export type IssueStatusValue = "unlinked" | "linked" | "resolved";

export interface StepItem {
	id: string;
	description: string;
	image?: string;
}

export interface IssueItem {
	id: string;
	name: string;
	/** BugType enum value, or the free text stored for type "other". */
	type: string;
	urgency: UrgencyLevel;
	status: IssueStatusValue;
	/** Display name of the reporting profile. */
	clientName: string;
	reportedAt: string;
	description: string;
	systemEnv: string;
	timeOfError: string;
	ticketName?: string;
	ticketId?: string;
	steps: StepItem[];
}

/**
 * Light issue shape used by the ticket-board's linked-issue chip. The board
 * only renders `name` + urgency styling, so `ticketInclude.Issues` selects
 * exactly these fields instead of the full issue tree (read weight — every
 * board ticket used to carry IssueSteps + Profile + Tickets). A full
 * `IssueItem` from the picker is structurally assignable to this type.
 */
export interface LinkedIssueChip {
	id: string;
	name: string;
	type: string;
	urgency: UrgencyLevel;
	status: IssueStatusValue;
}
