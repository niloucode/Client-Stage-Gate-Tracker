import { Prisma } from "@/lib/generated/prisma";

export const phaseInclude = {} as const;

export type PhasePayload = Prisma.PhasesGetPayload<{
	include: typeof phaseInclude;
}>;
