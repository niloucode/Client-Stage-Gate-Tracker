import { describe, expect, it } from "vitest";
import { tagCreateSchema } from "./tag";

const validPayload = {
	name: "Frontend",
	description: "Portal UI work",
	color: "#6366F1",
};

describe("tagCreateSchema", () => {
	it("accepts a valid payload", () => {
		expect(tagCreateSchema.safeParse(validPayload).success).toBe(true);
	});

	it("rejects an empty name", () => {
		const result = tagCreateSchema.safeParse({ ...validPayload, name: "  " });
		expect(result.success).toBe(false);
	});

	it("rejects a name longer than 12 characters", () => {
		const result = tagCreateSchema.safeParse({
			...validPayload,
			name: "This name is way too long",
		});
		expect(result.success).toBe(false);
	});

	it("accepts an explicit tag_id (edit path)", () => {
		const result = tagCreateSchema.safeParse({
			...validPayload,
			tag_id: "11111111-1111-1111-1111-111111111111",
		});
		expect(result.success).toBe(true);
	});
});
