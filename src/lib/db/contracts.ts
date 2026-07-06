import { prisma } from "@/lib/prisma";

export async function getContractsByProject(project_id: string) {
  return prisma.contracts.findMany({ where: { project_id } });
}
