import { describe, expect, it } from "vitest";
import { reorderBySortKey, type SortableSibling } from "./fractionalSort";

/**
 * Shared fractional-indexing reorder core (Task 3.4): single implementation
 * of the move-to-position algorithm used by phase/workflow reordering.
 */

function keyed(ids: string[]): SortableSibling[] {
	// Deterministic fractional keys in ascending order (a0 < a1 < ... < a9).
	return ids.map((id, i) => ({ id, sort_key: `a${i}` }));
}

/** Code-unit sort — matches the fractional-indexing ordering contract. */
function orderedKeys(siblings: SortableSibling[]): (string | null)[] {
	return siblings
		.slice()
		.sort((x, y) => ((x.sort_key ?? "") < (y.sort_key ?? "") ? -1 : 1))
		.map((s) => s.id);
}

/** Code-unit comparison — matches the fractional-indexing contract. */
function lessThan(a: string | null | undefined, b: string): boolean {
	return (a ?? "") < b;
}

describe("reorderBySortKey", () => {
	it("returns an error for an unknown row", () => {
		const result = reorderBySortKey(keyed(["a", "b", "c"]), "zzz", 1);
		expect(result.success).toBe(false);
		expect(result.error).toContain("not found");
	});

	it("returns an error for an out-of-bounds target", () => {
		const result = reorderBySortKey(keyed(["a", "b", "c"]), "a", 5);
		expect(result.success).toBe(false);
		expect(result.error).toContain("out of bounds");
	});

	it("no-ops when the row is already at the target", () => {
		const result = reorderBySortKey(keyed(["a", "b", "c"]), "b", 2);
		expect(result.success).toBe(true);
		expect(result.newKey).toBeUndefined();
	});

	it("produces a key between the neighbors when moving to the front", () => {
		const siblings = keyed(["a", "b", "c"]);
		const result = reorderBySortKey(siblings, "c", 1);
		expect(result.success).toBe(true);
		expect(result.newKey).toBeDefined();
		// c's new key must sort before a0 (code-unit comparison).
		expect(lessThan(result.newKey, "a0")).toBe(true);
	});

	it("produces a key between the neighbors when moving to the end", () => {
		const siblings = keyed(["a", "b", "c"]);
		const result = reorderBySortKey(siblings, "a", 3);
		expect(result.success).toBe(true);
		expect(result.newKey).toBeDefined();
		// a's new key must sort after a2 (c's key).
		expect((result.newKey ?? "").localeCompare("a2")).toBeGreaterThan(0);
	});

	it("repeated moves keep a consistent total order", () => {
		// Real callers fetch siblings `orderBy: sort_key asc`, so keep the
		// test array sorted after each move.
		let siblings = keyed(["a", "b", "c", "d"]);

		// Move d to position 1: [d, a, b, c]
		let r = reorderBySortKey(siblings, "d", 1);
		expect(r.success).toBe(true);
		siblings = siblings
			.map((s) => (s.id === "d" ? { ...s, sort_key: r.newKey! } : s))
			.sort((x, y) => ((x.sort_key ?? "") < (y.sort_key ?? "") ? -1 : 1));

		// Move a to position 3: [d, b, a, c]
		r = reorderBySortKey(siblings, "a", 3);
		expect(r.success).toBe(true);
		siblings = siblings
			.map((s) => (s.id === "a" ? { ...s, sort_key: r.newKey! } : s))
			.sort((x, y) => ((x.sort_key ?? "") < (y.sort_key ?? "") ? -1 : 1));

		expect(orderedKeys(siblings)).toEqual(["d", "b", "a", "c"]);
	});
});
