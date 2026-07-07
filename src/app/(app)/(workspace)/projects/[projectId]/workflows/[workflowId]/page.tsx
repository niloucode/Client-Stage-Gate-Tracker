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
    include: {
      Modules: {
        include: {
          Phases: true,
        },
      },
    },
  });
  if (!workflow) notFound();

  // The generated Prisma types omit FK fields; extract them at runtime.
  const wf = workflow as Record<string, unknown>;
  const workflowName = (wf.name as string) ?? 'Untitled';
  const mod = (wf.Modules as Record<string, unknown> | null) ?? {};
  const phase = (mod.Phases as Record<string, unknown> | null) ?? {};
  const stageId = (phase.stage_id as string) ?? '';

  return (
    <Sidebar>
      <main className="flex-1 h-full overflow-hidden">
        <TicketBoard
          workflow_id={workflowId}
          workflowName={workflowName}
          projectId={projectId}
          stageId={stageId}
        />
      </main>
    </Sidebar>
  );
}
