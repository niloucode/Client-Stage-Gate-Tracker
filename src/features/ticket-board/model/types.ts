import { action as HistoryAction } from "@/lib/generated/prisma";

/**
 * Mirrors the Prisma `HistoryEvent` model field-for-field.
 * @see prisma/schema.prisma → model HistoryEvent
 */
export interface TicketHistory {
  history_event_id: string;
  performed_by: string;
  action: HistoryAction;
  date_performed: Date;
  ticket_id: string;
}

/**
 * `TicketHistory` enriched for display. `performedByName` and `description`
 * are NOT columns on the Prisma model — the schema has no relation from
 * `performed_by` to `Profiles` and no column capturing what changed.
 * TODO: once the backend can join the acting profile and derive a change
 * description (e.g. a metadata column or diffing ticket snapshots),
 * GET /tickets/:id/history should return this shape directly.
 */
export interface TicketHistoryEntry extends TicketHistory {
  performedByName: string;
  description: string;
}
