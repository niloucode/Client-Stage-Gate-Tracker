"use client";

import { queryOptions, useQuery } from "@tanstack/react-query";
import { profileKeys } from "@/shared/query/keys";
import { selectProfile, getCurrentUserProfile } from "./profileActions";

const profileQueryOptions = {
	list: () =>
		queryOptions({
			queryKey: profileKeys.lists(),
			queryFn: selectProfile,
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

export function useCurrentUser() {
	return useQuery(profileQueryOptions.currentUser());
}
