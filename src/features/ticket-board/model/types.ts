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

export interface Assignee {
  name: string;
  initials: string;
  bgColor: string;
}

export interface Attachment {
  id: string;
  name: string;
  type: 'file' | 'image';
}

export interface ActivityItem {
  id: string;
  Profile: Assignee;
  action: string;
  time: string;
  highlight?: string;
  highlightColor?: string;
  dotColor?: string;
}

export interface Column {
  id: 'PENDING' | 'IN_PROGRESS' | 'FINISHED';
  title: string;
  dotColor: string;
}

export const COLUMNS: Column[] = [
  { id: 'PENDING', title: 'Pending', dotColor: 'bg-gray-400' },
  { id: 'IN_PROGRESS', title: 'In Progress', dotColor: 'bg-blue-500' },
  { id: 'FINISHED', title: 'Finished', dotColor: 'bg-green-500' },
];
