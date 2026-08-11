import { describe, it, expect } from "vitest";
import { z } from "zod";
import { getFieldErrors } from "./zod";

const schema = z.object({
	name: z.string().min(3, "Name must be at least 3 characters"),
	email: z.email({ message: "Invalid email" }),
	age: z.number().min(18, "Must be 18 or older").optional(),
});

describe("getFieldErrors", () => {
	it("returns an empty map for a successful parse", () => {
		const result = schema.safeParse({ name: "Alice", email: "a@b.co" });
		expect(getFieldErrors(result)).toEqual({});
	});

	it("maps each failing field to its first message", () => {
		const result = schema.safeParse({ name: "Ab", email: "nope" });
		expect(getFieldErrors(result)).toEqual({
			name: "Name must be at least 3 characters",
			email: "Invalid email",
		});
	});

	it("ignores fields that passed validation", () => {
		const result = schema.safeParse({ name: "Bob", email: "bad" });
		expect(getFieldErrors(result)).toEqual({ email: "Invalid email" });
	});
});
