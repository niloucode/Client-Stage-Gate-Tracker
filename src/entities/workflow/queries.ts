"use client";

import { queryOptions, useQuery } from "@tanstack/react-query";
import { workflowKeys } from "@/shared/query/keys";
import { getWorkflowById, getTicketsByWorkflowId } from "./workflowActions";

export const workflowQueryOptions = {
	detail: (workflowId: string | undefined) =>
		queryOptions({
			queryKey: workflowKeys.detail(workflowId!),
			queryFn: () => getWorkflowById(workflowId!),
			enabled: !!workflowId,
		}),
	tickets: (workflowId: string | undefined) =>
		queryOptions({
			queryKey: workflowKeys.tickets(workflowId!),
			queryFn: () => getTicketsByWorkflowId(workflowId!),
			enabled: !!workflowId,
		}),
};

export function useWorkflow(workflowId: string | undefined) {
	return useQuery(workflowQueryOptions.detail(workflowId));
}

export function useTicketsByWorkflow(workflowId: string | undefined) {
	return useQuery(workflowQueryOptions.tickets(workflowId));
}
