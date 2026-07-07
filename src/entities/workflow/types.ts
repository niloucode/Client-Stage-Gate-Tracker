import { Prisma } from "@/lib/generated/prisma";

/** Include shape used by workflow queries — keep in sync with the query. */
export const workflowInclude = {} as const;

/** Full workflow payload returned by workflow queries. */
export type WorkflowPayload = Prisma.WorkflowsGetPayload<{
	include: typeof workflowInclude;
}>;
