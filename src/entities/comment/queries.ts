"use client";

import { useQuery } from "@tanstack/react-query";
import { commentKeys } from "@/shared/query/keys";
import { selectComment, selectImagesByParent } from "./commentActions";
import { CommentParentType, ImageParentType } from "@/lib/generated/prisma";

export function useTicketComments(ticketId: string | undefined) {
	return useQuery({
		queryKey: commentKeys.list("TICKET", ticketId!),
		queryFn: async () => {
			const all = await selectComment();
			return all.filter(
				(c) =>
					c.parent_type === CommentParentType.TICKET_COMMENT &&
					c.parent_id === ticketId,
			);
		},
		enabled: !!ticketId,
	});
}

export function useTicketImages(ticketId: string | undefined) {
	return useQuery({
		queryKey: ["ticket-images", ticketId],
		queryFn: () => selectImagesByParent(ImageParentType.TICKET, ticketId!),
		enabled: !!ticketId,
	});
}
