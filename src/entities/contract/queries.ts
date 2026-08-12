"use client";

import { queryOptions, useQuery } from "@tanstack/react-query";
import { contractKeys } from "@/shared/query/keys";
import { getContractByProjectId } from "./contractActions";

export const contractQueryOptions = {
	detail: (projectId: string | undefined) =>
		queryOptions({
			queryKey: contractKeys.detail(projectId!),
			queryFn: async () => {
				const result = await getContractByProjectId(projectId!);
				if (!result.success) return null;
				return result.data;
			},
			enabled: !!projectId,
		}),
};

export function useContract(projectId: string | undefined) {
	return useQuery(contractQueryOptions.detail(projectId));
}
