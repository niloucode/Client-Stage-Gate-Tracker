import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";

export default async function ModulePage({ params }: {
  params: Promise<{ projectId: string; moduleId: string }>;
}) {
  const { projectId, moduleId } = await params;

  const mod = await prisma.modules.findUnique({
    where: { module_id: moduleId, is_deleted: false },
    select: { module_id: true },
  });
  if (!mod) notFound();

  return <div>Module {moduleId}</div>;
}
