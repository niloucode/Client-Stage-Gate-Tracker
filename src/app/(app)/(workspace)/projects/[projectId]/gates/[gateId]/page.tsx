import { notFound } from "next/navigation";
import { getGateById } from "@/entities/gate/gateActions";

export default async function GatePage({ params }: {
  params: Promise<{ projectId: string; gateId: string }>;
}) {
  const { projectId, gateId } = await params;

  const result = await getGateById(gateId, "active");
  if (!result.success || !result.data) notFound();

  return <div>Gate {gateId}</div>;
}
