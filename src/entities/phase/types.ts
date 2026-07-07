import { Prisma } from "@/lib/generated/prisma";

/** Include shape used by phase queries — keep in sync with the query. */
export const phaseInclude = {} as const;

/** Full phase payload returned by phase queries. */
export type PhasePayload = Prisma.PhasesGetPayload<{
	include: typeof phaseInclude;
}>;
