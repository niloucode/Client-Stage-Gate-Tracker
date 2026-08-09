"use client";

import { queryOptions, useQuery } from "@tanstack/react-query";
import { commentKeys } from "@/shared/query/keys";
import { selectComment, selectImagesByParent } from "./commentActions";
import { CommentParentType, ImageParentType } from "@/lib/generated/prisma";

export const commentQueryOptions = {
	list: (ticketId: string | undefined) =>
		queryOptions({
			queryKey: commentKeys.list("TICKET", ticketId!),
			queryFn: () =>
				selectComment(CommentParentType.TICKET_COMMENT, ticketId!),
			enabled: !!ticketId,
		}),
	images: (ticketId: string | undefined) =>
		queryOptions({
			queryKey: commentKeys.images(ImageParentType.TICKET, ticketId!),
			queryFn: () => selectImagesByParent(ImageParentType.TICKET, ticketId!),
			enabled: !!ticketId,
		}),
};

export function useTicketComments(ticketId: string | undefined) {
	return useQuery(commentQueryOptions.list(ticketId));
}

export function useTicketImages(ticketId: string | undefined) {
	return useQuery(commentQueryOptions.images(ticketId));
}
