import { Prisma } from "@/lib/generated/prisma";

export const workflowInclude = {} as const;

export type WorkflowPayload = Prisma.WorkflowsGetPayload<{
	include: typeof workflowInclude;
}>;
