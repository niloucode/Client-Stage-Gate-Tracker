import { describe, expect, it } from "vitest";
import { variableCreateSchema } from "./variable";

const validPayload = {
	name: "Staging Preview URL",
	type: "link",
	value: "https://staging-preview.example.dev/v2",
	notesTeam: "Auto-deployed on merge to develop.",
	notesClient: "Use this live URL for gate review approvals.",
};

describe("variableCreateSchema", () => {
	it("accepts a valid full payload", () => {
		const result = variableCreateSchema.safeParse(validPayload);
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.name).toBe("Staging Preview URL");
			expect(result.data.type).toBe("link");
			expect(result.data.notesTeam).toBe("Auto-deployed on merge to develop.");
		}
	});

	it("accepts all three variable types", () => {
		for (const type of ["link", "credential", "repository"] as const) {
			expect(variableCreateSchema.safeParse({ ...validPayload, type }).success).toBe(true);
		}
	});

	it("defaults missing notes to empty strings", () => {
		const result = variableCreateSchema.safeParse({
			name: "DB URI",
			type: "credential",
			value: "postgresql://u:p@host:5432/db",
		});
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.notesTeam).toBe("");
			expect(result.data.notesClient).toBe("");
		}
	});

	it("trims whitespace from name and value", () => {
		const result = variableCreateSchema.safeParse({
			...validPayload,
			name: "  Staging URL  ",
			value: "  https://example.dev  ",
		});
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.name).toBe("Staging URL");
			expect(result.data.value).toBe("https://example.dev");
		}
	});

	it("rejects an empty name", () => {
		const result = variableCreateSchema.safeParse({ ...validPayload, name: "   " });
		expect(result.success).toBe(false);
	});

	it("rejects a name longer than 20 characters", () => {
		const result = variableCreateSchema.safeParse({
			...validPayload,
			name: "This name is way too long for the limit",
		});
		expect(result.success).toBe(false);
	});

	it("rejects an empty value", () => {
		const result = variableCreateSchema.safeParse({ ...validPayload, value: "" });
		expect(result.success).toBe(false);
	});

	it("rejects a value longer than 4096 characters", () => {
		const result = variableCreateSchema.safeParse({
			...validPayload,
			value: "x".repeat(4097),
		});
		expect(result.success).toBe(false);
	});

	it("rejects an unknown type", () => {
		const result = variableCreateSchema.safeParse({ ...validPayload, type: "api_key" });
		expect(result.success).toBe(false);
	});

	it("rejects notes longer than 2000 characters", () => {
		const result = variableCreateSchema.safeParse({
			...validPayload,
			notesTeam: "x".repeat(2001),
		});
		expect(result.success).toBe(false);
	});
});
