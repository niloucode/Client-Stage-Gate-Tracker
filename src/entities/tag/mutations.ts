"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { tagKeys } from "@/shared/query/keys";
import { createTag, updateTag, softDeleteTag } from "./tagActions";

export function useCreateTag() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: createTag,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: tagKeys.all });
		},
	});
}

export function useUpdateTag() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: updateTag,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: tagKeys.all });
		},
	});
}

export function useDeleteTag() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (tagId: string) => softDeleteTag(tagId),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: tagKeys.all });
		},
	});
}
