/**
 * Type registry for TanStack Query (Task 1.6).
 *
 * Augments `@tanstack/react-query`'s `Register` interface with the app-wide
 * error shape so mutation/query error callbacks are type-checked.
 *
 * Note: query keys stay structurally typed — every query is defined as a
 * `queryOptions()` factory in its entity's `queries.ts`, so
 * `queryClient.getQueryData(queryOptions)` / `setQueryData` are inferred
 * from the factory itself (no separate key registry needed).
 */

/** The error payload every server action returns on failure. */
export interface ActionResultError {
	success: false;
	error: string;
}

declare module "@tanstack/react-query" {
	interface Register {
		defaultError: ActionResultError;
	}
}

export {};
