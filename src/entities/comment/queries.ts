"use client";

import { queryOptions, useQuery } from "@tanstack/react-query";
import { commentKeys } from "@/shared/query/keys";
import { selectComment, selectImagesByParent } from "./commentActions";
import { CommentParentType, ImageParentType } from "@/lib/generated/prisma";

const commentQueryOptions = {
	list: (ticketId: string | undefined) =>
		queryOptions({
			// MUST match the invalidation key in useCreateComment
			// (commentKeys.list(CommentParentType.TICKET_COMMENT, parentId)).
			queryKey: commentKeys.list(CommentParentType.TICKET_COMMENT, ticketId!),
			queryFn: () => selectComment(CommentParentType.TICKET_COMMENT, ticketId!),
			enabled: !!ticketId,
		}),
	images: (ticketId: string | undefined) =>
		queryOptions({
			queryKey: commentKeys.images(ImageParentType.TICKET, ticketId!),
			queryFn: () => selectImagesByParent(ImageParentType.TICKET, ticketId!),
			enabled: !!ticketId,
		}),
};

/**
 * Query hook: a ticket's comments.
 * @param ticketId
 * @returns The result.
 */
export function useTicketComments(ticketId: string | undefined) {
	return useQuery(commentQueryOptions.list(ticketId));
}

/**
 * Query hook: a ticket's attached images.
 * @param ticketId
 * @returns The result.
 */
export function useTicketImages(ticketId: string | undefined) {
	return useQuery(commentQueryOptions.images(ticketId));
}
