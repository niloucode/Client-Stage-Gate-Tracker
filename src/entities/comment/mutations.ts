"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { commentKeys, historyKeys } from "@/shared/query/keys";
import { createCommentWithImages, selectComment } from "./commentActions";

/** Cache shape for a comment list — typed, never `any` (Task 4.3 #63). */
type CommentListData = Awaited<ReturnType<typeof selectComment>>;

export function useCreateComment() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: createCommentWithImages,
		onSuccess: (_data, vars) => {
			queryClient.invalidateQueries({
				queryKey: commentKeys.list(vars.parent_type, vars.parent_id),
			});
			queryClient.invalidateQueries({ queryKey: commentKeys.lists() });

			if (vars.parent_type === "TICKET_COMMENT") {
				queryClient.invalidateQueries({
					queryKey: historyKeys.list(vars.parent_id),
				});
			}

			queryClient.setQueryData(
				commentKeys.list(vars.parent_type, vars.parent_id),
				(oldData: CommentListData | undefined) => {
					if (!oldData) return [_data];
					return [_data, ...oldData];
				},
			);
		},
	});
}
