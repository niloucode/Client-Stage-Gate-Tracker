"use client";

import { useState } from "react";
import type { Module, Phase, Workflow } from "../types";
import { WorkflowsList } from "./WorkflowsList";
import { AddModule } from "@/features/stage-editor/ui/modals/AddModule";
import { EditModule } from "@/features/stage-editor/ui/modals/EditModule";
import {
	useCreateModule,
	useUpdateModule,
	useDeleteModule,
} from "@/entities/module/mutations";

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
	const [expandedModules, setExpandedModules] = useState<Set<string>>(
		new Set(),
	);
	const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
	const [moduleToDelete, setModuleToDelete] = useState<string | null>(null);

	const createModuleMutation = useCreateModule();
	const updateModuleMutation = useUpdateModule();
	const deleteModuleMutation = useDeleteModule();

	// Get modules for the current active phase
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

	return (
		<div className="mb-8">
			{/* Header with Add Module button */}
			<div className="flex justify-between items-center mb-4">
				<h3 className="text-sm font-semibold text-[#0F172A]">
					Modules {currentPhase && `(Phase ${activePhase})`}
				</h3>
				<button
					onClick={openCreateModuleModal}
					disabled={activePhase === null}
					className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold rounded-lg transition-all shadow-sm ${
						activePhase === null
							? "bg-[#E2E8F0] text-[#94A3B8] cursor-not-allowed"
							: "bg-brand-500 text-neutral-surface hover:bg-[#4338CA]"
					}`}
				>
					<svg width="14" height="14" viewBox="0 0 14 14" fill="none">
						<path
							d="M7 2V12M2 7H12"
							stroke={activePhase === null ? "#94A3B8" : "neutral-surface"}
							strokeWidth="1.5"
							strokeLinecap="round"
						/>
					</svg>
					Add Module
				</button>
			</div>

			{/* Module Cards */}
			<div className="space-y-4">
				{activePhase === null ? (
					<div className="bg-neutral-surface border border-[#E2E8F0] rounded-xl shadow-sm p-8 text-center">
						<p className="text-sm text-neutral-subtle">No phase selected</p>
						<p className="text-xs text-[#94A3B8] mt-1">
							Select a phase from the stepper above to manage its modules
						</p>
					</div>
				) : modules.length === 0 ? (
					<div className="bg-neutral-surface border border-[#E2E8F0] rounded-xl shadow-sm p-8 text-center">
						<p className="text-sm text-neutral-subtle">
							No modules yet for this phase.
						</p>
						<p className="text-xs text-[#94A3B8] mt-1">
							Click Add Module to create one.
						</p>
					</div>
				) : (
					modules.map((module) => {
						const isExpanded = expandedModules.has(module.module_id);

						return (
							<div
								key={module.module_id}
								className="bg-neutral-surface border border-[#E2E8F0] rounded-xl shadow-sm overflow-hidden"
							>
								{/* Module Header */}
								<div className="flex justify-between items-center px-5 py-4 bg-[#F8FAFC] border-b border-[#E2E8F0]">
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
											<h4 className="font-semibold text-sm text-[#0F172A]">
												{module.name}
											</h4>
											<p className="text-xs text-[#8392a6] mt-0.5">
												Deadline: {formatDateTime(module.deadline_date)}
											</p>
										</div>
									</div>

									<div className="flex items-center gap-3">
										{/* Date Badge */}
										<div className="px-3 py-1 bg-[#EEF2FF] border border-[#E0E7FF] rounded-md">
											<span className="font-medium text-xs text-slate-400">
												{formatDateTime(module.start_date)} –{" "}
												{module.finish_date
													? formatDateTime(module.finish_date)
													: "Unfinished"}
											</span>
										</div>

										{/* Vertical Divider */}
										<div className="w-px h-5 bg-[#E2E8F0] mx-1"></div>

										{/* Edit button */}
										<button
											onClick={() => openEditModuleModal(module)}
											className="opacity-60 hover:opacity-100 transition-opacity p-1 hover:bg-[#E2E8F0] rounded"
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
						<h2 className="text-xl font-bold text-[#0F172A] mb-2">
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
								className="px-4 py-2 text-sm font-semibold text-neutral-subtle hover:text-[#0F172A] transition-colors"
							>
								Cancel
							</button>
							<button
								onClick={handleDeleteModule}
								className="px-4 py-2 bg-[#EF4444] text-neutral-surface text-sm font-semibold rounded-lg hover:bg-[#DC2626] transition-all shadow-sm"
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
