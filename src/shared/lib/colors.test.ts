import { describe, it, expect } from "vitest";
import { getPastelStyle, TAG_COLORS } from "./colors";

describe("getPastelStyle", () => {
	it("produces rgba backgrounds for valid 6-digit hexes", () => {
		const style = getPastelStyle("#EF4444");
		expect(style.bg).toBe("rgba(239, 68, 68, 0.12)");
		expect(style.border).toBe("rgba(239, 68, 68, 0.25)");
		expect(style.text).toBe("#EF4444");
	});

	it("normalizes a hex without the leading hash", () => {
		const style = getPastelStyle("22c55e");
		expect(style.text).toBe("#22C55E");
	});

	it("expands 3-digit shorthand", () => {
		const style = getPastelStyle("#abc");
		expect(style.text).toBe("#AABBCC");
		expect(style.bg).toBe("rgba(170, 187, 204, 0.12)");
	});

	it("falls back to a neutral color for malformed input (no NaN)", () => {
		for (const bad of ["", "red", "#12345", "#GGGGGG"]) {
			const style = getPastelStyle(bad);
			expect(style.bg).not.toContain("NaN");
			expect(style.bg).toBe("rgba(148, 163, 184, 0.12)");
		}
	});

	it("handles every TAG_COLORS entry", () => {
		for (const color of TAG_COLORS) {
			const style = getPastelStyle(color);
			expect(style.bg).not.toContain("NaN");
		}
	});
});
