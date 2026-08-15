import { describe, expect, it } from "vitest";
import { deriveInitials } from "./contractRules";

describe("deriveInitials (contract approval auto-signature)", () => {
	it("combines the first and last name initials, uppercased", () => {
		expect(deriveInitials("John Smith")).toBe("JS");
	});

	it("handles lowercase input", () => {
		expect(deriveInitials("john smith")).toBe("JS");
	});

	it("ignores middle names (first + last only)", () => {
		expect(deriveInitials("John Lorens Tee")).toBe("JT");
	});

	it("trims surrounding whitespace", () => {
		expect(deriveInitials("  spaced   name  ")).toBe("SN");
	});

	it("returns a single initial for one-word names", () => {
		expect(deriveInitials("Single")).toBe("S");
	});

	it("returns an empty string for empty input", () => {
		expect(deriveInitials("")).toBe("");
		expect(deriveInitials("   ")).toBe("");
	});
});
