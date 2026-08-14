"use client";

import { queryOptions, useQuery } from "@tanstack/react-query";
import { profileKeys } from "@/shared/query/keys";
import { selectProfile, getCurrentUserProfile, selectTeamProfiles } from "./profileActions";

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
	currentUser: () =>
		queryOptions({
			queryKey: profileKeys.currentUser(),
			queryFn: getCurrentUserProfile,
			staleTime: 5 * 60 * 1000,
		}),
};

export function useProfiles() {
	return useQuery(profileQueryOptions.list());
}

export function useTeamProfiles(options?: { enabled?: boolean }) {
	return useQuery({
		...profileQueryOptions.team(),
		enabled: options?.enabled,
	});
}

export function useCurrentUser() {
	return useQuery(profileQueryOptions.currentUser());
}