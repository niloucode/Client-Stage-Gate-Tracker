"use client";

import { useState } from "react";
import type { Module, Phase } from "../types";
import { WorkflowCard } from "./WorkflowCard";
import { AddModule, EditModule } from "@/features/stage-editor/ui/modals/ModuleModals";
import { useDeleteModule } from "@/entities/module/mutations";
import { ConfirmDeleteModal } from "@/shared/ui"
import { Button } from "@/components/ui/button";
import { Plus, Clock, ChevronDown, EllipsisVertical } from "lucide-react";
import { toast } from "@/components/ui/toast"

// --- INLINE DATE LOGIC & HELPERS ---
type WorkflowStatus = "not_started" | "started" | "ended";

const formatDateTime = (date: Date | null | undefined) => {
	if (!date) return "——";
	const d = new Date(date);
	if (isNaN(d.getTime())) return "——";
	return d.toLocaleString("en-US", {
		month: "short",
		day: "numeric",
		year: "numeric",
		hour: "numeric",
		minute: "2-digit",
		hour12: true,
	});
};

function getActualStart(module: Module): Date | null {
	return module.actualStart || module.planStart || null;
}

function getWorkflowStatus(module: Module): WorkflowStatus {
	if (module.actualEnd) return "ended";
	const actualStart = getActualStart(module);
	const now = new Date();
	if (actualStart && new Date(actualStart) <= now) return "started";
	return "not_started";
}

function getStartDelayDays(
	plannedStart: Date | null | undefined,
	actualStart: Date | null | undefined,
): number {
	if (!plannedStart || !actualStart) return 0;
	const diffTime =
		new Date(actualStart).getTime() - new Date(plannedStart).getTime();
	const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
	return diffDays > 0 ? diffDays : 0;
}

function getDeadlineState(
	module: Module,
	status: WorkflowStatus,
): "upcoming" | "approaching" | "overdue" | "on-time" | "late" {
	if (!module.planEnd) return "upcoming";

	const dl = new Date(module.planEnd);

	if (status === "ended") {
		if (!module.actualEnd) return "on-time";
		return new Date(module.actualEnd) > dl ? "late" : "on-time";
	}

	const now = new Date();
	now.setHours(0, 0, 0, 0);
	const dlDate = new Date(dl);
	dlDate.setHours(0, 0, 0, 0);

	const diffTime = dlDate.getTime() - now.getTime();
	const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

	if (diffDays < 0) return "overdue";
	if (diffDays <= 3) return "approaching";
	return "upcoming";
}
// -----------------------------------

interface ModuleCardProps {
	activePhase: number | null;
	phases: Phase[];
	projectId: string;
	stageId: string;
	/** Clients are read-only: hide add/edit/delete controls. */
	readOnly?: boolean;
}

export function ModuleCard({
	activePhase,
	phases,
	projectId,
	stageId,
	readOnly = false,
}: ModuleCardProps) {
	const [isAddOpen, setIsAddOpen] = useState(false);
	const [editingModule, setEditingModule] = useState<Module | null>(null);
	const [expandedModules, setExpandedModules] = useState<Set<string>>(
		new Set(),
	);
	const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
	const [moduleToDelete, setModuleToDelete] = useState<string | null>(null);

	const deleteModuleMutation = useDeleteModule();

	const currentPhase =
		activePhase !== null
			? (phases.find((p) => p.number === activePhase) ?? null)
			: null;
	const modules = currentPhase?.modules || [];

	const openCreateModuleModal = () => {
		if (activePhase === null) return;
		setIsAddOpen(true);
	};

	const openEditModuleModal = (module: Module) => setEditingModule(module);

	const handleEditDeleteClick = () => {
		if (!editingModule) return;
		confirmDelete(editingModule.module_id);
		setEditingModule(null);
	};

	const toggleModule = (moduleId: string) => {
		setExpandedModules((prev) => {
			const isExpanding = !prev.has(moduleId);
			const newSet = new Set(prev);
			if (isExpanding) {
				newSet.add(moduleId);
				// Wait for slide-down animation, then scroll bottom of workflows into view + 140px extra breathing room
				setTimeout(() => {
					const el = document.getElementById(`module-workflows-${moduleId}`);
					if (el) {
						el.scrollIntoView({
							behavior: "smooth",
							block: "end",
						});
						setTimeout(() => {
							const scrollContainer = el.closest(".overflow-y-auto") || window;
							scrollContainer.scrollBy({
								top: 140,
								behavior: "smooth",
							});
						}, 100);
					}
				}, 250);
			} else {
				newSet.delete(moduleId);
			}
			return newSet;
		});
	};

	const confirmDelete = (moduleId: string) => {
		setModuleToDelete(moduleId);
		setIsDeleteConfirmOpen(true);
	};

	const handleDeleteModule = async () => {
		if (!moduleToDelete || activePhase === null) return;
		try {
			await deleteModuleMutation.mutateAsync({
				moduleId: moduleToDelete,
				stageId,
			});

			// delete toast
			toast.add({
				title: "Module Deleted",
				description: `Module has been deleted successfully.`,
				type: "delete",
			});
		} catch (error) {
			toast.add({
				title: "Delete Failed",
				description:
					error instanceof Error
						? error.message
						: "Something went wrong deleting the module.",
				type: "error",
			});
		} finally {
			setIsDeleteConfirmOpen(false);
			setModuleToDelete(null);
		}
	};

	const getDeadlineColorClass = (state: string) => {
		switch (state) {
			case "approaching":
				return "text-amber-500 font-medium";
			case "overdue":
				return "text-red-500 font-bold";
			case "late":
				return "text-red-500 font-bold";
			case "on-time":
				return "text-emerald-500 font-medium";
			default:
				return "text-[#8392a6]";
		}
	};

	return (
		<div className="mx-auto mb-8">
			{/* Header with Add Module button */}
			<div className="flex justify-between items-center mb-4">
				<h3 className="text-2xl font-semibold text-slate-900">Modules</h3>
				{!readOnly && (
					<Button onClick={openCreateModuleModal}>
						<Plus className="mr-2 h-4 w-4" /> Add Module
					</Button>
				)}
			</div>

			{/* Module Cards */}
			<div className="space-y-4">
				{activePhase === null ? (
					<div className="bg-neutral-surface border border-slate-200 rounded-md shadow-sm p-8 text-center">
						<p className="text-sm text-neutral-subtle">No phase selected</p>
						<p className="text-xs text-slate-400 mt-1">
							Select a phase from the stepper above to manage its modules
						</p>
					</div>
				) : modules.length === 0 ? (
					<div className="bg-neutral-surface border border-slate-200 rounded-md shadow-sm p-8 text-center">
						<p className="text-sm text-neutral-subtle">
							No modules yet for this phase.
						</p>
						<p className="text-xs text-slate-400 mt-1">
							Click Add Module to create one.
						</p>
					</div>
				) : (
					modules.map((module) => {
						const isExpanded = expandedModules.has(module.module_id);

						const status = getWorkflowStatus(module);
						const actualStart = getActualStart(module);
						const delayDays = getStartDelayDays(module.planStart, actualStart);
						const deadlineState = getDeadlineState(module, status);
						const deadlineColorClass = getDeadlineColorClass(deadlineState);

						return (
							<div
								id={`module-${module.module_id}`}
								key={module.module_id}
								className="bg-neutral-surface border border-slate-200 rounded-md shadow-sm overflow-hidden"
							>
								{/* Module Header */}
								<div className="flex justify-between items-center px-5 py-4 bg-slate-50 border-b border-slate-200">
									{/* Left Side Block */}
									<div
										className="flex-1 flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
										onClick={() => toggleModule(module.module_id)}
									>
										<ChevronDown
											size={12}
											className={`shrink-0 transform transition-transform text-slate-500 duration-200 ${isExpanded ? "" : "-rotate-90"}`}
										/>
										<div>
											<h4 className="font-semibold text-sm text-slate-900">
												{module.name}
											</h4>
											<div className="flex items-center gap-1 mt-0.5">
												{deadlineState === "approaching" && (
													<Clock className="w-3 h-3 text-amber-500" />
												)}
												<p className={`text-xs ${deadlineColorClass}`}>
													{status === "not_started" && (
														<>Starting: {formatDateTime(module.planStart)}</>
													)}

													{status === "started" && (
														<>
															Started: {formatDateTime(actualStart)}
															{delayDays > 0 && (
																<span className="text-amber-600 ml-1">
																	({delayDays} days late)
																</span>
															)}
														</>
													)}

													{status === "ended" && (
														<>
															Started: {formatDateTime(actualStart)} – Ended:{" "}
															{formatDateTime(module.actualEnd)}
														</>
													)}
												</p>
											</div>
										</div>
									</div>

									<div className="flex items-center gap-3">
										{/* Contextual Date Badge */}
										<div
											className="px-3 py-1.5 bg-[#EEF2FF] border border-[#E0E7FF] rounded-md"
											title={
												status !== "not_started" && module.planStart
													? `Planned Start: ${formatDateTime(module.planStart)}`
													: undefined
											}
										>
											<span className="font-medium text-xs text-slate-600 flex items-center gap-1">
												{deadlineState === "overdue"
													? "Overdue: "
													: "Deadline: "}
												{formatDateTime(module.planEnd)}
												{status === "ended" && (
													<span className="ml-1 opacity-80">
														({deadlineState === "late" ? "Late" : "On-time"})
													</span>
												)}
											</span>
										</div>

										{/* Vertical Divider */}
										<div className="w-px h-5 bg-slate-200 mx-1"></div>

										{/* Edit button */}
										{!readOnly && (
											<button
												onClick={() => openEditModuleModal(module)}
												className="opacity-60 hover:opacity-100 transition-opacity p-1 hover:bg-slate-200 rounded"
												aria-label="Edit module"
											>
												<EllipsisVertical
													size={14}
													className="text-slate-500"
												/>
											</button>
										)}
									</div>
								</div>

								{/* Workflows List with Collapsible Slide Down */}
								<div
									id={`module-workflows-${module.module_id}`}
									className={`grid transition-[grid-template-rows,opacity] duration-300 ease-in-out ${
										isExpanded
											? "grid-rows-[1fr] opacity-100"
											: "grid-rows-[0fr] opacity-0"
									}`}
								>
									<div className="overflow-hidden">
										<WorkflowCard
											workflows={module.workflows}
											moduleId={module.module_id}
											projectId={projectId}
											stageId={stageId}
											readOnly={readOnly}
										/>
									</div>
								</div>
							</div>
						);
					})
				)}
			</div>

			{/* Add Module Modal */}
			<AddModule
				isOpen={isAddOpen}
				activePhase={activePhase}
				stageId={stageId}
				phaseId={currentPhase?.phase_id ?? null}
				onClose={() => setIsAddOpen(false)}
			/>

			{/* Edit Module Modal */}
			<EditModule
				isOpen={editingModule !== null}
				module={editingModule}
				stageId={stageId}
				onClose={() => setEditingModule(null)}
				onDelete={handleEditDeleteClick}
			/>

			{/* Delete Confirmation Modal — shared primitive (Task 5.2) */}
			<ConfirmDeleteModal
				isOpen={isDeleteConfirmOpen}
				noun="Module"
				onConfirm={handleDeleteModule}
				onCancel={() => {
					setIsDeleteConfirmOpen(false);
					setModuleToDelete(null);
				}}
			/>
		</div>
	);
}