"use client";

import { useState } from "react";
import Link from "next/link";
import type { Workflow } from "../types";
import { AddWorkflow, EditWorkflow } from "@/features/stage-editor/ui/modals/WorkflowModals";
import { ConfirmDeleteModal } from "@/shared/ui";
import {
	useDeleteWorkflow,
	useReorderWorkflow,
} from "@/entities/workflow/mutations";
import { toast } from "@/components/ui/toast";

import { Plus, Clock, GripVertical, EllipsisVertical } from "lucide-react";

interface WorkflowCardProps {
	workflows: Workflow[];
	moduleId: string;
	projectId: string;
	stageId: string;
	/** Clients are read-only: hide add/edit/delete controls and drag handles. */
	readOnly?: boolean;
}

/**
 * NOTE ON DATA MODEL
 * ------------------
 * The `Workflow` type exposes the canonical scheduling vocabulary
 * (Task 1.5 / 3.1):
 *   - planStart  -> PLANNED START (PS)
 *   - planEnd    -> PLANNED END (PE) — fixed, never swapped for actualEnd
 *   - actualEnd  -> ACTUAL END (AE), set once the workflow has ended
 *   - actualStart -> ACTUAL START (AS), distinct from the planned one
 */
type WorkflowStatus = "not_started" | "started" | "ended";

type DeadlineState =
	| "upcoming" // > 3 days out, not started/started
	| "approaching" // 1-3 days out, not started/started
	| "overdue" // past deadline, not yet ended
	| "on_time_done" // ended, AE <= PE
	| "late_done"; // ended, AE > PE

const DAY_MS = 1000 * 60 * 60 * 24;

/** Not Started / Started Already / Ended, derived from what dates we actually have. */
function getWorkflowStatus(workflow: Workflow): WorkflowStatus {
	if (workflow.actualEnd) return "ended";
	if (workflow.actualStart) return "started";
	if (workflow.planStart && workflow.planStart.getTime() <= Date.now()) {
		return "started";
	}
	return "not_started";
}

/**
 * Returns the actual start date to display. Falls back to `planStart`
 * (i.e. assumes an on-time start) when the real field isn't populated yet.
 */
function getActualStart(workflow: Workflow): Date | null {
	return workflow.actualStart ?? workflow.planStart ?? null;
}

/** Days late a workflow started, relative to its planned start. Null if not late / not started. */
function getStartDelayDays(workflow: Workflow): number | null {
	const planned = workflow.planStart;
	const actual = getActualStart(workflow);
	if (!planned || !actual) return null;
	const diffDays = Math.round((actual.getTime() - planned.getTime()) / DAY_MS);
	return diffDays > 0 ? diffDays : null;
}

/** Three-state (upcoming/approaching/overdue) while active, or on-time/late once ended. */
function getDeadlineState(
	status: WorkflowStatus,
	deadline: Date | null,
	actualEnd: Date | null,
): DeadlineState {
	if (status === "ended") {
		if (deadline && actualEnd && actualEnd.getTime() > deadline.getTime()) {
			return "late_done";
		}
		return "on_time_done";
	}
	if (!deadline) return "upcoming";
	const daysUntil = (deadline.getTime() - Date.now()) / DAY_MS;
	if (daysUntil < 0) return "overdue";
	if (daysUntil <= 3) return "approaching";
	return "upcoming";
}

const DEADLINE_STYLES: Record<DeadlineState, string> = {
	upcoming: "text-[#8392a6]",
	approaching: "text-amber-600",
	overdue: "text-red-600",
	on_time_done: "text-emerald-600",
	late_done: "text-red-600",
};

export function WorkflowCard({
	workflows,
	moduleId,
	projectId,
	stageId,
	readOnly = false,
}: WorkflowCardProps) {
	const [isAddOpen, setIsAddOpen] = useState(false);
	const [editingWorkflow, setEditingWorkflow] = useState<Workflow | null>(null);
	const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
	const [workflowToDelete, setWorkflowToDelete] = useState<Workflow | null>(
		null,
	);
	const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

	const deleteWorkflowMutation = useDeleteWorkflow();
	const reorderWorkflowMutation = useReorderWorkflow();

	const openCreateWorkflowModal = () => setIsAddOpen(true);
	const openEditWorkflowModal = (workflow: Workflow) =>
		setEditingWorkflow(workflow);

	const formatDateTime = (date: Date | null | undefined) => {
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

	const confirmDelete = (workflow: Workflow) => {
		setWorkflowToDelete(workflow);
		setIsDeleteConfirmOpen(true);
		setEditingWorkflow(null);
	};

	const handleDeleteWorkflow = async () => {
		if (!workflowToDelete) return;
		try {
			await deleteWorkflowMutation.mutateAsync({
				workflowId: workflowToDelete.workflow_id,
				stageId,
			});

			toast.add({
				title: "Workflow Deleted",
				description: `"${workflowToDelete.name}" has been deleted successfully.`,
				type: "delete",
			});
		} catch (error) {
			toast.add({
				title: "Delete Failed",
				description:
					error instanceof Error
						? error.message
						: "Something went wrong deleting the workflow.",
				type: "error",
			});
		} finally {
			setIsDeleteConfirmOpen(false);
			setWorkflowToDelete(null);
		}
	};

	// Drag and Drop Handlers
	const handleDragStart = (e: React.DragEvent, index: number) => {
		if (readOnly) return;
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
		if (readOnly) return;
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
		if (readOnly) return;

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

		try {
			await reorderWorkflowMutation.mutateAsync({
				workflowId: draggedWf.workflow_id,
				targetNumber,
				stageId,
			});
		} catch (error) {
			toast.add({
				title: "Reorder Failed",
				description:
					error instanceof Error
						? error.message
						: "Something went wrong reordering the workflows.",
				type: "error",
			});
		} finally {
			setDraggedIndex(null);
			document.querySelectorAll(".drag-over-workflow").forEach((el) => {
				el.classList.remove("drag-over-workflow");
			});
		}
	};

	return (
		<>
			{/* Workflows List */}
			<div className="bg-neutral-surface">
				{workflows.map((workflow, index) => {
					const wf = workflow;
					const status = getWorkflowStatus(wf);
					const actualStart = getActualStart(wf);
					const startDelayDays = getStartDelayDays(wf);
					const deadlineState = getDeadlineState(
						status,
						wf.planEnd ?? null,
						wf.actualEnd ?? null,
					);

					// --- Start column label + tooltip ---
					let startLabel: React.ReactNode;
					let startTooltip: string | undefined;

					if (status === "not_started") {
						startLabel = `Starting: ${formatDateTime(wf.planStart)}`;
					} else if (status === "started") {
						startLabel = (
							<>
								Started: {formatDateTime(actualStart)}
								{startDelayDays && (
									<span className="text-amber-600 font-medium">
										{" "}
										({startDelayDays}d late)
									</span>
								)}
							</>
						);
						startTooltip = `Planned start: ${formatDateTime(wf.planStart)}`;
					} else {
						startLabel = (
							<>
								Started: {formatDateTime(actualStart)} — Ended:{" "}
								{formatDateTime(wf.actualEnd)}
							</>
						);
						startTooltip = startDelayDays
							? `Planned start: ${formatDateTime(wf.planStart)} (started ${startDelayDays}d late)`
							: `Planned start: ${formatDateTime(wf.planStart)}`;
					}

					// --- Deadline column label ---
					let deadlineSuffix = "";
					if (deadlineState === "approaching") deadlineSuffix = " · DUE SOON";
					if (deadlineState === "overdue") deadlineSuffix = " · OVERDUE";
					if (deadlineState === "on_time_done") deadlineSuffix = " · ON TIME";
					if (deadlineState === "late_done") deadlineSuffix = " · LATE";

					return (
						<div
							key={workflow.workflow_id}
							className="flex items-center justify-between px-4 py-3 border-b border-slate-100 hover:bg-slate-50 transition-colors group cursor-grab active:cursor-grabbing"
							draggable={!readOnly}
							onDragStart={(e) => handleDragStart(e, index)}
							onDragEnd={handleDragEnd}
							onDragOver={(e) => handleDragOver(e, index)}
							onDragLeave={handleDragLeave}
							onDrop={(e) => handleDrop(e, index)}
						>
							<div className="flex items-center gap-3 flex-1">
								{/* Drag handle */}
								<GripVertical
									size={14}
									className="text-slate-400 opacity-40 group-hover:opacity-100 transition-opacity"
								/>
								<div>
									<Link
										href={`/projects/${projectId}/workflows/${workflow.workflow_id}`}
										className="font-light text-sm text-slate-900 hover:text-brand-600 transition-colors"
									>
										{workflow.name}
									</Link>
									{/* Start column: adapts PS -> AS -> AS+AE by status */}
									<p
										className="text-xs text-[#8392a6] mt-0.5 w-fit"
										title={startTooltip}
									>
										{startLabel}
									</p>
								</div>
							</div>

							<div className="flex items-center gap-4">
								{/* Deadline column: always bound to planEnd, never swapped */}
								<div className="flex flex-col items-end gap-0.5">
									<span className="text-[10px] uppercase tracking-wide text-slate-400">
										Deadline
									</span>
									<span
										className={`flex items-center gap-1 text-xs ${DEADLINE_STYLES[deadlineState]}`}
									>
										<Clock size={11} />
										{formatDateTime(wf.planEnd)}
										{deadlineSuffix}
									</span>
								</div>

								{/* Ticket Count */}
								<div className="flex gap-1.5 min-w-[80px]">
									<span className="ml-auto text-xs text-neutral-border">
										{workflow.ticketCount} Tickets
									</span>
								</div>

								{/* Progress Bar */}
								<div className="flex items-center gap-2 min-w-[100px]">
									{workflow.ticketCount === 0 ? (
										<>
											<div className="w-20 h-1.5 bg-slate-100 rounded-full" />
											<span className="text-[11px] font-semibold text-slate-400">
												- %
											</span>
										</>
									) : (
										<>
											<div className="w-20 h-1.5 bg-slate-200 rounded-full overflow-hidden">
												<div
													className="h-full bg-brand-500 rounded-full transition-all"
													style={{ width: `${workflow.progress}%` }}
												/>
											</div>
											<span className="text-[11px] font-semibold text-slate-600">
												{workflow.progress}%
											</span>
										</>
									)}
								</div>

								{/* Workflow Actions — edit hidden when completed (Task 5.7) */}
								<div className="flex items-center gap-2 opacity-50 group-hover:opacity-100 transition-opacity">
									{!readOnly &&
										getWorkflowStatus(workflow) !== "ended" && (
											<button
												onClick={() => openEditWorkflowModal(workflow)}
												className="opacity-60 hover:opacity-100 transition-opacity p-1 hover:bg-slate-200 rounded"
												aria-label="Edit workflow"
											>
												<EllipsisVertical
													size={14}
													className="text-slate-500"
												/>
											</button>
										)}
								</div>
							</div>
						</div>
					);
				})}

				{/* Add Workflow Button */}
				{!readOnly && (
					<button
						onClick={openCreateWorkflowModal}
						className="w-full m-3 py-2 border-2 border-dashed border-brand-100 rounded-lg flex items-center justify-center gap-2 hover:bg-slate-50 hover:border-brand-500 transition-all"
						style={{ width: "calc(100% - 24px)" }}
					>
						<Plus size={16} className={"text-brand-200"} />
						<span className="text-sm font-medium text-neutral-border">
							Add Workflow
						</span>
					</button>
				)}
			</div>

			{/* Add Workflow Modal */}
			<AddWorkflow
				isOpen={isAddOpen}
				moduleId={moduleId}
				stageId={stageId}
				onClose={() => setIsAddOpen(false)}
			/>

			{/* Edit Workflow Modal */}
			<EditWorkflow
				isOpen={editingWorkflow !== null}
				workflow={editingWorkflow}
				moduleId={moduleId}
				stageId={stageId}
				onClose={() => setEditingWorkflow(null)}
				onDelete={() => editingWorkflow && confirmDelete(editingWorkflow)}
			/>

			{/* Delete Confirmation Modal */}
			<ConfirmDeleteModal
				isOpen={isDeleteConfirmOpen}
				noun="Workflow"
				title={
					workflowToDelete ? `Delete ${workflowToDelete.name}` : undefined
				}
				onConfirm={handleDeleteWorkflow}
				onCancel={() => {
					setIsDeleteConfirmOpen(false);
					setWorkflowToDelete(null);
				}}
			/>
		</>
	);
}