import { notFound } from "next/navigation";
import { getPhaseById } from "@/entities/phase/phaseActions";

export default async function PhasePage({ params }: {
  params: Promise<{ projectId: string; phaseId: string }>;
}) {
  const { projectId, phaseId } = await params;

  const result = await getPhaseById(phaseId, "active");
  if (!result.success || !result.data) notFound();

  return <div>Phase {phaseId}</div>;
}
