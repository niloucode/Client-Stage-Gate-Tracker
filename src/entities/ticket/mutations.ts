"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
	ticketKeys,
	historyKeys,
	stageKeys,
	commentKeys,
	issueKeys,
} from "@/shared/query/keys";
import {
	createTicket,
	updateTicket,
	updateTicketStatus,
	cascadeSoftDeleteTicket,
} from "./ticketActions";
import type { status } from "@/lib/generated/prisma";
import { ImageParentType } from "@/lib/generated/prisma";

export function useCreateTicket() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: createTicket,
		onSuccess: async (data, variables) => {
			await queryClient.invalidateQueries({ queryKey: ticketKeys.lists() });
			// Attachments created in the same action — refresh the slide-over's
			// images query so they appear without a page refresh.
			await queryClient.invalidateQueries({
				queryKey: commentKeys.images(ImageParentType.TICKET, data.ticket_id),
			});
			// A linked issue flips to LINKED/RESOLVED — refresh every issue
			// list (issues page + ticket-board picker) and the landing stats.
			await queryClient.invalidateQueries({ queryKey: issueKeys.all });
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
			await queryClient.invalidateQueries({
				queryKey: commentKeys.images(
					ImageParentType.TICKET,
					variables.ticket_id,
				),
			});
			// Link/unlink changes the issue status — refresh issue lists + stats.
			await queryClient.invalidateQueries({ queryKey: issueKeys.all });
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
			// FINISHED resolves the linked issue; regression re-links it.
			await queryClient.invalidateQueries({ queryKey: issueKeys.all });
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
			// Soft-delete releases non-FINISHED issue links — refresh issue
			// lists + stats so the issue goes back to UNLINKED immediately.
			await queryClient.invalidateQueries({ queryKey: issueKeys.all });
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
