"use client";

import { useQuery } from "@tanstack/react-query";
import { projectKeys } from "@/shared/query/keys";
import {
	selectProjects,
	getProjectById,
	getProjectMembers,
	searchProfilesForProject,
	selectProjectsByOwner,
} from "./projectActions";

/**
 * Hook to fetch all non-deleted projects.
 */
export function useProjects() {
	return useQuery({
		queryKey: projectKeys.lists(),
		queryFn: selectProjects,
	});
}

/**
 * Hook to fetch a single project by its ID.
 */
export function useProject(projectId: string | null) {
	return useQuery({
		queryKey: projectKeys.detail(projectId ?? ""),
		queryFn: () => getProjectById(projectId!),
		enabled: !!projectId,
	});
}

/**
 * Hook to fetch all members of a project.
 */
export function useProjectMembers(projectId: string | null) {
	return useQuery({
		queryKey: projectKeys.members(projectId ?? ""),
		queryFn: () => getProjectMembers(projectId!),
		enabled: !!projectId,
	});
}

/**
 * Hook to search profiles for adding to a project.
 * Returns a function that can be called with a search query.
 */
export function useProfileSearch() {
	return useQuery({
		queryKey: ["profiles", "search", ""],
		queryFn: () => Promise.resolve([] as Awaited<ReturnType<typeof searchProfilesForProject>>),
		enabled: false, // Manual trigger only
	});
}

/**
 * Hook to fetch projects owned by the current user with computed status.
 */
export function useOwnedProjects() {
	return useQuery({
		queryKey: [...projectKeys.lists(), "owned"],
		queryFn: selectProjectsByOwner,
	});
}
