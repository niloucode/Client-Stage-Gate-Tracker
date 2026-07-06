"use client";

import { useQuery } from "@tanstack/react-query";
import { profileKeys } from "@/shared/query/keys";
import { selectProfile } from "./profileActions";
import { createClient } from "@/lib/supabase/client";

export function useProfiles() {
	return useQuery({
		queryKey: profileKeys.lists(),
		queryFn: selectProfile,
	});
}

export function useCurrentUser() {
	const supabase = createClient();

	return useQuery({
		queryKey: profileKeys.currentUser(),
		queryFn: async () => {
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
	});
}
