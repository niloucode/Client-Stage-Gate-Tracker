"use client";

import { useQuery } from "@tanstack/react-query";
import { moduleKeys } from "@/shared/query/keys";
import { getModuleById, getWorkflowsByModuleId } from "./moduleActions";

export function useModule(moduleId: string | undefined) {
	return useQuery({
		queryKey: moduleKeys.detail(moduleId!),
		queryFn: () => getModuleById(moduleId!),
		enabled: !!moduleId,
	});
}

export function useWorkflowsByModule(moduleId: string | undefined) {
	return useQuery({
		queryKey: moduleKeys.workflows(moduleId!),
		queryFn: () => getWorkflowsByModuleId(moduleId!),
		enabled: !!moduleId,
	});
}
