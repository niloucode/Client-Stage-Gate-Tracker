import { prisma } from "@/lib/prisma";

export async function getProjects() {
  return prisma.projects.findMany();
}
