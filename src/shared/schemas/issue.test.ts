import { describe, expect, it } from "vitest";
import { issueCreateSchema } from "./issue";

const validPayload = {
	name: "Authentication Token Expiration Bug",
	type: "not_saving",
	specificType: "",
	urgency: "high",
	description: "Session terminates unexpectedly when the user submits dynamic form data.",
	systemEnv: "Chrome v126 / macOS Sonoma",
	timeOfError: new Date("2026-08-02T14:28:00Z"),
	steps: [
		{ description: "Navigate to the dashboard." },
		{ description: "Click Save repeatedly.", image: "https://cdn.example.com/step.png" },
	],
};

describe("issueCreateSchema", () => {
	it("accepts a valid full payload", () => {
		const result = issueCreateSchema.safeParse(validPayload);
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.name).toBe(validPayload.name);
			expect(result.data.type).toBe("not_saving");
			expect(result.data.urgency).toBe("high");
			expect(result.data.steps).toHaveLength(2);
		}
	});

	it("rejects an empty name", () => {
		const result = issueCreateSchema.safeParse({ ...validPayload, name: "   " });
		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.error.issues.some((i) => i.path.includes("name"))).toBe(true);
		}
	});

	it("rejects a name longer than 60 characters", () => {
		const result = issueCreateSchema.safeParse({
			...validPayload,
			name: "x".repeat(61),
		});
		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.error.issues.some((i) => i.path.includes("name"))).toBe(true);
		}
	});

	it("rejects a missing issue type", () => {
		const result = issueCreateSchema.safeParse({
			...validPayload,
			type: undefined,
		});
		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.error.issues.some((i) => i.path.includes("type"))).toBe(true);
		}
	});

	it("rejects an invalid urgency value", () => {
		const result = issueCreateSchema.safeParse({
			...validPayload,
			urgency: "critical",
		});
		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.error.issues.some((i) => i.path.includes("urgency"))).toBe(true);
		}
	});

	it("rejects type 'other' without a specific type", () => {
		const result = issueCreateSchema.safeParse({
			...validPayload,
			type: "other",
			specificType: "   ",
		});
		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.error.issues.some((i) => i.path.includes("specificType"))).toBe(true);
		}
	});

	it("accepts type 'other' with a specific type", () => {
		const result = issueCreateSchema.safeParse({
			...validPayload,
			type: "other",
			specificType: "UI Bug",
		});
		expect(result.success).toBe(true);
	});

	it("accepts an empty steps array and empty step descriptions (filtered at action level)", () => {
		const result = issueCreateSchema.safeParse({
			...validPayload,
			steps: [],
		});
		expect(result.success).toBe(true);
		const withEmpty = issueCreateSchema.safeParse({
			...validPayload,
			steps: [{ description: "" }],
		});
		expect(withEmpty.success).toBe(true);
	});

	it("accepts a null timeOfError", () => {
		const result = issueCreateSchema.safeParse({
			...validPayload,
			timeOfError: null,
		});
		expect(result.success).toBe(true);
	});

	it("defaults omitted optional fields", () => {
		const result = issueCreateSchema.safeParse({
			name: "Broken Footer Link",
			type: "deadlinks",
			urgency: "medium",
		});
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.specificType).toBe("");
			expect(result.data.description).toBe("");
			expect(result.data.systemEnv).toBe("");
			expect(result.data.timeOfError).toBeNull();
			expect(result.data.steps).toEqual([]);
		}
	});
});
