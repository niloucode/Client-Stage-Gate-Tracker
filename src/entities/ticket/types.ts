import { Prisma } from "@/lib/generated/prisma";

export const ticketInclude = {
	TicketTags: true,
	TicketAssigned: {
		include: {
			Profile: {
				select: {
					first_name: true,
					last_name: true,
				},
			},
		},
	},
	Profile: {
		select: {
			first_name: true,
			last_name: true,
		},
	},
	// 1-to-1 issue link (spec 2026-08-15): LIGHT select — the board only
	// renders the chip (`name` + urgency styling), so carrying IssueSteps +
	// Profile + Tickets on every board ticket was pure read weight. The full
	// tree is fetched only by the issue slice's own actions. The fields here
	// map via entities/issue `mapLinkedIssueChip`. `satisfies` makes tsc
	// catch wrong field names.
	Issues: {
		select: {
			issue_id: true,
			name: true,
			type: true,
			urgency: true,
			status: true,
		},
	},
} satisfies Prisma.TicketsInclude;

export type TicketPayload = Prisma.TicketsGetPayload<{
	include: typeof ticketInclude;
}>;
