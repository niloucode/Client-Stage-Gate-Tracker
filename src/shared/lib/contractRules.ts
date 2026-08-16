/**
 * Auto-derived signature initials for contract approvals (2026-08-15 spec):
 * the signer's profile name is recorded server-side, so the initials are
 * derived from the first and last word of the full name (uppercased).
 
 * @param fullName - The signer's full name.
 * @returns Uppercase first+last word initials ("" for empty input).
 */
export function deriveInitials(fullName: string): string {
	const parts = fullName.trim().split(/\s+/).filter(Boolean);
	if (parts.length === 0) return "";
	const first = parts[0][0]?.toUpperCase() ?? "";
	const last =
		parts.length > 1 ? (parts[parts.length - 1][0]?.toUpperCase() ?? "") : "";
	return `${first}${last}`;
}
