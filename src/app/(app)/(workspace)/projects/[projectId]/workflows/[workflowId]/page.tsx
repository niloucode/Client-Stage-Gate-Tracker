import { notFound } from "next/navigation";
import { getWorkflowById } from "@/entities/workflow/workflowActions";
import { TicketBoard } from "@/features/ticket-board/ui";

export default async function TicketsPage({
	params,
}: {
	params: Promise<{ projectId: string; workflowId: string }>;
}) {
	const { projectId, workflowId } = await params;

	const result = await getWorkflowById(workflowId, "active");
	if (!result.success || !result.data) notFound();
	const workflow = result.data;

	const workflowName = workflow.name ?? "Untitled";
	const stageId = workflow.Modules?.Phases?.stage_id ?? "";

	return (
		<main className="flex-1 overflow-hidden">
			<TicketBoard
				workflow_id={workflowId}
				workflowName={workflowName}
				projectId={projectId}
				stageId={stageId}
			/>
		</main>
	);
}
