"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ticketKeys, historyKeys, stageKeys } from "@/shared/query/keys";
import {
	createTicket,
	updateTicket,
	updateTicketStatus,
	cascadeSoftDeleteTicket,
} from "./ticketActions";
import type { status } from "@/lib/generated/prisma";

export function useCreateTicket() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: createTicket,
		onSuccess: async (data, variables) => {
			await queryClient.invalidateQueries({ queryKey: ticketKeys.lists() });
			if (variables.performed_by) {
				await queryClient.invalidateQueries({
					queryKey: historyKeys.list(data.ticket_id),
				});
			}
		},
	});
}

export function useUpdateTicket() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: updateTicket,
		onSuccess: async (_data, variables) => {
			await queryClient.invalidateQueries({ queryKey: ticketKeys.lists() });
			if (variables.performed_by) {
				await queryClient.invalidateQueries({
					queryKey: historyKeys.list(variables.ticket_id),
				});
			}
		},
	});
}

export function useUpdateTicketStatus() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({
			ticketId,
			status,
			performed_by,
		}: {
			ticketId: string;
			status: status;
			performed_by?: string;
		}) => updateTicketStatus(ticketId, status, performed_by),
		onSuccess: async (_data, variables) => {
			await queryClient.invalidateQueries({ queryKey: ticketKeys.lists() });
			await queryClient.invalidateQueries({ queryKey: stageKeys.all });
			if (variables.performed_by) {
				await queryClient.invalidateQueries({
					queryKey: historyKeys.list(variables.ticketId),
				});
			}
		},
	});
}

export function useDeleteTicket() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({
			ticketId,
			mode,
			performed_by,
		}: {
			ticketId: string;
			mode: "cascade" | "promote";
			performed_by?: string;
		}) => cascadeSoftDeleteTicket(ticketId, performed_by, mode),
		onSuccess: async (_data, variables) => {
			await queryClient.invalidateQueries({ queryKey: ticketKeys.lists() });
			if (variables.performed_by) {
				await queryClient.invalidateQueries({
					queryKey: historyKeys.list(variables.ticketId),
				});
			}
		},
	});
}

// Add this at the bottom of src/entities/ticket/mutations.ts
import { updateTicketParent } from "./ticketActions";

export function useUpdateTicketParent() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({
			ticketId,
			parentId,
		}: {
			ticketId: string;
			parentId: string | null;
		}) => updateTicketParent(ticketId, parentId),
		onSuccess: async () => {
			// This invalidation forces the board to refetch, which instantly 
			// updates the subtask list in your TicketEditor!
			await queryClient.invalidateQueries({ queryKey: ticketKeys.lists() });
		},
	});
}