"use client";

import { useState } from "react";
import Link from "next/link";
import type { Workflow } from "../types";
import { AddWorkflow } from "@/features/stage-editor/ui/modals/AddWorkflow";
import { EditWorkflow } from "@/features/stage-editor/ui/modals/EditWorkflow";
import { DeleteWorkflow } from "@/features/stage-editor/ui/modals/DeleteWorkflow";
import {
	useCreateWorkflow,
	useUpdateWorkflow,
	useDeleteWorkflow,
	useReorderWorkflow,
} from "@/entities/workflow/mutations";

interface WorkflowsListProps {
	workflows: Workflow[];
	moduleId: string;
	projectId: string;
	stageId: string;
}

export function WorkflowsList({
	workflows,
	moduleId,
	projectId,
	stageId,
}: WorkflowsListProps) {
	const [isAddOpen, setIsAddOpen] = useState(false);
	const [editingWorkflow, setEditingWorkflow] = useState<Workflow | null>(null);
	const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
	const [workflowToDelete, setWorkflowToDelete] = useState<Workflow | null>(
		null,
	);
	const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

	const createWorkflowMutation = useCreateWorkflow();
	const updateWorkflowMutation = useUpdateWorkflow();
	const deleteWorkflowMutation = useDeleteWorkflow();
	const reorderWorkflowMutation = useReorderWorkflow();

	const openCreateWorkflowModal = () => setIsAddOpen(true);
	const openEditWorkflowModal = (workflow: Workflow) =>
		setEditingWorkflow(workflow);

	const formatDateTime = (date: Date | null) => {
		if (!date) return "——";
		return date.toLocaleString("en-US", {
			month: "short",
			day: "numeric",
			year: "numeric",
			hour: "numeric",
			minute: "2-digit",
			hour12: true,
		});
	};

	const handleAddWorkflow = async (data: {
		name: string;
		start_date: Date | null;
		deadline_date: Date | null;
		finish_date: Date | null;
	}) => {
		await createWorkflowMutation.mutateAsync({
			moduleId,
			stageId,
			name: data.name,
			start_date: data.start_date ?? undefined,
			deadline_date: data.deadline_date ?? undefined,
			finish_date: data.finish_date ?? undefined,
		});
		setIsAddOpen(false);
	};

	const handleSaveWorkflow = async (data: {
		name: string;
		start_date: Date | null;
		deadline_date: Date | null;
		finish_date: Date | null;
	}) => {
		if (!editingWorkflow) return;
		await updateWorkflowMutation.mutateAsync({
			workflowId: editingWorkflow.workflow_id,
			stageId,
			name: data.name,
			start_date: data.start_date ?? undefined,
			deadline_date: data.deadline_date ?? undefined,
			finish_date: data.finish_date ?? undefined,
		});
		setEditingWorkflow(null);
	};

	const confirmDelete = (workflow: Workflow) => {
		setWorkflowToDelete(workflow);
		setIsDeleteConfirmOpen(true);
		setEditingWorkflow(null);
	};

	const handleDeleteWorkflow = async () => {
		if (!workflowToDelete) return;
		await deleteWorkflowMutation.mutateAsync({
			workflowId: workflowToDelete.workflow_id,
			stageId,
		});
		setIsDeleteConfirmOpen(false);
		setWorkflowToDelete(null);
	};

	// Drag and Drop Handlers
	const handleDragStart = (e: React.DragEvent, index: number) => {
		setDraggedIndex(index);
		e.dataTransfer.effectAllowed = "move";
		setTimeout(() => {
			(e.target as HTMLElement).style.opacity = "0.5";
		}, 0);
	};

	const handleDragEnd = (e: React.DragEvent) => {
		(e.target as HTMLElement).style.opacity = "1";
		setDraggedIndex(null);
		document.querySelectorAll(".drag-over-workflow").forEach((el) => {
			el.classList.remove("drag-over-workflow");
		});
	};

	const handleDragOver = (e: React.DragEvent, index: number) => {
		e.preventDefault();
		e.dataTransfer.dropEffect = "move";

		if (draggedIndex === null || draggedIndex === index) return;

		document.querySelectorAll(".drag-over-workflow").forEach((el) => {
			el.classList.remove("drag-over-workflow");
		});

		const target = e.currentTarget as HTMLElement;
		target.classList.add("drag-over-workflow");
	};

	const handleDragLeave = (e: React.DragEvent) => {
		(e.currentTarget as HTMLElement).classList.remove("drag-over-workflow");
	};

	const handleDrop = async (e: React.DragEvent, dropIndex: number) => {
		e.preventDefault();

		const dragIndex = draggedIndex;
		if (dragIndex === null || dragIndex === dropIndex) {
			setDraggedIndex(null);
			return;
		}

		document.querySelectorAll(".drag-over-workflow").forEach((el) => {
			el.classList.remove("drag-over-workflow");
		});

		const draggedWf = workflows[dragIndex];
		const targetNumber = workflows[dropIndex]?.number;
		if (!draggedWf || draggedWf.number == null || targetNumber == null) {
			setDraggedIndex(null);
			return;
		}

		await reorderWorkflowMutation.mutateAsync({
			workflowId: draggedWf.workflow_id,
			targetNumber,
			stageId,
		});

		setDraggedIndex(null);
	};

	return (
		<>
			{/* Workflows List */}
			<div className="bg-neutral-surface">
				{workflows.map((workflow, index) => (
					<div
						key={workflow.workflow_id}
						className="flex items-center justify-between px-4 py-3 border-b border-[#F1F5F9] hover:bg-[#F8FAFC] transition-colors group cursor-grab active:cursor-grabbing"
						draggable={true}
						onDragStart={(e) => handleDragStart(e, index)}
						onDragEnd={handleDragEnd}
						onDragOver={(e) => handleDragOver(e, index)}
						onDragLeave={handleDragLeave}
						onDrop={(e) => handleDrop(e, index)}
					>
						<div className="flex items-center gap-3 flex-1">
							{/* Drag handle */}
							<svg
								width="8"
								height="12"
								viewBox="0 0 8 12"
								fill="none"
								className="text-[#94A3B8] opacity-40 group-hover:opacity-100 transition-opacity"
							>
								<circle cx="1" cy="1" r="1" fill="currentColor" />
								<circle cx="1" cy="6" r="1" fill="currentColor" />
								<circle cx="1" cy="11" r="1" fill="currentColor" />
								<circle cx="5" cy="1" r="1" fill="currentColor" />
								<circle cx="5" cy="6" r="1" fill="currentColor" />
								<circle cx="5" cy="11" r="1" fill="currentColor" />
							</svg>
							<div>
								<Link
									href={`/projects/${projectId}/workflows/${workflow.workflow_id}`}
									className="font-normal text-sm text-[#0F172A] hover:text-brand-600 transition-colors"
								>
									{workflow.name}
								</Link>
								<p className="text-xs text-[#8392a6] mt-0.5">
									Deadline: {formatDateTime(workflow.deadline_date)}
								</p>
							</div>
						</div>

						<div className="flex items-center gap-4">
							{/* Date Badge */}
							<div className="px-3 py-1 bg-[#ffffff] border border-slate-300 rounded-md">
								<span className="font-medium text-xs text-slate-400">
									{formatDateTime(workflow.start_date)} –{" "}
									{workflow.finish_date
										? formatDateTime(workflow.finish_date)
										: "Unfinished"}
								</span>
							</div>

							{/* Ticket Count */}
							<div className="flex items-center gap-1.5 min-w-[90px]">
								<svg width="12" height="12" viewBox="0 0 12 12" fill="none">
									<path
										d="M6 0L7.5 3.5L11 4L8.5 6.5L9 10L6 8L3 10L3.5 6.5L1 4L4.5 3.5L6 0Z"
										fill="#94A3B8"
									/>
								</svg>
								<span className="text-xs text-neutral-subtle">
									{workflow.ticketCount} Tickets
								</span>
							</div>

							{/* Progress Bar */}
							<div className="flex items-center gap-2 min-w-[140px]">
								{workflow.ticketCount === 0 ? (
									<>
										<div className="w-20 h-1.5 bg-[#F1F5F9] rounded-full" />
										<span className="text-[11px] font-semibold text-[#94A3B8]">
											- %
										</span>
									</>
								) : (
									<>
										<div className="w-20 h-1.5 bg-[#E2E8F0] rounded-full overflow-hidden">
											<div
												className="h-full bg-brand-500 rounded-full transition-all"
												style={{ width: `${workflow.progress}%` }}
											/>
										</div>
										<span className="text-[11px] font-semibold text-[#475569]">
											{workflow.progress}%
										</span>
									</>
								)}
							</div>

							{/* Workflow Actions */}
							<div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
								<button
									onClick={() => openEditWorkflowModal(workflow)}
									title="Edit workflow"
								>
									<svg width="12" height="12" viewBox="0 0 12 12" fill="none">
										<path
											d="M8.5 1.5L10.5 3.5L3.5 10.5L1 11L1.5 8.5L8.5 1.5Z"
											stroke="#94A3B8"
											strokeWidth="1.5"
											strokeLinecap="round"
											strokeLinejoin="round"
										/>
										<path
											d="M7 2.5L9.5 5"
											stroke="#94A3B8"
											strokeWidth="1.5"
											strokeLinecap="round"
										/>
									</svg>
								</button>
								<button
									onClick={() => confirmDelete(workflow)}
									title="Delete workflow"
								>
									<svg width="12" height="12" viewBox="0 0 12 12" fill="none">
										<path
											d="M9 3L3 9M3 3L9 9"
											stroke="#94A3B8"
											strokeWidth="1.5"
											strokeLinecap="round"
										/>
									</svg>
								</button>
							</div>
						</div>
					</div>
				))}

				{/* Add Workflow Button */}
				<button
					onClick={openCreateWorkflowModal}
					className="w-full m-3 py-2 border-2 border-dashed border-brand-100 rounded-lg flex items-center justify-center gap-2 hover:bg-[#F8FAFC] hover:border-brand-500 transition-all"
					style={{ width: "calc(100% - 24px)" }}
				>
					<svg width="12" height="12" viewBox="0 0 12 12" fill="none">
						<path
							d="M6 1V11M1 6H11"
							stroke="#94A3B8"
							strokeWidth="1.5"
							strokeLinecap="round"
						/>
					</svg>
					<span className="text-sm font-medium text-neutral-subtle">
						Add Workflow
					</span>
				</button>
			</div>

			{/* Add Workflow Modal */}
			<AddWorkflow
				isOpen={isAddOpen}
				onClose={() => setIsAddOpen(false)}
				onSubmit={handleAddWorkflow}
			/>

			{/* Edit Workflow Modal */}
			<EditWorkflow
				isOpen={editingWorkflow !== null}
				workflow={editingWorkflow}
				onClose={() => setEditingWorkflow(null)}
				onSave={handleSaveWorkflow}
				onDelete={() => editingWorkflow && confirmDelete(editingWorkflow)}
			/>

			{/* Delete Confirmation Modal */}
			<DeleteWorkflow
				isOpen={isDeleteConfirmOpen}
				workflowLabel={workflowToDelete?.name}
				onConfirm={handleDeleteWorkflow}
				onCancel={() => {
					setIsDeleteConfirmOpen(false);
					setWorkflowToDelete(null);
				}}
			/>
		</>
	);
}
