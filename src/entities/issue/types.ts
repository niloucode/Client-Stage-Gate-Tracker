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
