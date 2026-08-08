"use client";

import { useState } from "react";
import type { Module, Phase } from "../types";
import { WorkflowsList } from "./WorkflowsList";
import { AddModule } from "@/features/stage-editor/ui/modals/AddModule";
import { EditModule } from "@/features/stage-editor/ui/modals/EditModule";
import {
	useCreateModule,
	useUpdateModule,
	useDeleteModule,
} from "@/entities/module/mutations";
import { Button } from "@/components/ui/button";
import { Plus, Clock } from "lucide-react";

// --- INLINE DATE LOGIC & HELPERS ---
type WorkflowStatus = "not_started" | "started" | "ended";

const formatDateTime = (date: Date | null | undefined) => {
	if (!date) return "——";
	return new Date(date).toLocaleString("en-US", {
		month: "short",
		day: "numeric",
		year: "numeric",
		hour: "numeric",
		minute: "2-digit",
		hour12: true,
	});
};

function getActualStart(module: any): Date | null {
	return module.actual_start_date || module.start_date || null;
}

function getWorkflowStatus(module: any): WorkflowStatus {
	if (module.finish_date) return "ended";
	const actualStart = getActualStart(module);
	const now = new Date();
	if (actualStart && new Date(actualStart) <= now) return "started";
	return "not_started";
}

function getStartDelayDays(plannedStart: Date | null | undefined, actualStart: Date | null | undefined): number {
	if (!plannedStart || !actualStart) return 0;
	const diffTime = new Date(actualStart).getTime() - new Date(plannedStart).getTime();
	const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
	return diffDays > 0 ? diffDays : 0;
}

function getDeadlineState(
	module: any,
	status: WorkflowStatus
): "upcoming" | "approaching" | "overdue" | "on-time" | "late" {
	if (!module.deadline_date) return "upcoming";
	
	const dl = new Date(module.deadline_date);
	
	if (status === "ended") {
		if (!module.finish_date) return "on-time";
		return new Date(module.finish_date) > dl ? "late" : "on-time";
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

interface ModulesCardProps {
	activePhase: number | null;
	phases: Phase[];
	projectId: string;
	stageId: string;
}

export function ModulesCard({
	activePhase,
	phases,
	projectId,
	stageId,
}: ModulesCardProps) {
	const [isAddOpen, setIsAddOpen] = useState(false);
	const [editingModule, setEditingModule] = useState<Module | null>(null);
	const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());
	const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
	const [moduleToDelete, setModuleToDelete] = useState<string | null>(null);

	const createModuleMutation = useCreateModule();
	const updateModuleMutation = useUpdateModule();
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

	const handleAddModule = async (data: {
		name: string;
		start_date: Date | null;
		deadline_date: Date | null;
		finish_date: Date | null;
	}) => {
		if (activePhase === null || !currentPhase) return;
		await createModuleMutation.mutateAsync({
			phaseId: currentPhase.phase_id,
			stageId,
			name: data.name,
			start_date: data.start_date ?? undefined,
			deadline_date: data.deadline_date ?? undefined,
			finish_date: data.finish_date ?? undefined,
		});
		setIsAddOpen(false);
	};

	const handleSaveModule = async (data: {
		name: string;
		start_date: Date | null;
		deadline_date: Date | null;
		finish_date: Date | null;
	}) => {
		if (!editingModule) return;
		await updateModuleMutation.mutateAsync({
			moduleId: editingModule.module_id,
			stageId,
			name: data.name,
			start_date: data.start_date ?? undefined,
			deadline_date: data.deadline_date ?? undefined,
			finish_date: data.finish_date ?? undefined,
		});
		setEditingModule(null);
	};

	const handleEditDeleteClick = () => {
		if (!editingModule) return;
		confirmDelete(editingModule.module_id);
		setEditingModule(null);
	};

	const toggleModule = (moduleId: string) => {
		setExpandedModules((prev) => {
			const newSet = new Set(prev);
			if (newSet.has(moduleId)) {
				newSet.delete(moduleId);
			} else {
				newSet.add(moduleId);
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
		await deleteModuleMutation.mutateAsync({
			moduleId: moduleToDelete,
			stageId,
		});
		setIsDeleteConfirmOpen(false);
		setModuleToDelete(null);
	};

	const getDeadlineColorClass = (state: string) => {
		switch (state) {
			case 'approaching': return 'text-amber-500 font-medium';
			case 'overdue': return 'text-red-500 font-bold';
			case 'late': return 'text-red-500 font-bold';
			case 'on-time': return 'text-emerald-500 font-medium';
			default: return 'text-[#8392a6]';
		}
	};

	return (
		<div className="mx-auto mb-8">
			{/* Header with Add Module button */}
			<div className="flex justify-between items-center mb-4">
				<h3 className="text-2xl font-semibold text-slate-900">
					Modules
				</h3>
				<Button onClick={openCreateModuleModal}>
					<Plus className="mr-2 h-4 w-4" /> Add Module
				</Button>
			</div>

			{/* Module Cards */}
			<div className="space-y-4">
				{activePhase === null ? (
					<div className="bg-neutral-surface border border-slate-200 rounded-xl shadow-sm p-8 text-center">
						<p className="text-sm text-neutral-subtle">No phase selected</p>
						<p className="text-xs text-slate-400 mt-1">
							Select a phase from the stepper above to manage its modules
						</p>
					</div>
				) : modules.length === 0 ? (
					<div className="bg-neutral-surface border border-slate-200 rounded-xl shadow-sm p-8 text-center">
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
						
						// Contextual logic driven by inline helpers
						const status = getWorkflowStatus(module); 
						const actualStart = getActualStart(module);
						const delayDays = getStartDelayDays(module.start_date, actualStart);
						const deadlineState = getDeadlineState(module, status);
						const deadlineColorClass = getDeadlineColorClass(deadlineState);

						return (
							<div
								key={module.module_id}
								className="bg-neutral-surface border border-slate-200 rounded-xl shadow-sm overflow-hidden"
							>
								{/* Module Header */}
								<div className="flex justify-between items-center px-5 py-4 bg-slate-50 border-b border-slate-200">
									{/* Left Side Block */}
									<div
										className="flex-1 flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
										onClick={() => toggleModule(module.module_id)}
									>
										<svg
											width="12"
											height="8"
											viewBox="0 0 12 8"
											fill="none"
											className={`flex-shrink-0 transform transition-transform ${isExpanded ? "" : "-rotate-90"}`}
										>
											<path
												d="M1 1L6 6L11 1"
												stroke="#64748B"
												strokeWidth="1.5"
												strokeLinecap="round"
											/>
										</svg>
										<div>
											<h4 className="font-semibold text-sm text-slate-900">
												{module.name}
											</h4>
											<div className="flex items-center gap-1 mt-0.5">
												{deadlineState === 'approaching' && <Clock className="w-3 h-3 text-amber-500" />}
												<p className={`text-xs ${deadlineColorClass}`}>
												{status === 'not_started' && (
													<>Starting: {formatDateTime(module.start_date)}</>
												)}
												
												{status === 'started' && (
													<>
														Started: {formatDateTime(actualStart)} 
														{delayDays > 0 && <span className="text-amber-600 ml-1">({delayDays} days late)</span>}
													</>
												)}

												{status === 'ended' && (
													<>
														Started: {formatDateTime(actualStart)} – Ended: {formatDateTime(module.finish_date)}
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
											title={status !== 'not_started' && module.start_date ? `Planned Start: ${formatDateTime(module.start_date)}` : undefined}
										>
											<span className="font-medium text-xs text-slate-600 flex items-center gap-1">
												{deadlineState === 'overdue' ? 'Overdue: ' : 'Deadline: '} 
													{formatDateTime(module.deadline_date)}
													{status === 'ended' && (
														<span className="ml-1 opacity-80">
															({deadlineState === 'late' ? 'Late' : 'On-time'})
														</span>
													)}
											</span>
										</div>

										{/* Vertical Divider */}
										<div className="w-px h-5 bg-slate-200 mx-1"></div>

										{/* Edit button */}
										<button
											onClick={() => openEditModuleModal(module)}
											className="opacity-60 hover:opacity-100 transition-opacity p-1 hover:bg-slate-200 rounded"
										>
											<svg
												width="14"
												height="14"
												viewBox="0 0 14 14"
												fill="none"
											>
												<circle cx="7" cy="7" r="1.75" fill="#64748B" />
												<circle cx="7" cy="2.4" r="1.75" fill="#64748B" />
												<circle cx="7" cy="11.6" r="1.75" fill="#64748B" />
											</svg>
										</button>
									</div>
								</div>

								{/* Workflows List */}
								{isExpanded && (
									<WorkflowsList
										workflows={module.workflows}
										moduleId={module.module_id}
										projectId={projectId}
										stageId={stageId}
									/>
								)}
							</div>
						);
					})
				)}
			</div>

			{/* Add Module Modal */}
			<AddModule
				isOpen={isAddOpen}
				activePhase={activePhase}
				onClose={() => setIsAddOpen(false)}
				onSubmit={handleAddModule}
			/>

			{/* Edit Module Modal */}
			<EditModule
				isOpen={editingModule !== null}
				module={editingModule}
				onClose={() => setEditingModule(null)}
				onSave={handleSaveModule}
				onDelete={handleEditDeleteClick}
			/>

			{/* Delete Confirmation Modal */}
			{isDeleteConfirmOpen && (
				<div className="fixed inset-0 bg-foregroundal-main/50 flex items-center justify-center z-50">
					<div className="bg-neutral-surface rounded-xl shadow-xl w-full max-w-sm p-6 relative">
						<h2 className="text-xl font-bold text-slate-900 mb-2">
							Delete Module
						</h2>
						<p className="text-sm text-neutral-subtle mb-6">
							Are you sure you want to delete this module? This action cannot be
							undone.
						</p>

						<div className="flex justify-end gap-3">
							<button
								onClick={() => {
									setIsDeleteConfirmOpen(false);
									setModuleToDelete(null);
								}}
								className="px-4 py-2 text-sm font-semibold text-neutral-subtle hover:text-slate-900 transition-colors"
							>
								Cancel
							</button>
							<button
								onClick={handleDeleteModule}
								className="px-4 py-2 bg-red-500 text-neutral-surface text-sm font-semibold rounded-lg hover:bg-red-600 transition-all shadow-sm"
							>
								Delete Module
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}