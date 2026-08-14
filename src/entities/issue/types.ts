// Canonical issue types — moved here from features/issue-reporting (2026-08-15)
// so the ticket-board (features layer) can import them without a same-layer
// feature→feature dependency.

export type UrgencyLevel = "low" | "medium" | "high";

export type BugType =
  | "feature_request"
  | "deadlinks"
  | "missing_fields"
  | "not_saving"
  | "slow_loading"
  | "other";

export interface StepItem {
  id: string;
  description: string;
  image?: string;
}

export interface IssueItem {
  id: string;
  name: string;
  type: BugType;
  specificType?: string;
  urgency: UrgencyLevel;
  status: "unlinked" | "linked" | "resolved";
  clientName: string;
  reportedAt: string;
  description: string;
  systemEnv: string;
  timeOfError: string;
  ticketName?: string;
  steps: StepItem[];
}
