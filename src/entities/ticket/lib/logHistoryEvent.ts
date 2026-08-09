import type { Prisma, action } from "@/lib/generated/prisma";

/**
 * Single history-write helper for ticket mutations (Task 3.4).
 *
 * Replaces the repeated inline `historyEvent.create` boilerplate with one
 * typed function. Always called with the caller's transaction client so
 * history rows commit atomically with the mutation that produced them.
 */
export async function logHistoryEvent(
	tx: {
		historyEvent: Prisma.HistoryEventDelegate;
	},
	args: {
		ticketId: string;
		performedBy: string;
		action: action;
		details?: Record<string, unknown>;
		targetProfileId?: string | null;
	},
): Promise<void> {
	await tx.historyEvent.create({
		data: {
			action: args.action,
			performed_by: args.performedBy,
			ticket_id: args.ticketId,
			target_profile_id: args.targetProfileId ?? null,
			details: args.details ? JSON.stringify(args.details) : null,
		},
	});
}
