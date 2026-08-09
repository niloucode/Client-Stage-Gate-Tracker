import type { SchedulingDates } from "./scheduling";
import { earliestDate, latestDate } from "./chronology";

/**
 * Rollup utilities for the canonical scheduling vocabulary.
 * Child entities' start/end boundaries are derived from these (the
 * ticket-driven rollup engine in Section 3 builds on top of them).
 */

/** The block's overall start: earliest of the four dates, or null. */
export function rollupStart(d: SchedulingDates): Date | null {
	return earliestDate(d);
}

/** The block's overall end: latest of the four dates, or null. */
export function rollupEnd(d: SchedulingDates): Date | null {
	return latestDate(d);
}

/**
 * Parent boundary from children: start = earliest child start,
 * end = latest child end. Returns nulls when no child contributes dates.
 */
export function rollupChildrenDates(
	children: SchedulingDates[],
): { start: Date | null; end: Date | null } {
	const starts = children
		.map((c) => rollupStart(c))
		.filter((v): v is Date => v !== null);
	const ends = children
		.map((c) => rollupEnd(c))
		.filter((v): v is Date => v !== null);

	return {
		start: starts.reduce<Date | null>(
			(acc, d) => (acc === null || d < acc ? d : acc),
			null,
		),
		end: ends.reduce<Date | null>(
			(acc, d) => (acc === null || d > acc ? d : acc),
			null,
		),
	};
}
