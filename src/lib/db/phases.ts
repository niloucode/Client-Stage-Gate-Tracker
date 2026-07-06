import { prisma } from "@/lib/prisma";

export async function getPhasesByStageId(stage_id: string) {
  return prisma.phases.findMany({ where: { stage_id } });
}