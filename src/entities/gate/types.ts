// Gate domain types (2026-08-15 gate-overview integration).
// Server shape produced by getStageGates — the feature formats initials/UI.

export type GateStatusValue = "PENDING" | "APPROVED" | "REJECTED";

export interface GateFeedbackEntry {
	gateId: string;
	number: number;
	status: GateStatusValue;
	/** Feedback comment date (formatted) — null while the gate is undecided. */
	date: string | null;
	reviewer: { name: string } | null;
	feedback: string | null;
	/** Decision derived from status; null while pending. */
	variant: "approved" | "rejected" | null;
	/** Feedback attachment URLs (GATE_COMMENT images on the feedback comment). */
	images: string[];
	/** "Further comments" (discussion) count on the gate. */
	commentCount: number;
}
