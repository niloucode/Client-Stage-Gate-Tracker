/**
 * Stage actual-date rules (specs 1-3 of the project-structure feature).
 *
 * 1. The first stage's actual start is the date the contract is signed by
 *    BOTH project owner and client — the LATER of the two signature dates
 *    when they differ.
 * 2. A stage's actual end is the date its gate gets approved.
 * 3. The following stage's actual start is the previous stage's actual end.
 *
 * Values are materialized into Stages.actual_*_at by the writing actions
 * (approveContract for rule 1, 2026-08-15; gateApprovalDates / decideGate
 * for rules 2-3).
 */

/**
 * Spec 1: effective contract signing date. Returns null until BOTH parties
 * have signed; otherwise the later of the two signature timestamps.
 */
export function contractSignedStart(
	ownerSignedAt: Date | null,
	clientSignedAt: Date | null,
): Date | null {
	if (!ownerSignedAt || !clientSignedAt) return null;
	return ownerSignedAt > clientSignedAt ? ownerSignedAt : clientSignedAt;
}

/**
 * Specs 2-3: the dates to materialize when a stage's gate is approved.
 * The stage's actual end is the approval timestamp; the NEXT stage (if any)
 * starts on the same day.
 *
 * Wired into `decideGate` (src/entities/gate/gateActions.ts, 2026-08-15):
 * the approval is status-based (Gates.status = APPROVED + a feedback comment)
 * — the old GateSignatures row model was dropped.
 */
export function gateApprovalDates(
	approvedAt: Date,
	hasNextStage: boolean,
): { actualEnd: Date; nextStageStart: Date | null } {
	return {
		actualEnd: approvedAt,
		nextStageStart: hasNextStage ? approvedAt : null,
	};
}
