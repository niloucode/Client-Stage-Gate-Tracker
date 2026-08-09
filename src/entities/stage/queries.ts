"use client";

import { queryOptions, useQuery } from "@tanstack/react-query";
import { stageKeys } from "@/shared/query/keys";
import { getStageTree } from "./stageActions";

export const stageQueryOptions = {
	tree: (stageId: string | undefined) =>
		queryOptions({
			queryKey: stageKeys.tree(stageId!),
			queryFn: () => getStageTree(stageId!),
			enabled: !!stageId,
		}),
};

export function useStageTree(stageId: string | undefined) {
	return useQuery(stageQueryOptions.tree(stageId));
}
