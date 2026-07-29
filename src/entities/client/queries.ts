"use client"

import { useQuery } from "@tanstack/react-query"

import { clientKeys } from "@/shared/query/keys"
import { clientSelectAll } from "./clientActions"

export function useClients() {
	return useQuery({
		queryKey: clientKeys.lists(),
		queryFn: clientSelectAll,
	})
}
