/**
 * Generates up to two uppercase initials from a full name string.
 * Handles leading, trailing, and multiple consecutive spaces gracefully.
 * Empty/whitespace-only input falls back to a neutral placeholder.
 *
 * @example getInitials(" john   doe ") // "JD"
 * @example getInitials("Alice")        // "A"
 * @example getInitials("   ")          // "?"
 * @param name - The full name to derive initials from.
 * @returns Up to two uppercase initials, or "?" for empty input.
 */
export function getInitials(name: string): string {
	const initials = name
		.trim()
		.split(/\s+/)
		.map((word) => word[0])
		.slice(0, 2)
		.join("")
		.toUpperCase();
	return initials || "?";
}
