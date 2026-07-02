import TicketBoard from '@/components/tickets/TicketBoard';
import Sidebar from '@/components/layout/sidebar';

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
