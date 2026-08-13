"use client";

import { queryOptions, useQuery } from "@tanstack/react-query";

import { clientKeys } from "@/shared/query/keys";
import { clientSelectAll, clientSelectOwn } from "./clientActions";

const clientQueryOptions = {
	list: () =>
		queryOptions({
			queryKey: clientKeys.lists(),
			queryFn: clientSelectAll,
		}),
	own: () =>
		queryOptions({
			queryKey: clientKeys.own(),
			queryFn: clientSelectOwn,
		}),
};

export function useClients(options?: { enabled?: boolean }) {
	return useQuery({
		...clientQueryOptions.list(),
		enabled: options?.enabled,
	});
}

/**
 * The signed-in user's own client (company name for the account menu).
 * Returns null for staff; disabled entirely when no session exists.
 */
export function useClientOwn(enabled?: boolean) {
	return useQuery({
		...clientQueryOptions.own(),
		enabled,
	});
}
