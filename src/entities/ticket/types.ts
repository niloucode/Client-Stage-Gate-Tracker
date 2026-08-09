import { Prisma } from "@/lib/generated/prisma";

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

export type TicketPayload = Prisma.TicketsGetPayload<{
  include: typeof ticketInclude;
}>;
