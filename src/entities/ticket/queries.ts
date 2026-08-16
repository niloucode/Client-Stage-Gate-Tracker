"use client";

import { queryOptions, useQuery } from "@tanstack/react-query";
import { ticketKeys } from "@/shared/query/keys";
import { selectTicketsByWorkflow } from "./ticketActions";

const ticketQueryOptions = {
	byWorkflow: (workflowId: string | undefined) =>
		queryOptions({
			queryKey: ticketKeys.list({ workflowId }),
			queryFn: () => selectTicketsByWorkflow(workflowId!),
			enabled: !!workflowId,
		}),
};

/**
 * Query hook: a workflow's ticket board rows.
 * @param workflowId
 * @returns The result.
 */
export function useTicketsByWorkflow(workflowId: string | undefined) {
	return useQuery(ticketQueryOptions.byWorkflow(workflowId));
}
