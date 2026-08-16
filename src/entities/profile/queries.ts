"use client";

import { queryOptions, useQuery } from "@tanstack/react-query";
import { profileKeys } from "@/shared/query/keys";
import {
	selectProfile,
	getCurrentUserProfile,
	selectTeamProfiles,
	selectProjectMembers,
} from "./profileActions";

const profileQueryOptions = {
	list: () =>
		queryOptions({
			queryKey: profileKeys.lists(),
			queryFn: selectProfile,
		}),
	team: () =>
		queryOptions({
			queryKey: profileKeys.team(),
			queryFn: selectTeamProfiles,
		}),
	projectMembers: (projectId: string | undefined) =>
		queryOptions({
			queryKey: profileKeys.projectMembers(projectId!),
			queryFn: () => selectProjectMembers(projectId!),
			enabled: !!projectId,
		}),
	currentUser: () =>
		queryOptions({
			queryKey: profileKeys.currentUser(),
			queryFn: getCurrentUserProfile,
			staleTime: 5 * 60 * 1000,
		}),
};

/**
 * Query hook: the team profile list.
 * @returns The result.
 */
export function useTeamProfiles(options?: { enabled?: boolean }) {
	return useQuery({
		...profileQueryOptions.team(),
		enabled: options?.enabled,
	});
}

/**
 * Query hook: a project's member profiles.
 * @param projectId
 * @returns The result.
 */
export function useProjectMembers(projectId: string | undefined) {
	return useQuery(profileQueryOptions.projectMembers(projectId));
}

/**
 * Query hook: the session profile.
 * @returns The result.
 */
export function useCurrentUser() {
	return useQuery(profileQueryOptions.currentUser());
}
