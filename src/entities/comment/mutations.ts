"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { commentKeys, historyKeys } from "@/shared/query/keys";
import { createCommentWithImages } from "./commentActions";
import type { CommentParentType } from "@/lib/generated/prisma";

export function useCreateComment() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: createCommentWithImages,
		onSuccess: (_data, vars) => {
			queryClient.invalidateQueries({
				queryKey: commentKeys.list(vars.parent_type, vars.parent_id),
			});
			queryClient.invalidateQueries({ queryKey: commentKeys.lists() });

			// Also refresh ticket history when commenting on a ticket
			if (vars.parent_type === "TICKET_COMMENT") {
				queryClient.invalidateQueries({
					queryKey: historyKeys.list(vars.parent_id),
				});
			}

			queryClient.setQueryData(
				commentKeys.list(vars.parent_type, vars.parent_id),
				(oldData: any) => {
					if (!oldData) return [_data];
					return [_data, ...oldData];
				},
			);
		},
	});
}
