"use client";

import { useQuery } from "@tanstack/react-query";
import { ticketKeys } from "@/shared/query/keys";
import { selectTicket, getSubtasksByTicketId } from "./ticketActions";

export function useTickets() {
  return useQuery({
    queryKey: ticketKeys.lists(),
    queryFn: selectTicket,
  });
}

export function useTicketsByWorkflow(workflowId: string | undefined) {
  return useQuery({
    queryKey: ticketKeys.list({ workflowId }),
    queryFn: async () => {
      const { selectTicketsByWorkflow } = await import(
        "@/features/ticket-board/api/actions"
      );
      return selectTicketsByWorkflow(workflowId!);
    },
    enabled: !!workflowId,
  });
}

export function useTicketSubtasks(ticketId: string | undefined) {
  return useQuery({
    queryKey: ticketKeys.subtasks(ticketId!),
    queryFn: () => getSubtasksByTicketId(ticketId!),
    enabled: !!ticketId,
  });
}
