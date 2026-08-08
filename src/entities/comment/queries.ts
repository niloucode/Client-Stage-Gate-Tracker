"use client";

import { useQuery } from "@tanstack/react-query";
import { commentKeys } from "@/shared/query/keys";
import { selectComment, selectImagesByParent } from "./commentActions";
import { ImageParentType } from "@/lib/generated/prisma";

export function useTicketComments(ticketId: string | undefined) {
	return useQuery({
		queryKey: commentKeys.list("TICKET", ticketId!),
		queryFn: () => selectComment(ticketId!),
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
