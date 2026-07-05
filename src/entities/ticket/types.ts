import { Prisma } from "@/lib/generated/prisma";

/** Include shape used by selectTicket — keep in sync with the query. */
export const ticketInclude = {
  TicketTags: true,
  TicketAssigned: {
    include: {
      Profiles: {
        select: {
          first_name: true,
          last_name: true,
        },
      },
    },
  },
  Profiles: {
    select: {
      first_name: true,
      last_name: true,
    },
  },
} as const;

/** Full ticket payload returned by selectTicket / createTicket / updateTicket. */
export type TicketPayload = Prisma.TicketsGetPayload<{
  include: typeof ticketInclude;
}>;
