import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { TicketBoard } from '@/features/ticket-board/ui';
import Sidebar from '@/shared/ui/sidebar';

export default async function TicketsPage({ params }: {
    params: Promise<{ projectId: string; workflowId: string }>;
}) {
  const { projectId, workflowId } = await params;

  const workflow = await prisma.workflows.findUnique({
    where: { workflow_id: workflowId, is_deleted: false },
    select: { workflow_id: true },
  });
  if (!workflow) notFound();

  return (
    <Sidebar>
      <main className="flex-1 h-full overflow-hidden">
        <TicketBoard workflow_id={workflowId} />
      </main>
    </Sidebar>
  );
}
