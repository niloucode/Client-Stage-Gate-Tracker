import type { SchedulingDates } from "./scheduling";

/**
 * Chronology helpers for the canonical scheduling vocabulary.
 * All server actions and rollup utilities use these instead of ad-hoc
 * date comparisons so the planStart ≤ planEnd / actualStart ≤ actualEnd
 * invariant lives in exactly one place.
 */

/** True when both planned dates are set and planStart ≤ planEnd. */
export function hasValidPlannedRange(d: SchedulingDates): boolean {
	if (!d.planStart || !d.planEnd) return true;
	return d.planStart.getTime() <= d.planEnd.getTime();
}

/** True when both actual dates are set and actualStart ≤ actualEnd. */
export function hasValidActualRange(d: SchedulingDates): boolean {
	if (!d.actualStart || !d.actualEnd) return true;
	return d.actualStart.getTime() <= d.actualEnd.getTime();
}

/** True when the whole scheduling block is chronologically valid. */
export function isChronologyValid(d: SchedulingDates): boolean {
	return hasValidPlannedRange(d) && hasValidActualRange(d);
}

/** Earliest non-null date of the four, or null when none is set. */
export function earliestDate(d: SchedulingDates): Date | null {
	const candidates = [d.planStart, d.planEnd, d.actualStart, d.actualEnd].filter(
		(v): v is Date => v !== null,
	);
	if (candidates.length === 0) return null;
	return new Date(Math.min(...candidates.map((c) => c.getTime())));
}

/** Latest non-null date of the four, or null when none is set. */
export function latestDate(d: SchedulingDates): Date | null {
	const candidates = [d.planStart, d.planEnd, d.actualStart, d.actualEnd].filter(
		(v): v is Date => v !== null,
	);
	if (candidates.length === 0) return null;
	return new Date(Math.max(...candidates.map((c) => c.getTime())));
}
