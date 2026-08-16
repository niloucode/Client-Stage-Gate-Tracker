import type { status } from "@/lib/generated/prisma";

export interface ActualDatesPatch {
	actual_start_at?: Date | null;
	actual_end_at?: Date | null;
}

/**
 * 2026-08-15 spec — actual dates are derived from status transitions:
 * - PENDING  -> IN_PROGRESS: actual_start_at = now
 * - PENDING  -> FINISHED:    actual_start_at = actual_end_at = now (same ts)
 * - IN_PROGRESS -> FINISHED: actual_end_at = now (start kept)
 * - FINISHED -> IN_PROGRESS: actual_end_at = null (start kept)
 * - FINISHED -> PENDING:     both reverted to null
 * - IN_PROGRESS -> PENDING:  actual_start_at = null
 * - same status: no patch (server values preserved)
  * @param oldStatus
  * @param newStatus
  * @param now
  * @returns The actual-date patch.
*/
export function computeActualDates(
	oldStatus: status,
	newStatus: status,
	now: Date,
): ActualDatesPatch {
	if (oldStatus === newStatus) return {};
	switch (oldStatus) {
		case "PENDING":
			if (newStatus === "IN_PROGRESS") return { actual_start_at: now };
			if (newStatus === "FINISHED")
				return { actual_start_at: now, actual_end_at: now };
			return {};
		case "IN_PROGRESS":
			if (newStatus === "FINISHED") return { actual_end_at: now };
			if (newStatus === "PENDING") return { actual_start_at: null };
			return {};
		case "FINISHED":
			if (newStatus === "IN_PROGRESS") return { actual_end_at: null };
			if (newStatus === "PENDING")
				return { actual_start_at: null, actual_end_at: null };
			return {};
	}
}
