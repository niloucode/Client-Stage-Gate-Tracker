"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import { CACHE_POLICY } from "./cachePolicy";

/**
 * Centralized TanStack Query client (Task 1.6).
 * Cache policy lives in `./cachePolicy` — change it there, never here.
 * @returns A fresh QueryClient configured with the app cache policy.
 */
function makeQueryClient() {
	return new QueryClient({
		defaultOptions: {
			queries: {
				...CACHE_POLICY.queries,
			},
			mutations: {
				...CACHE_POLICY.mutations,
			},
		},
	});
}

let browserQueryClient: QueryClient | undefined;

function getQueryClient() {
	if (typeof window === "undefined") {
		return makeQueryClient();
	}
	if (!browserQueryClient) {
		browserQueryClient = makeQueryClient();
	}
	return browserQueryClient;
}

/** Provides the app-wide TanStack QueryClient to the tree. */
export function QueryProvider({ children }: { children: ReactNode }) {
	const [queryClient] = useState(getQueryClient);

	return (
		<QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
	);
}
