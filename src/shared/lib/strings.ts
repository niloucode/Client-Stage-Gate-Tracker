/**
 * Generates up to two uppercase initials from a full name string.
 * Handles leading, trailing, and multiple consecutive spaces gracefully.
 * Empty/whitespace-only input falls back to a neutral placeholder.
 *
 * @example getInitials(" john   doe ") // "JD"
 * @example getInitials("Alice")        // "A"
 * @example getInitials("   ")          // "?"
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
