"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { tagKeys } from "@/shared/query/keys";
import { createTag, updateTag, softDeleteTag } from "./tagActions";

/** Mutation hook: create a tag. */
export function useCreateTag() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: createTag,
		onSuccess: async () => {
			await queryClient.invalidateQueries({ queryKey: tagKeys.all });
		},
	});
}

/** Mutation hook: update a tag. */
export function useUpdateTag() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: updateTag,
		onSuccess: async () => {
			await queryClient.invalidateQueries({ queryKey: tagKeys.all });
		},
	});
}

/** Mutation hook: soft-delete a tag (protected tags refused). */
export function useDeleteTag() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (tagId: string) => softDeleteTag(tagId),
		onSuccess: async () => {
			await queryClient.invalidateQueries({ queryKey: tagKeys.all });
		},
	});
}
