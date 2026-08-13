import type { status as TicketStatus } from "@/lib/generated/prisma";

/**
 * Single source of truth for ticket-status presentation. Currently consumed
 * by the landing dashboard; ticket-board's COLUMNS can adopt it later.
 */
export const TICKET_STATUS_CONFIG: Record<
	TicketStatus,
	{ label: string; dot: string; text: string }
> = {
	PENDING: { label: "Pending", dot: "bg-yellow-500", text: "text-yellow-600" },
	IN_PROGRESS: {
		label: "In Progress",
		dot: "bg-brand-600",
		text: "text-brand-600",
	},
	FINISHED: { label: "Finished", dot: "bg-green-500", text: "text-green-600" },
};
