import { describe, expect, it } from "vitest";
import { generateInviteCode, hashInviteCode } from "./inviteCode";

describe("client invite code utilities", () => {
	it("generates 12-char codes from the unambiguous alphabet", () => {
		const code = generateInviteCode();
		expect(code).toMatch(/^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{12}$/);
	});

	it("generates distinct codes", () => {
		const codes = new Set(Array.from({ length: 100 }, generateInviteCode));
		expect(codes.size).toBe(100);
	});

	it("hashes deterministically for the same code", () => {
		expect(hashInviteCode("K7Q2M9XW")).toBe(hashInviteCode("K7Q2M9XW"));
	});

	it("compares case-insensitively and trims whitespace", () => {
		expect(hashInviteCode("k7q2m9xw")).toBe(hashInviteCode("  K7Q2M9XW  "));
	});

	it("produces a 64-char hex digest", () => {
		expect(hashInviteCode("K7Q2M9XW")).toMatch(/^[a-f0-9]{64}$/);
	});
});
