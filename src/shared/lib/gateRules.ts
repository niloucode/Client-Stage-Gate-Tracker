import type { CommentParentType } from "@/lib/generated/prisma";
import { ImageParentType } from "@/lib/generated/prisma";

/**
 * Next gate number (gate-overview spec 2/9): later gates have larger numbers,
 * so a new gate takes max(existing) + 1 (1 when the stage has no gates).
 */
export function deriveNextGateNumber(numbers: (number | null)[]): number {
	const max = numbers.reduce<number>(
		(acc, n) => (n !== null && n > acc ? n : acc),
		0,
	);
	return max + 1;
}

/**
 * The ImageParentType for a comment's attachments follows the comment's
 * parent type (fixes the TICKET_COMMENT hardcodes in the comment slice —
 * gate feedback/discussion images must be stored and loaded as GATE_COMMENT).
 */
export function imageParentTypeFor(
	parentType: CommentParentType,
): ImageParentType {
	return parentType === "GATE_COMMENT"
		? ImageParentType.GATE_COMMENT
		: ImageParentType.TICKET_COMMENT;
}

/**
 * Approval gating (2026-08-15 spec): a stage gate may be decided only when
 * every phase under the stage is finished. Phases finish via the ticket
 * rollup (actual_end_at set only when all their workflows are finished).
 * A stage with no phases is vacuously decidable (createStage always ships
 * gate #1, and an empty stage has nothing unfinished).
 */
export function allPhasesFinished(
	phases: { actual_end_at: Date | null }[],
): boolean {
	return phases.every((p) => p.actual_end_at !== null);
}
