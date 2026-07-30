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

import { Pencil, X, Plus, Clock } from "lucide-react";

interface WorkflowsListProps {
	workflows: Workflow[];
	moduleId: string;
	projectId: string;
	stageId: string;
}

/**
 * NOTE ON DATA MODEL
 * ------------------
 * The `Workflow` type as currently defined only exposes:
 *   - start_date     -> treated here as PLANNED START (PS)
 *   - deadline_date   -> PLANNED END (PE) — this is fixed, never swapped for actual_end
 *   - finish_date     -> ACTUAL END (AE), set once the workflow has ended
 *
 * It does NOT yet expose an ACTUAL START (AS) distinct from the planned one.
 * Until the backend adds `actual_start_date`, we extend the type locally and
 * fall back to dummy/derived data so the UI logic can be reviewed end-to-end.
 * Swap `getActualStart` for a real field read as soon as it exists on the API.
 */
type WorkflowWithActuals = Workflow & {
	/** Real actual-start timestamp, once the backend supports it */
	actual_start_date?: Date | null;
};

type WorkflowStatus = "not_started" | "started" | "ended";

type DeadlineState =
	| "upcoming" // > 3 days out, not started/started
	| "approaching" // 1-3 days out, not started/started
	| "overdue" // past deadline, not yet ended
	| "on_time_done" // ended, AE <= PE
	| "late_done"; // ended, AE > PE

const DAY_MS = 1000 * 60 * 60 * 24;

/** Not Started / Started Already / Ended, derived from what dates we actually have. */
function getWorkflowStatus(workflow: WorkflowWithActuals): WorkflowStatus {
	if (workflow.finish_date) return "ended";
	if (workflow.actual_start_date) return "started";
	if (workflow.start_date && workflow.start_date.getTime() <= Date.now()) {
		return "started";
	}
	return "not_started";
}

/**
 * DUMMY DATA HELPER
 * Returns the actual start date to display. Falls back to `start_date`
 * (i.e. assumes an on-time start) when the real field isn't populated yet.
 * Replace with a direct field read once `actual_start_date` exists on Workflow.
 */
function getActualStart(workflow: WorkflowWithActuals): Date | null {
	return workflow.actual_start_date ?? workflow.start_date ?? null;
}

/** Days late a workflow started, relative to its planned start. Null if not late / not started. */
function getStartDelayDays(workflow: WorkflowWithActuals): number | null {
	const planned = workflow.start_date;
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
	overdue: "text-red-600 font-medium",
	on_time_done: "text-emerald-600",
	late_done: "text-red-600",
};

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
				{workflows.map((workflow, index) => {
					const wf = workflow as WorkflowWithActuals;
					const status = getWorkflowStatus(wf);
					const actualStart = getActualStart(wf);
					const startDelayDays = getStartDelayDays(wf);
					const deadlineState = getDeadlineState(
						status,
						wf.deadline_date ?? null,
						wf.finish_date ?? null,
					);

					// --- Start column label + tooltip ---
					let startLabel: React.ReactNode;
					let startTooltip: string | undefined;

					if (status === "not_started") {
						startLabel = `Starting: ${formatDateTime(wf.start_date)}`;
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
						startTooltip = `Planned start: ${formatDateTime(wf.start_date)}`;
					} else {
						startLabel = (
							<>
								Started: {formatDateTime(actualStart)} — Ended:{" "}
								{formatDateTime(wf.finish_date)}
							</>
						);
						startTooltip = startDelayDays
							? `Planned start: ${formatDateTime(wf.start_date)} (started ${startDelayDays}d late)`
							: `Planned start: ${formatDateTime(wf.start_date)}`;
					}

					// --- Deadline column label ---
					let deadlineSuffix = "";
					if (deadlineState === "approaching") deadlineSuffix = " · due soon";
					if (deadlineState === "overdue") deadlineSuffix = " · overdue";
					if (deadlineState === "on_time_done") deadlineSuffix = " · on time";
					if (deadlineState === "late_done") deadlineSuffix = " · late";

					return (
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
								{/* Deadline column: always bound to planned_end (deadline_date), never swapped */}
								<div className="flex flex-col items-end gap-0.5">
									<span className="text-[10px] uppercase tracking-wide text-[#94A3B8]">
										Deadline
									</span>
									<span
										className={`flex items-center gap-1 text-xs ${DEADLINE_STYLES[deadlineState]}`}
									>
										<Clock size={11} />
										{formatDateTime(wf.deadline_date)}
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
								<div className="flex items-center gap-2 opacity-50 group-hover:opacity-100 transition-opacity">
									<button
										onClick={() => openEditWorkflowModal(workflow)}
										title="Edit workflow"
									>
										<Pencil size={12} className={"text-neutral-border"} />
									</button>
									<button
										onClick={() => confirmDelete(workflow)}
										title="Delete workflow"
									>
										<X size={12} className={"text-neutral-border"} />
									</button>
								</div>
							</div>
						</div>
					);
				})}

				{/* Add Workflow Button */}
				<button
					onClick={openCreateWorkflowModal}
					className="w-full m-3 py-2 border-2 border-dashed border-brand-100 rounded-lg flex items-center justify-center gap-2 hover:bg-[#F8FAFC] hover:border-brand-500 transition-all"
					style={{ width: "calc(100% - 24px)" }}
				>
					<Plus size={16} className={"text-brand-200"} />
					<span className="text-sm font-medium text-neutral-border">
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
