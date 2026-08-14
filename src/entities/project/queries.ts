"use client";

import { queryOptions, useQuery } from "@tanstack/react-query";
import { projectKeys } from "@/shared/query/keys";
import {
	selectProjects,
	getProjectById,
	getProjectMembers,
	getProjectStats,
	searchProfilesForProject,
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
	/**
	 * Disabled-by-default profile search (callers enable via `refetch`).
	 */
	profileSearch: () =>
		queryOptions({
			queryKey: ["profiles", "search", ""],
			queryFn: () =>
				Promise.resolve(
					[] as Awaited<ReturnType<typeof searchProfilesForProject>>,
				),
			enabled: false,
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

export function useProjects() {
	return useQuery(projectQueryOptions.list());
}

export function useProject(projectId: string | null) {
	return useQuery(projectQueryOptions.detail(projectId));
}

export function useProjectMembers(projectId: string | null) {
	return useQuery(projectQueryOptions.members(projectId));
}

export function useProfileSearch() {
	return useQuery(projectQueryOptions.profileSearch());
}

export function useProjectsForMember() {
	return useQuery(projectQueryOptions.owned());
}

export function useProjectStats(projectId: string | null) {
	return useQuery(projectQueryOptions.stats(projectId));
}
