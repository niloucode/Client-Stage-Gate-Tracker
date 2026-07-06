/**
 * Generates up to two uppercase initials from a full name string.
 * Handles leading, trailing, and multiple consecutive spaces gracefully.
 *
 * @example getInitials(" john   doe ") // "JD"
 * @example getInitials("Alice")        // "A"
 */
export function getInitials(name: string): string {
    return name
        .trim()
        .split(/\s+/)
        .map((word) => word[0])
        .slice(0, 2)
        .join("")
        .toUpperCase();
}
