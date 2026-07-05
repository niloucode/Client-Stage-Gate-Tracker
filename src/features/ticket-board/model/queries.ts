"use client";

import { useQuery } from "@tanstack/react-query";
import { historyKeys } from "@/shared/query/keys";
import { action } from "@/lib/generated/prisma";
import { ticketHistoryEntrySchema } from "./schema";
import type { TicketHistoryEntry } from "./types";

// ============ DATA LAYER (replace with API calls) ============

function minutesAgo(n: number): Date {
  return new Date(Date.now() - n * 60 * 1000);
}

function hoursAgo(n: number): Date {
  return new Date(Date.now() - n * 60 * 60 * 1000);
}

function daysAgo(n: number): Date {
  return new Date(Date.now() - n * 24 * 60 * 60 * 1000);
}

/**
 * Stand-in for GET /tickets/:id/history. `performedByName` and
 * `description` are pre-baked here since neither can be derived from the
 * raw `HistoryEvent` row alone — see TicketHistoryEntry in ./types.ts.
 */
const MOCK_HISTORY: TicketHistoryEntry[] = [
  {
    history_event_id: "b1a7c9d2-1e3f-4a5b-8c6d-7e8f9a0b1c2d",
    performed_by: "3f2b1a4c-5d6e-4f70-8192-a3b4c5d6e7f8",
    action: action.CREATED,
    date_performed: daysAgo(3),
    ticket_id: "mock-ticket-id",
    performedByName: "Juan dela Cruz",
    description: "Ticket created",
  },
  {
    history_event_id: "c2b8d0e3-2f4a-4b6c-9d7e-8f9a0b1c2d3e",
    performed_by: "3f2b1a4c-5d6e-4f70-8192-a3b4c5d6e7f8",
    action: action.UPDATED_STATUS,
    date_performed: daysAgo(2),
    ticket_id: "mock-ticket-id",
    performedByName: "Juan dela Cruz",
    description: "Status changed from Pending to In Progress",
  },
  {
    history_event_id: "d3c9e1f4-3a5b-4c7d-ae8f-9a0b1c2d3e4f",
    performed_by: "7a8b9c0d-1e2f-4a3b-8c4d-5e6f7a8b9c0d",
    action: action.RENAMED,
    date_performed: hoursAgo(30),
    ticket_id: "mock-ticket-id",
    performedByName: "Maria Santos",
    description: 'Renamed from "Fix login bug" to "Fix login redirect bug"',
  },
  {
    history_event_id: "e4d0f2a5-4b6c-4d8e-af9a-0b1c2d3e4f5a",
    performed_by: "7a8b9c0d-1e2f-4a3b-8c4d-5e6f7a8b9c0d",
    action: action.COMMENT_ADDED,
    date_performed: hoursAgo(6),
    ticket_id: "mock-ticket-id",
    performedByName: "Maria Santos",
    description: "Commented on the ticket",
  },
  {
    history_event_id: "f5e1a3b6-5c7d-4e9f-b0a1-1c2d3e4f5a6b",
    performed_by: "3f2b1a4c-5d6e-4f70-8192-a3b4c5d6e7f8",
    action: action.UPDATED_STATUS,
    date_performed: hoursAgo(2),
    ticket_id: "mock-ticket-id",
    performedByName: "Juan dela Cruz",
    description: "Status changed from In Progress to Finished",
  },
  {
    history_event_id: "a6f2b4c7-6d8e-4f0a-b1c2-2d3e4f5a6b7c",
    performed_by: "3f2b1a4c-5d6e-4f70-8192-a3b4c5d6e7f8",
    action: action.FINISHED,
    date_performed: minutesAgo(20),
    ticket_id: "mock-ticket-id",
    performedByName: "Juan dela Cruz",
    description: "Ticket marked as finished",
  },
];

// TODO: fetch history logs from GET /tickets/:id/history
// TODO: paginate if log count exceeds a threshold
async function fetchTicketHistory(
  ticketId: string,
): Promise<TicketHistoryEntry[]> {
  // simulated network latency
  await new Promise((resolve) => setTimeout(resolve, 300));

  return MOCK_HISTORY.map((entry) =>
    ticketHistoryEntrySchema.parse({ ...entry, ticket_id: ticketId }),
  ).sort((a, b) => b.date_performed.getTime() - a.date_performed.getTime());
}

// ============ HOOKS ============

export function useTicketHistory(ticketId: string | undefined) {
  return useQuery({
    queryKey: historyKeys.list(ticketId!),
    queryFn: () => fetchTicketHistory(ticketId!),
    enabled: !!ticketId,
  });
}
