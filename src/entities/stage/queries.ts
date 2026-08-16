"use client";

import { queryOptions, useQuery } from "@tanstack/react-query";
import { stageKeys } from "@/shared/query/keys";
import { getProjectStages, getStageTree } from "./stageActions";

const stageQueryOptions = {
	tree: (stageId: string | undefined) =>
		queryOptions({
			queryKey: stageKeys.tree(stageId!),
			queryFn: () => getStageTree(stageId!),
			enabled: !!stageId,
		}),
	list: (projectId: string | undefined) =>
		queryOptions({
			queryKey: stageKeys.list(projectId!),
			queryFn: async () => {
				const result = await getProjectStages(projectId!);
				if (!result.success) return [];
				return result.data;
			},
			enabled: !!projectId,
		}),
};

/** Query hook: a stage + its phase/module/workflow tree. */
export function useStageTree(stageId: string | undefined) {
	return useQuery(stageQueryOptions.tree(stageId));
}

/** Query hook: a project's stages. */
export function useProjectStages(projectId: string | undefined) {
	return useQuery(stageQueryOptions.list(projectId));
}
