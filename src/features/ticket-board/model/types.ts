import { action as HistoryAction } from "@/lib/generated/prisma";

/**
 * Raw HistoryEvent row joined with performer and target profile names.
 * Returned by `selectTicketHistory` — no pre-baked `description` string;
 * the UI derives sentence messages from `action` + `details` + profile names.
 */
export interface TicketHistoryEntry {
	history_event_id: string;
	action: HistoryAction;
	date_performed: Date;
	ticket_id: string;
	target_profile_id?: string | null;
	performed_by: string;
	details?: string | null;
	performerName: string;
	targetName: string | null;
}
