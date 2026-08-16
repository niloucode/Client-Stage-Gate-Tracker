"use client";

import { queryOptions, useQuery } from "@tanstack/react-query";
import { projectKeys } from "@/shared/query/keys";
import {
	selectProjects,
	getProjectById,
	getProjectMembers,
	getProjectStats,
	selectProjectsForMember,
} from "./projectActions";

const projectQueryOptions = {
	list: () =>
		queryOptions({
			queryKey: projectKeys.lists(),
			queryFn: selectProjects,
		}),
	owned: () =>
		queryOptions({
			queryKey: [...projectKeys.lists(), "owned"],
			queryFn: selectProjectsForMember,
		}),
	detail: (projectId: string | null) =>
		queryOptions({
			queryKey: projectKeys.detail(projectId ?? ""),
			queryFn: () => getProjectById(projectId!),
			enabled: !!projectId,
		}),
	members: (projectId: string | null) =>
		queryOptions({
			queryKey: projectKeys.members(projectId ?? ""),
			queryFn: () => getProjectMembers(projectId!),
			enabled: !!projectId,
		}),
	stats: (projectId: string | null) =>
		queryOptions({
			queryKey: projectKeys.stats(projectId ?? ""),
			queryFn: async () => {
				const result = await getProjectStats(projectId!);
				if (!result.success) return null;
				return result.data;
			},
			enabled: !!projectId,
		}),
};

export function useProject(projectId: string | null) {
	return useQuery(projectQueryOptions.detail(projectId));
}

export function useProjectMembers(projectId: string | null) {
	return useQuery(projectQueryOptions.members(projectId));
}

export function useProjectsForMember() {
	return useQuery(projectQueryOptions.owned());
}

export function useProjectStats(projectId: string | null) {
	return useQuery(projectQueryOptions.stats(projectId));
}
