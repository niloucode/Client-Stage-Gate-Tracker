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
	// 1-to-1 issue link (spec 2026-08-15): full row so the editor can map it
	// via mapIssueRow without an extra round-trip. Shape duplicated locally
	// (entity isolation — ticket must not import entities/issue). The relation
	// field is named `Issues` (matches the model — Prisma relation field names
	// are NOT lowercased). `satisfies` makes tsc catch wrong field names.
	Issues: {
		include: {
			IssueSteps: { orderBy: { number: "asc" as const } },
			Profile: { select: { first_name: true, last_name: true } },
			Tickets: { take: 1 },
		},
	},
} satisfies Prisma.TicketsInclude;

export type TicketPayload = Prisma.TicketsGetPayload<{
	include: typeof ticketInclude;
}>;
