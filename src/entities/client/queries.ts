"use client";

import { queryOptions, useQuery } from "@tanstack/react-query";

import { clientKeys } from "@/shared/query/keys"
import { clientSelectAll } from "./clientActions"

export const clientQueryOptions = {
	list: () =>
		queryOptions({
			queryKey: clientKeys.lists(),
			queryFn: clientSelectAll,
		}),
};

export function useClients() {
	return useQuery(clientQueryOptions.list());
}
