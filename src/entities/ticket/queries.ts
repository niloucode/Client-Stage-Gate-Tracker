"use client";

import { useQuery } from "@tanstack/react-query";
import { ticketKeys } from "@/shared/query/keys";
import { selectTicketsByWorkflow } from "./ticketActions";

export function useTicketsByWorkflow(workflowId: string | undefined) {
	return useQuery({
		queryKey: ticketKeys.list({ workflowId }),
		queryFn: () => selectTicketsByWorkflow(workflowId!),
		enabled: !!workflowId,
	});
}
