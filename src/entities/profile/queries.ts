"use client";

import { queryOptions, useQuery } from "@tanstack/react-query";
import { profileKeys } from "@/shared/query/keys";
import { selectProfile } from "./profileActions";
import { createClient } from "@/lib/supabase/client";

export const profileQueryOptions = {
	list: () =>
		queryOptions({
			queryKey: profileKeys.lists(),
			queryFn: selectProfile,
		}),
	currentUser: () =>
		queryOptions({
			queryKey: profileKeys.currentUser(),
			queryFn: async () => {
				const supabase = createClient();
				const {
					data: { user },
				} = await supabase.auth.getUser();
				if (!user?.id) return null;

				const { data, error } = await supabase
					.from("Profiles")
					.select()
					.eq("profile_id", user.id)
					.single();

				if (error || !data) return null;
				return data;
			},
			staleTime: 5 * 60 * 1000,
		}),
};

export function useProfiles() {
	return useQuery(profileQueryOptions.list());
}

export function useCurrentUser() {
	return useQuery(profileQueryOptions.currentUser());
}
