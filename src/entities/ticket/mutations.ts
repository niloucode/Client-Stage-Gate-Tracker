"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ticketKeys } from "@/shared/query/keys";
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ticketKeys.lists() });
    },
  });
}

export function useUpdateTicket() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateTicket,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ticketKeys.lists() });
    },
  });
}

export function useUpdateTicketStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      ticketId,
      status,
    }: {
      ticketId: string;
      status: status;
    }) => updateTicketStatus(ticketId, status),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ticketKeys.lists() });
      const previous = queryClient.getQueryData(ticketKeys.lists());
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(ticketKeys.lists(), context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ticketKeys.lists() });
    },
  });
}

export function useDeleteTicket() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (ticketId: string) => cascadeSoftDeleteTicket(ticketId),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ticketKeys.lists() });
      const previous = queryClient.getQueryData(ticketKeys.lists());
      return { previous };
    },
    onError: (_err, _ticketId, context) => {
      if (context?.previous) {
        queryClient.setQueryData(ticketKeys.lists(), context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ticketKeys.lists() });
    },
  });
}
