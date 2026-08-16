import type { Tag } from "@/entities/types";

/** Protected (system) tags first; alphabetical within each group. 
 * @param tags - The tags to sort (not mutated).
 * @returns A sorted copy.
 */
export function sortTagsForDisplay(tags: Tag[]): Tag[] {
	return [...tags].sort((a, b) => {
		if (a.is_protected !== b.is_protected) return a.is_protected ? -1 : 1;
		return a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
	});
}

/** Case-insensitive name/description search. 
 * @param tag - The tag to test.
 * @param query - The search text (empty matches everything).
 * @returns True when the tag matches.
 */
export function matchesTagSearch(tag: Tag, query: string): boolean {
	const q = query.toLowerCase().trim();
	if (!q) return true;
	return (
		tag.name.toLowerCase().includes(q) ||
		(tag.description ?? "").toLowerCase().includes(q)
	);
}
