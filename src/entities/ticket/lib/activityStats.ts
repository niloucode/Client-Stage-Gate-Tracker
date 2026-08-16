/**
 * Landing-dashboard activity stats (Weekly Velocity / Risk Factor / Upcoming
 * Deadlines). Pure date + ratio math — no DB, no "use server" directive.
 *
 * Week definition (product decision 2026-08-14): calendar week, Monday
 * 00:00 → Sunday 23:59, in the server's local timezone.
 */

/** Monday 00:00 of the week containing `now` (local time). 
 * @param now - The reference instant.
 * @returns The week start.
 */
export function currentWeekStart(now: Date): Date {
	const d = new Date(now);
	const daysSinceMonday = (d.getDay() + 6) % 7;
	d.setDate(d.getDate() - daysSinceMonday);
	d.setHours(0, 0, 0, 0);
	return d;
}

/** Monday 00:00 of the week before the week containing `now`. 
 * @param now - The reference instant.
 * @returns The previous week start.
 */
export function previousWeekStart(now: Date): Date {
	const d = currentWeekStart(now);
	d.setDate(d.getDate() - 7);
	return d;
}

/** Monday 00:00 of the week after the week containing `now`. 
 * @param now - The reference instant.
 * @returns The next week start.
 */
export function nextWeekStart(now: Date): Date {
	const d = currentWeekStart(now);
	d.setDate(d.getDate() + 7);
	return d;
}

/** Monday-aligned weekday index (0 = Monday … 6 = Sunday) for a date. 
 * @param d - The date to index.
 * @returns The weekday index.
 */
export function weekdayIndex(d: Date): number {
	return (d.getDay() + 6) % 7;
}

/** Start of today (00:00:00.000, local). 
 * @param now - The reference instant.
 * @returns Today's start.
 */
export function startOfToday(now: Date): Date {
	const d = new Date(now);
	d.setHours(0, 0, 0, 0);
	return d;
}

/** End of today (23:59:59.999, local). 
 * @param now - The reference instant.
 * @returns Today's end.
 */
export function endOfToday(now: Date): Date {
	const d = new Date(now);
	d.setHours(23, 59, 59, 999);
	return d;
}

/**
 * Risk factor from the overdue ratio (product decision 2026-08-14,
 * ratio-based): 0 overdue → Low; ratio < 50% → Medium; ratio ≥ 50% → High.
 * `active` = the user's unfinished tickets; no active tickets → Low.
  * @param overdue
  * @param active
  * @returns The risk label.
*/
export function riskLabel(overdue: number, active: number): string {
	if (active <= 0 || overdue <= 0) return "Low";
	const ratio = overdue / active;
	if (ratio >= 0.5) return "High";
	return "Medium";
}

/**
 * Weekly velocity change vs the previous week. A zero-completion previous
 * week yields "—" (no meaningful percentage) instead of dividing by zero.
  * @param thisWeek
  * @param lastWeek
  * @returns The week-over-week change.
*/
export function velocityChange(
	thisWeek: number,
	lastWeek: number,
): { change: string; changePositive: boolean } {
	if (lastWeek <= 0) {
		return { change: "—", changePositive: thisWeek > 0 };
	}
	const pct = Math.round(((thisWeek - lastWeek) / lastWeek) * 100);
	return {
		change: `${pct >= 0 ? "+" : ""}${pct}%`,
		changePositive: pct >= 0,
	};
}

/**
 * Upcoming-deadlines badge. "Today" when at least one unfinished ticket is
 * due today specifically; otherwise a neutral label.
  * @param count
  * @param dueToday
  * @returns The summary counts.
*/
export function upcomingSummary(
	count: number,
	dueToday: boolean,
): { urgencyLabel: string; isUrgent: boolean } {
	if (dueToday) return { urgencyLabel: "Today", isUrgent: true };
	if (count > 0) return { urgencyLabel: "Due soon", isUrgent: false };
	return { urgencyLabel: "All clear", isUrgent: false };
}
