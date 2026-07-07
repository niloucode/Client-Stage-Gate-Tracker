import { Prisma } from "@/lib/generated/prisma";

/** Include shape used by module queries — keep in sync with the query. */
export const moduleInclude = {} as const;

/** Full module payload returned by module queries. */
export type ModulePayload = Prisma.ModulesGetPayload<{
	include: typeof moduleInclude;
}>;
