import { prisma } from "@/lib/prisma";

export async function getTicketsByWorkflow(workflow_id: string) {
  return prisma.tickets.findMany({ where: { workflow_id } });
}
