"use client";

import {
	queryOptions,
	useMutation,
	useQuery,
	useQueryClient,
} from "@tanstack/react-query";
import { issueKeys } from "@/shared/query/keys";
import { createIssue, listIssues } from "./issueActions";
import type { IssueCreateInput } from "@/shared/schemas/issue";

const issueQueryOptions = {
	list: (projectId: string | undefined) =>
		queryOptions({
			queryKey: issueKeys.list(projectId ?? ""),
			queryFn: () => listIssues(projectId!),
			enabled: !!projectId,
		}),
};

export function useProjectIssues(projectId: string | undefined) {
	return useQuery(issueQueryOptions.list(projectId));
}

export function useCreateIssue(projectId: string) {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (data: IssueCreateInput) => createIssue(projectId, data),
		onSuccess: async () => {
			// New issue → refresh this project's list and the landing-dashboard stats.
			await queryClient.invalidateQueries({
				queryKey: issueKeys.list(projectId),
			});
			await queryClient.invalidateQueries({ queryKey: issueKeys.stats() });
		},
	});
}
