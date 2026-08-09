"use client";

import { queryOptions, useQuery } from "@tanstack/react-query";
import { moduleKeys } from "@/shared/query/keys";
import { getModuleById, getWorkflowsByModuleId } from "./moduleActions";

export const moduleQueryOptions = {
	detail: (moduleId: string | undefined) =>
		queryOptions({
			queryKey: moduleKeys.detail(moduleId!),
			queryFn: () => getModuleById(moduleId!),
			enabled: !!moduleId,
		}),
	workflows: (moduleId: string | undefined) =>
		queryOptions({
			queryKey: moduleKeys.workflows(moduleId!),
			queryFn: () => getWorkflowsByModuleId(moduleId!),
			enabled: !!moduleId,
		}),
};

export function useModule(moduleId: string | undefined) {
	return useQuery(moduleQueryOptions.detail(moduleId));
}

export function useWorkflowsByModule(moduleId: string | undefined) {
	return useQuery(moduleQueryOptions.workflows(moduleId));
}
