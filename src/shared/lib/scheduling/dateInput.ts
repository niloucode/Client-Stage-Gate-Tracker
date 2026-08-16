/**
 * Shared date <-> `datetime-local` input serialization adapter.
 *
 * THE only place in the app allowed to do timezone-offset math for form
 * inputs. Forms must convert `Date` values through these helpers — never
 * inline `getTimezoneOffset()` + `toISOString().slice(0, 16)` expressions.
 *
 * `datetime-local` inputs interpret their value as LOCAL time; the
 * helpers below shift the `Date` into its local-time representation so
 * round trips are stable regardless of the user's timezone.
 * @param date - The Date to serialize (null/undefined → empty string).
 * @returns The `datetime-local` input value in local time, or "".
 */
export function toDateTimeLocalInput(date: Date | null | undefined): string {
	if (!date) return "";
	if (Number.isNaN(date.getTime())) return "";
	return new Date(date.getTime() - date.getTimezoneOffset() * 60000)
		.toISOString()
		.slice(0, 16);
}

/**
 * Parses a `datetime-local` input value (local time) back into a Date.
 * @param value - The input value to parse (empty → null).
 * @returns The parsed Date, or null for empty/invalid input.
 */
export function fromDateTimeLocalInput(value: string): Date | null {
	if (!value) return null;
	const date = new Date(value);
	return Number.isNaN(date.getTime()) ? null : date;
}
