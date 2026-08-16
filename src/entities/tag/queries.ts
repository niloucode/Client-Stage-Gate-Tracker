"use client";

import { queryOptions, useQuery } from "@tanstack/react-query";
import { tagKeys } from "@/shared/query/keys";
import { selectTag } from "./tagActions";

const tagQueryOptions = {
	list: () =>
		queryOptions({
			queryKey: tagKeys.all,
			queryFn: selectTag,
			// Reference data — changes rarely (Task 4.3 #52).
			staleTime: 5 * 60 * 1000,
		}),
};

/**
 * Query hook: the tag list.
 * @returns The result.
 */
export function useTags() {
	return useQuery(tagQueryOptions.list());
}
