"use client";

import { queryOptions, useQuery } from "@tanstack/react-query";
import { phaseKeys } from "@/shared/query/keys";
import { getPhaseById, getModulesByPhaseId } from "./phaseActions";

/**
 * Entity-owned query definitions (Task 1.6). Hooks are thin wrappers over
 * `queryOptions()` factories so callers can also use `queryClient` methods
 * (`getQueryData`, `setQueryData`, `prefetchQuery`) with the same options.
 */
export const phaseQueryOptions = {
	detail: (phaseId: string | undefined) =>
		queryOptions({
			queryKey: phaseKeys.detail(phaseId!),
			queryFn: () => getPhaseById(phaseId!),
			enabled: !!phaseId,
		}),
	modules: (phaseId: string | undefined) =>
		queryOptions({
			queryKey: phaseKeys.modules(phaseId!),
			queryFn: () => getModulesByPhaseId(phaseId!),
			enabled: !!phaseId,
		}),
};

export function usePhase(phaseId: string | undefined) {
	return useQuery(phaseQueryOptions.detail(phaseId));
}

export function useModulesByPhase(phaseId: string | undefined) {
	return useQuery(phaseQueryOptions.modules(phaseId));
}
