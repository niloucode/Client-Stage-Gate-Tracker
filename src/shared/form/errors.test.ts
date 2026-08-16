import { describe, expect, it } from "vitest";
import { formErrorToMessage } from "./errors";

/**
 * Unit tests for the TanStack Form error normalizer (Task 1.10).
 * Covers every branch: falsy input, plain strings, Zod issue objects,
 * issue arrays, `GlobalFormValidationError` (`form` key), `Error`
 * instances, and fallback stringification.
 */

describe("formErrorToMessage", () => {
	it("returns null for falsy input", () => {
		expect(formErrorToMessage(null)).toBeNull();
		expect(formErrorToMessage(undefined)).toBeNull();
		expect(formErrorToMessage("")).toBeNull();
		expect(formErrorToMessage(0)).toBeNull();
		expect(formErrorToMessage(false)).toBeNull();
	});

	it("passes plain strings through", () => {
		expect(formErrorToMessage("Name is required")).toBe("Name is required");
	});

	it("extracts the message from a Zod-style issue object", () => {
		expect(
			formErrorToMessage({ message: "Must be at least 3 characters" }),
		).toBe("Must be at least 3 characters");
		expect(formErrorToMessage({ message: undefined })).toBeNull();
	});

	it("extracts the first message from an issue array", () => {
		expect(
			formErrorToMessage([
				{ message: "First error" },
				{ message: "Second error" },
			]),
		).toBe("First error");
	});

	it("returns null for an array without a message-bearing first element", () => {
		expect(formErrorToMessage(["plain string in array"])).toBeNull();
		expect(formErrorToMessage([42])).toBeNull();
	});

	it("handles GlobalFormValidationError ({ form: ... }) shapes", () => {
		expect(formErrorToMessage({ form: "Form-level message" })).toBe(
			"Form-level message",
		);
		expect(formErrorToMessage({ form: { message: "Nested message" } })).toBe(
			"Nested message",
		);
		expect(formErrorToMessage({ form: { message: undefined } })).toBeNull();
		expect(formErrorToMessage({ form: 42 })).toBeNull();
	});

	it("extracts message from Error instances", () => {
		expect(formErrorToMessage(new Error("Something exploded"))).toBe(
			"Something exploded",
		);
	});

	it("falls back to stringification for unexpected values", () => {
		expect(formErrorToMessage(42)).toBe("42");
		expect(formErrorToMessage(true)).toBe("true");
	});
});
