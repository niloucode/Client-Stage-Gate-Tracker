import { Prisma } from "@/lib/generated/prisma";

export const moduleInclude = {} as const;

export type ModulePayload = Prisma.ModulesGetPayload<{
	include: typeof moduleInclude;
}>;
