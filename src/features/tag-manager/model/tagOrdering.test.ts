import { describe, expect, it } from "vitest";
import { matchesTagSearch, sortTagsForDisplay } from "./tagOrdering";
import type { Tag } from "@/entities/types";

function makeTag(overrides: Partial<Tag> = {}): Tag {
	return {
		tag_id: "11111111-1111-1111-1111-111111111111",
		name: "API",
		description: null,
		color: null,
		is_deleted: false,
		deleted_at: null,
		is_protected: false,
		...overrides,
	};
}

describe("sortTagsForDisplay", () => {
	it("puts protected tags first, alphabetical within groups", () => {
		const tags = [
			makeTag({ tag_id: "a", name: "Zeta", is_protected: false }),
			makeTag({ tag_id: "b", name: "Bugs", is_protected: true }),
			makeTag({ tag_id: "c", name: "API", is_protected: true }),
			makeTag({ tag_id: "d", name: "Alpha", is_protected: false }),
		];
		const sorted = sortTagsForDisplay(tags);
		expect(sorted.map((t) => t.name)).toEqual(["API", "Bugs", "Alpha", "Zeta"]);
	});

	it("is case-insensitive within groups", () => {
		const tags = [
			makeTag({ tag_id: "a", name: "beta", is_protected: true }),
			makeTag({ tag_id: "b", name: "Alpha", is_protected: true }),
		];
		expect(sortTagsForDisplay(tags).map((t) => t.name)).toEqual([
			"Alpha",
			"beta",
		]);
	});

	it("does not mutate the input array", () => {
		const tags = [
			makeTag({ tag_id: "b", name: "B" }),
			makeTag({ tag_id: "a", name: "A" }),
		];
		sortTagsForDisplay(tags);
		expect(tags[0].name).toBe("B");
	});
});

describe("matchesTagSearch", () => {
	it("matches name case-insensitively", () => {
		expect(matchesTagSearch(makeTag({ name: "Frontend" }), "front")).toBe(true);
	});

	it("matches description", () => {
		expect(
			matchesTagSearch(makeTag({ description: "Portal UI work" }), "portal"),
		).toBe(true);
	});

	it("matches everything on an empty query", () => {
		expect(matchesTagSearch(makeTag({ name: "Anything" }), "")).toBe(true);
	});

	it("returns false when nothing matches", () => {
		expect(matchesTagSearch(makeTag({ name: "API" }), "stripe")).toBe(false);
	});
});
