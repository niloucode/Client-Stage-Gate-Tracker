import { z } from "zod";
import { action } from "@/lib/generated/prisma";

// ── Ticket history log ──────────────────────────────────────────────────────

/**
 * Validates a single history log entry crossing the (stubbed) network
 * boundary. Mirrors the Prisma `HistoryEvent` model plus the UI-only
 * `performedByName`/`description` fields — see TicketHistoryEntry in
 * ./types.ts for why those two aren't part of the raw model.
 */
export const ticketHistoryEntrySchema = z.object({
  history_event_id: z.string().uuid(),
  performed_by: z.string().uuid(),
  action: z.enum(action),
  date_performed: z.date(),
  ticket_id: z.string().uuid(),
  performedByName: z.string().min(1),
  description: z.string().min(1),
});

export type TicketHistoryEntryInput = z.infer<typeof ticketHistoryEntrySchema>;
