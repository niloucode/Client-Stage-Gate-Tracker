"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { commentKeys, historyKeys } from "@/shared/query/keys";
import { createCommentWithImages } from "./commentActions";

/** Mutation hook: create a comment with images. */
export function useCreateComment() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: createCommentWithImages,
		onSuccess: async (_data, vars) => {
			// Refetch the affected list so the server row (with its images)
			// is canonical — no manual cache insert.
			await queryClient.invalidateQueries({
				queryKey: commentKeys.list(vars.parent_type, vars.parent_id),
			});

			// Ticket comments also append to the ticket's history log.
			if (vars.parent_type === "TICKET_COMMENT") {
				await queryClient.invalidateQueries({
					queryKey: historyKeys.list(vars.parent_id),
				});
			}
		},
	});
}
