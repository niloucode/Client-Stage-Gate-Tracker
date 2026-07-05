import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";

export default async function PhasePage({ params }: {
  params: Promise<{ projectId: string; phaseId: string }>;
}) {
  const { projectId, phaseId } = await params;

  const phase = await prisma.phases.findUnique({
    where: { phase_id: phaseId, is_deleted: false },
    select: { phase_id: true },
  });
  if (!phase) notFound();

  return <div>Phase {phaseId}</div>;
}
