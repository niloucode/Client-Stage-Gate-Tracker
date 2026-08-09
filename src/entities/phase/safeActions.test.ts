import { describe, expect, it } from "vitest";
import { ActionError, ACTION_ERROR_CODES } from "@/lib/safe-action";
import { throwIfActionFailed } from "./mutations";

/**
 * These tests exercise the discriminated-union → thrown-error adapter that
 * connects next-safe-action results to TanStack Query mutation error
 * machinery (Task 1.7). `throwIfActionFailed` is exported for testing.
 */

describe("throwIfActionFailed", () => {
	it("returns data on success", () => {
		expect(throwIfActionFailed({ data: { id: "p1" } })).toEqual({ id: "p1" });
	});

	it("throws a stable error code string on serverError", () => {
		expect(() =>
			throwIfActionFailed({ serverError: ACTION_ERROR_CODES.FORBIDDEN }),
		).toThrow(ACTION_ERROR_CODES.FORBIDDEN);
	});

	it("throws a generic message on validationErrors", () => {
		expect(() =>
			throwIfActionFailed({ validationErrors: { name: ["Required"] } }),
		).toThrow("Please fix the highlighted fields.");
	});

	it("throws a fallback when the result is empty", () => {
		expect(() => throwIfActionFailed({})).toThrow("Server action failed.");
	});
});

describe("ActionError", () => {
	it("carries a stable code", () => {
		const err = new ActionError(ACTION_ERROR_CODES.NOT_FOUND, "Missing.");
		expect(err.code).toBe(ACTION_ERROR_CODES.NOT_FOUND);
		expect(err.message).toBe("Missing.");
	});
});
