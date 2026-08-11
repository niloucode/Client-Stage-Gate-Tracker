"use client";

import { useQuery } from "@tanstack/react-query";
import { historyKeys } from "@/shared/query/keys";
import { selectTicketHistory } from "@/entities/ticket/ticketActions";
import { ticketHistoryEntrySchema } from "./schema";
import type { TicketHistoryEntry } from "./types";

/**
 * Fetches real HistoryEvent rows from the database via the `selectTicketHistory`
 * server action and maps the joined profile relations into flat `performerName`
 * and `targetName` fields for the UI.
 */
async function fetchTicketHistory(
	ticketId: string,
): Promise<TicketHistoryEntry[]> {
	const rows = await selectTicketHistory(ticketId);

	return rows.map((row) =>
		ticketHistoryEntrySchema.parse({
			history_event_id: row.history_event_id,
			action: row.action,
			date_performed: row.performed_at,
			ticket_id: row.ticket_id,
			target_profile_id: row.target_profile_id,
			performed_by: row.performed_by,
			details: row.details,
			performerName: row.Performer
				? `${row.Performer.first_name} ${row.Performer.last_name}`
				: "Unknown",
			targetName: row.TargetProfile
				? `${row.TargetProfile.first_name} ${row.TargetProfile.last_name}`
				: null,
		}),
	);
}

export function useTicketHistory(ticketId: string | undefined) {
	return useQuery({
		queryKey: historyKeys.list(ticketId!),
		queryFn: () => fetchTicketHistory(ticketId!),
		enabled: !!ticketId,
	});
}
