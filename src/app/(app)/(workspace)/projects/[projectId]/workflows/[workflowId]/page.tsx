import TicketBoard from '@/features/ticket-board/ui/TicketBoard';
import Sidebar from '@/shared/ui/sidebar';

export default async function TicketsPage({ params }: {
    params: Promise<{ projectId: string; workflowId: string }>;
}) {
  const { projectId, workflowId } = await params;

  return (
    <Sidebar>
      <main className="flex-1 h-full overflow-hidden">
        <TicketBoard project_id={projectId} workflow_id={workflowId} />
      </main>
    </Sidebar>
  );
}
