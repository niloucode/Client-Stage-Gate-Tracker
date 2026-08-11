import { notFound } from "next/navigation";
import { GateOverview } from "@/features/gate-overview/GateOverview";

export default async function GatePage({
  params,
}: {
  params: Promise<{ projectId: string; gateId: string }>;
}) {
  const { projectId, gateId } = await params;

  return (
    <div>
      <GateOverview />
    </div>
  );
}