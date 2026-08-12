import { describe, it, expect } from "vitest";
import { getInitials } from "./strings";

describe("getInitials", () => {
	it("collapses whitespace and uppercases two names", () => {
		expect(getInitials(" john   doe ")).toBe("JD");
	});

	it("returns a single initial for one name", () => {
		expect(getInitials("Alice")).toBe("A");
	});

	it("returns at most two initials for long names", () => {
		expect(getInitials("John Ronald Reuel Tolkien")).toBe("JR");
	});

	it("handles lowercase input", () => {
		expect(getInitials("grace hopper")).toBe("GH");
	});

	it("falls back to a placeholder for empty/whitespace input", () => {
		expect(getInitials("")).toBe("?");
		expect(getInitials("   ")).toBe("?");
	});
});
