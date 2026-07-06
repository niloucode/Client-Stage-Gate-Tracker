import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";

export default async function GatePage({ params }: {
  params: Promise<{ projectId: string; gateId: string }>;
}) {
  const { projectId, gateId } = await params;

  const gate = await prisma.gates.findUnique({
    where: { gate_id: gateId, is_deleted: false },
    select: { gate_id: true },
  });
  if (!gate) notFound();

  return <div>Gate {gateId}</div>;
}
