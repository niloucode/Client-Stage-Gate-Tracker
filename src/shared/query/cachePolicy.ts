/**
 * Global TanStack Query cache policy (Task 1.6).
 *
 * Single source of truth for query behavior. Keep every default here and
 * reference it from `QueryProvider` so the policy is documented in one
 * place and can't drift from the client configuration.
 *
 * | Setting            | Value   | Rationale                                                        |
 * |--------------------|---------|------------------------------------------------------------------|
 * | staleTime          | 30_000  | Data is fresh for 30s after fetch; avoids refetch storms on      |
 * |                    |         | rapid navigation while staying near real-time.                   |
 * | gcTime             | 5 * 60_000 | Keep 5 minutes of history so back/forward navigation is       |
 * |                    |         | instant after the data goes stale.                               |
 * | retry (queries)    | 1       | One silent retry for transient network failures; don't hammer    |
 * |                    |         | the server with retries for deterministic 4xx.                   |
 * | refetchOnWindowFocus | false | The app is dashboard-style; mutations invalidate explicitly,   |
 * |                    |         | so background window-focus refetches only add noise.             |
 * | retry (mutations)  | 0       | Never auto-retry mutations — a user-triggered write must not     |
 * |                    |         | run twice (e.g. double-create) behind the user's back.           |
 */
export const CACHE_POLICY = {
	queries: {
		staleTime: 30_000,
		gcTime: 5 * 60_000,
		retry: 1,
		refetchOnWindowFocus: false,
	},
	mutations: {
		retry: 0,
	},
} as const;
