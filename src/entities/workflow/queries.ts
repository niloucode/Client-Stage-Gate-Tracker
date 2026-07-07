"use client";

import { useQuery } from "@tanstack/react-query";
import { workflowKeys } from "@/shared/query/keys";
import { getWorkflowById, getTicketsByWorkflowId } from "./workflowActions";

export function useWorkflow(workflowId: string | undefined) {
	return useQuery({
		queryKey: workflowKeys.detail(workflowId!),
		queryFn: () => getWorkflowById(workflowId!),
		enabled: !!workflowId,
	});
}

export function useTicketsByWorkflow(workflowId: string | undefined) {
	return useQuery({
		queryKey: workflowKeys.tickets(workflowId!),
		queryFn: () => getTicketsByWorkflowId(workflowId!),
		enabled: !!workflowId,
	});
}
