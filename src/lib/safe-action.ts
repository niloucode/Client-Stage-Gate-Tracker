import { createSafeActionClient } from "next-safe-action";
import { getCurrentUserId } from "@/lib/auth/projectAccess";

/**
 * Stable, machine-readable error codes for the typed server-action
 * pipeline (Task 1.7). Every server error reaching the client is one of
 * these — never a raw exception or stack trace.
 */
export const ACTION_ERROR_CODES = {
	UNAUTHORIZED: "UNAUTHORIZED",
	FORBIDDEN: "FORBIDDEN",
	NOT_FOUND: "NOT_FOUND",
	VALIDATION: "VALIDATION",
	CONFLICT: "CONFLICT",
	INTERNAL: "INTERNAL",
} as const;

export type ActionErrorCode =
	(typeof ACTION_ERROR_CODES)[keyof typeof ACTION_ERROR_CODES];

/** Error with a stable code; `handleServerError` maps it to the code. */
export class ActionError extends Error {
	readonly code: ActionErrorCode;

	constructor(
		code: ActionErrorCode,
		message: string,
		options?: { cause?: unknown },
	) {
		super(message, options);
		this.name = "ActionError";
		this.code = code;
	}
}

/**
 * Base safe-action client. `handleServerError` guarantees the client only
 * ever receives a stable error code (plus the code for ActionError) — no
 * raw exception text, no internal details.
 */
export const actionClient = createSafeActionClient({
	handleServerError: (error) => {
		if (error instanceof ActionError) {
			return error.code;
		}
		console.error("Unhandled server action error:", error);
		return ACTION_ERROR_CODES.INTERNAL;
	},
});

/**
 * Authenticated action client: resolves the session user in the
 * next-safe-action `use` hook (NOT the Next.js proxy) so authentication
 * cannot be skipped by an action body.
 */
export const authActionClient = actionClient.use(async ({ next }) => {
	const userId = await getCurrentUserId();
	if (!userId) {
		throw new ActionError(
			ACTION_ERROR_CODES.UNAUTHORIZED,
			"You must be signed in.",
		);
	}
	return next({ ctx: { userId } });
});
