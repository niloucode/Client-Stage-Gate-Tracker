"use client";

import type { Workflow } from "../../types";
import {
	useCreateWorkflow,
	useUpdateWorkflow,
} from "@/entities/workflow/mutations";
import {
	ScheduleNodeModal,
	type ScheduleNodeEntity,
} from "./ScheduleNodeModal";

export interface WorkflowModalProps {
	isOpen: boolean;
	onClose: () => void;
	/**
	 * Pass a `workflow` object for Edit mode, or `null`/`undefined` for Create mode.
	 */
	workflow?: Workflow | null;
	moduleId: string;
	stageId: string;
	onDelete?: () => void;
}

function toScheduleNode(workflow: Workflow): ScheduleNodeEntity {
	return {
		id: workflow.workflow_id,
		name: workflow.name,
		planStart: workflow.planStart,
		planEnd: workflow.planEnd,
		actualStart: workflow.actualStart,
		actualEnd: workflow.actualEnd,
	};
}

function WorkflowModal({
	isOpen,
	onClose,
	workflow,
	moduleId,
	stageId,
	onDelete,
}: WorkflowModalProps) {
	const createWorkflowMutation = useCreateWorkflow();
	const updateWorkflowMutation = useUpdateWorkflow();

	return (
		<ScheduleNodeModal
			isOpen={isOpen}
			onClose={onClose}
			entity={workflow ? toScheduleNode(workflow) : null}
			stageId={stageId}
			parentId={moduleId}
			onDelete={onDelete}
			isPending={
				createWorkflowMutation.isPending || updateWorkflowMutation.isPending
			}
			config={{
				entityLabel: "Workflow",
				createdVerb: "created",
				namePlaceholder: "e.g., User Login Flow",
				create: (p) =>
					createWorkflowMutation.mutateAsync({
						moduleId: p.parentId,
						stageId: p.stageId,
						name: p.name,
						planStart: p.planStart,
						planEnd: p.planEnd,
						actualStart: p.actualStart,
						actualEnd: p.actualEnd,
					}),
				update: (p) =>
					updateWorkflowMutation.mutateAsync({
						workflowId: p.id,
						stageId: p.stageId,
						name: p.name,
						planStart: p.planStart,
						planEnd: p.planEnd,
						actualStart: p.actualStart,
						actualEnd: p.actualEnd,
					}),
			}}
		/>
	);
}

// ── Backward-compatible Aliases ──────────────────────────────────────────────

export function AddWorkflow(props: Omit<WorkflowModalProps, "workflow">) {
	return <WorkflowModal {...props} workflow={null} />;
}

export function EditWorkflow(props: WorkflowModalProps) {
	return <WorkflowModal {...props} />;
}
