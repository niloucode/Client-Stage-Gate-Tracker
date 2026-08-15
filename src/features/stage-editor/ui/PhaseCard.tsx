"use client";

import {
	forwardRef,
	useImperativeHandle,
	useState,
	useRef,
	useEffect,
} from "react";
import type { Phase } from "../types";
import { ConfirmDeleteModal } from "@/shared/ui";
import { AddPhase, EditPhase } from "@/features/stage-editor/ui/modals/PhaseModals";
import {
	useDeletePhase,
	useReorderPhase,
} from "@/entities/phase/mutations";
import { toast } from "@/components/ui/toast";
import {
	Pencil,
	X,
	ChevronLeft,
	ChevronRight,
} from "lucide-react";

interface PhaseCardProps {
	phases: Phase[];
	stageId: string;
	activePhase: number | null;
	setActivePhase: (phase: number | null) => void;
	/** Clients are read-only: hide edit/delete controls and drag handles. */
	readOnly?: boolean;
}

export const PhaseCard = forwardRef<
	{ openCreateModal: () => void },
	PhaseCardProps
>(({ phases, stageId, activePhase, setActivePhase, readOnly = false }, ref) => {
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [phaseToEdit, setPhaseToEdit] = useState<Phase | null>(null);
	const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
	const [phaseToDelete, setPhaseToDelete] = useState<number | null>(null);
	const [showLeftArrow, setShowLeftArrow] = useState(false);
	const [showRightArrow, setShowRightArrow] = useState(true);
	const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
	const scrollContainerRef = useRef<HTMLDivElement>(null);

	const deletePhaseMutation = useDeletePhase();
	const reorderPhaseMutation = useReorderPhase();

	useImperativeHandle(ref, () => ({
		openCreateModal: () => {
			setPhaseToEdit(null);
			setIsModalOpen(true);
		},
	}));

	const checkScroll = () => {
		const container = scrollContainerRef.current;
		if (!container) return;

		const { scrollLeft, scrollWidth, clientWidth } = container;
		setShowLeftArrow(scrollLeft > 10);
		setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 10);
	};

	useEffect(() => {
		checkScroll();
		window.addEventListener("resize", checkScroll);
		return () => window.removeEventListener("resize", checkScroll);
	}, [phases]);

	const scroll = (direction: "left" | "right") => {
		const container = scrollContainerRef.current;
		if (!container) return;

		const scrollAmount = container.clientWidth * 0.6;
		container.scrollBy({
			left: direction === "left" ? -scrollAmount : scrollAmount,
			behavior: "smooth",
		});
	};

	const openEditModal = (phase: Phase) => {
		setPhaseToEdit(phase);
		setIsModalOpen(true);
	};

	const confirmDelete = (phaseNumber: number) => {
		setPhaseToDelete(phaseNumber);
		setIsDeleteConfirmOpen(true);
	};

	const closeDeleteModal = () => {
		setIsDeleteConfirmOpen(false);
		setPhaseToDelete(null);
	};

	const handleDeletePhase = async () => {
		if (phaseToDelete === null) return;
		const phase = phases.find((p) => p.number === phaseToDelete);
		if (!phase) return;

		try {
			await deletePhaseMutation.mutateAsync({
				phaseId: phase.phase_id,
				stageId,
			});

			toast.add({
				title: "Phase Deleted",
				description: `"${phase.name}" has been deleted successfully.`,
				type: "delete",
			});

			if (activePhase === phaseToDelete) {
				setActivePhase(null);
			} else if (activePhase !== null && activePhase > phaseToDelete) {
				setActivePhase(activePhase - 1);
			}
		} catch (error) {
			toast.add({
				title: "Delete Failed",
				description:
					error instanceof Error
						? error.message
						: "Something went wrong deleting the phase.",
				type: "error",
			});
		} finally {
			setIsDeleteConfirmOpen(false);
			setPhaseToDelete(null);
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
		document.querySelectorAll(".drag-over").forEach((el) => {
			el.classList.remove("drag-over");
		});
	};

	const handleDragOver = (e: React.DragEvent, index: number) => {
		e.preventDefault();
		if (readOnly) return;
		e.dataTransfer.dropEffect = "move";

		if (draggedIndex === null || draggedIndex === index) return;

		document.querySelectorAll(".drag-over").forEach((el) => {
			el.classList.remove("drag-over");
		});

		const target = e.currentTarget as HTMLElement;
		target.classList.add("drag-over");
	};

	const handleDragLeave = (e: React.DragEvent) => {
		(e.currentTarget as HTMLElement).classList.remove("drag-over");
	};

	const handleDrop = async (e: React.DragEvent, dropIndex: number) => {
		e.preventDefault();
		if (readOnly) return;

		const dragIndex = draggedIndex;
		if (dragIndex === null || dragIndex === dropIndex) {
			setDraggedIndex(null);
			return;
		}

		document.querySelectorAll(".drag-over").forEach((el) => {
			el.classList.remove("drag-over");
		});

		const draggedPhase = phases[dragIndex];
		const targetNumber = phases[dropIndex]?.number;
		if (!draggedPhase || draggedPhase.number == null || targetNumber == null) {
			setDraggedIndex(null);
			return;
		}

		try {
			await reorderPhaseMutation.mutateAsync({
				phaseId: draggedPhase.phase_id,
				targetNumber,
				stageId,
			});
		} catch (error) {
			toast.add({
				title: "Reorder Failed",
				description:
					error instanceof Error
						? error.message
						: "Something went wrong reordering the phases.",
				type: "error",
			});
		} finally {
			setDraggedIndex(null);
			document.querySelectorAll(".drag-over").forEach((el) => {
				el.classList.remove("drag-over");
			});
		}
	};

	// Find the current active phase to populate the details section
	const currentPhase = phases.find((p) => p.number === activePhase);

	return (
		<>
			<div className="relative bg-neutral-surface border border-slate-200 rounded-md shadow-sm mb-8">
				<div className="px-8 py-6 relative">
					{/* Empty State */}
					{phases.length === 0 ? (
						<div className="flex flex-col items-center justify-center py-6 text-center">
							<p className="text-sm text-neutral-subtle">No phases yet</p>
							<p className="text-xs text-slate-400 mt-1">
								Click Add Phase to create your first phase
							</p>
						</div>
					) : (
						<>
							{/* Left Scroll Arrow */}
							{showLeftArrow && (
								<button
									onClick={() => scroll("left")}
									className="absolute left-2 top-1/2 -translate-y-1/2 z-20 w-8 h-8 bg-neutral-surface border border-slate-200 rounded-full shadow-md hover:bg-slate-50 hover:border-brand-500 transition-all flex items-center justify-center"
								>
									<ChevronLeft
										size={16}
										strokeWidth={2}
										className="text-slate-500"
									/>
								</button>
							)}

							{/* Right Scroll Arrow */}
							{showRightArrow && (
								<button
									onClick={() => scroll("right")}
									className="absolute right-2 top-1/2 -translate-y-1/2 z-20 w-8 h-8 bg-neutral-surface border border-slate-200 rounded-full shadow-md hover:bg-slate-50 hover:border-brand-500 transition-all flex items-center justify-center"
								>
									<ChevronRight
										size={16}
										strokeWidth={2}
										className="text-slate-500"
									/>
								</button>
							)}

							{/* Scrollable Container */}
							<div
								ref={scrollContainerRef}
								onScroll={checkScroll}
								className="relative z-10 overflow-x-auto scroll-smooth hide-scrollbar p-1"
								style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
							>
								{/* Dynamic Width Container */}
								<div
									className="relative flex items-start justify-between pt-3 pb-3 px-8 transition-all duration-300"
									style={{
										minWidth: phases.length > 5 ? `${phases.length * 160}px` : "100%",
										width: "100%",
									}}
								>
									{/* Connecting Line through Node Centers */}
									<div className="z-0 absolute left-14 right-14 top-9 h-0.5 bg-brand-100 pointer-events-none" />

									{phases.map((phase, index) => {
										const num = phase.number ?? 0;
										const isActive = phase.number === activePhase;
										const isCompleted = activePhase !== null && num < activePhase;

										return (
											<div
												key={phase.phase_id}
												className="relative flex flex-col items-center shrink-0 w-12 transition-all duration-200 cursor-grab active:cursor-grabbing"
												draggable={!readOnly}
												onDragStart={(e) => handleDragStart(e, index)}
												onDragEnd={handleDragEnd}
												onDragOver={(e) => handleDragOver(e, index)}
												onDragLeave={handleDragLeave}
												onDrop={(e) => handleDrop(e, index)}
											>
												{/* Node Circle & Action Buttons */}
												<div className="relative z-10 flex flex-col items-center group">
													<button
														onClick={() =>
															phase.number !== null && setActivePhase(phase.number)
														}
													>
														{/* Node Circle — Styled to match ProjectStructure circle design */}
														<div
															className={`
																relative flex h-12 w-12 items-center justify-center rounded-full text-sm font-bold transition-all shadow-xs
																${
																	isActive
																		? "border-4 border-brand-100 bg-brand-600 text-white"
																		: isCompleted
																			? "border-4 border-brand-100 bg-brand-500 text-white group-hover:bg-brand-600"
																			: "border-4 border-brand-100 bg-neutral-surface text-brand-600 group-hover:bg-brand-50"
																}
															`}
														>
															<span>{phase.number ?? ""}</span>
														</div>
													</button>

													{/* Edit Button on Group Hover */}
													{!readOnly && (
														<button
															onClick={() => openEditModal(phase)}
															className="flex items-center justify-center h-4 w-4 absolute -top-1 -left-1 opacity-0 group-hover:opacity-100 bg-background border border-slate-200 shadow-xs rounded-full transition-all hover:scale-110 z-20"
															title="Edit phase"
															aria-label={`Edit phase ${phase.number ?? ""}`}
														>
															<Pencil size={12} strokeWidth={3} />
														</button>
													)}

													{/* Delete Button on Group Hover */}
													{!readOnly && (
														<button
															onClick={() =>
																phase.number !== null && confirmDelete(phase.number)
															}
															className="flex items-center justify-center h-4 w-4 absolute -top-1 -right-1 opacity-0 group-hover:opacity-100 bg-background border border-slate-200 shadow-xs rounded-full transition-all hover:scale-110 z-20"
															title="Delete phase"
															aria-label={`Delete phase ${phase.number ?? ""}`}
														>
															<X size={12} strokeWidth={3} />
														</button>
													)}
												</div>

												{/* Phase Labels */}
												<div className="mt-2.5 flex flex-col items-center text-center w-28 -ml-8 -mr-8 pointer-events-none">
													<div
														className={`
															text-xs font-semibold tracking-wide truncate w-full pointer-events-auto
															${isActive ? "text-brand-600" : "text-neutral-muted"}
														`}
														title={phase.name}
													>
														{phase.name}
													</div>

													{/* Clean 2-Line Dates Display */}
													{phase.planStart && phase.planEnd && (
														<div className="text-[10px] text-muted-foreground mt-1 flex flex-col gap-0.5 w-full pointer-events-auto">
															<span className="truncate">
																{new Date(phase.planStart).toLocaleDateString("en-US", {
																	month: "short",
																	day: "numeric",
																})}{" "}
																–{" "}
																{new Date(phase.planEnd).toLocaleDateString("en-US", {
																	month: "short",
																	day: "numeric",
																})}
															</span>
															{(phase.actualStart || phase.actualEnd) && (
																<span className="text-neutral-400 truncate">
																	Act:{" "}
																	{new Date(
																		phase.actualStart ?? phase.planStart,
																	).toLocaleDateString("en-US", {
																		month: "short",
																		day: "numeric",
																	})}
																	–
																	{new Date(
																		phase.actualEnd ?? phase.planEnd,
																	).toLocaleDateString("en-US", {
																		month: "short",
																		day: "numeric",
																	})}
																</span>
															)}
														</div>
													)}
												</div>
											</div>
										);
									})}
								</div>
							</div>
						</>
					)}
				</div>

				{/* Phase Details Section */}
				{currentPhase && (
					<div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 p-6 border-t border-slate-200 bg-neutral-surface rounded-b-xl">
						{/* Left: Circle Badge + Phase Title & Description */}
						<div className="flex flex-col flex-1 min-w-0">
							<div className="flex items-center gap-3">
								<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-4 border-brand-100 text-base font-bold text-brand-600 bg-neutral-surface shadow-xs">
									{currentPhase.number ?? "—"}
								</div>
								<h2 className="text-xl font-bold tracking-tight text-charcoal sm:text-2xl truncate">
									{currentPhase.name}
								</h2>
							</div>
							<p className="mt-2 text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap pl-13">
								{currentPhase.description || "No description provided."}
							</p>
						</div>

						{/* Right: Clean 2-Group / 1-Row Planned vs Actual Date Viewer */}
						<div className="flex flex-wrap items-center gap-6 rounded-md border border-slate-200 bg-neutral-subtle/50 px-5 py-3 text-xs w-full lg:w-fit shrink-0">
							{/* Planned Section */}
							<div className="flex flex-col gap-1">
								<span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
									Planned
								</span>
								<div className="flex items-center gap-1.5 font-medium text-foreground">
									<span>
										{currentPhase.planStart
											? new Date(currentPhase.planStart).toLocaleDateString("en-US", {
													month: "short",
													day: "numeric",
													year: "numeric",
											  })
											: "Not set"}
									</span>
									<span className="text-muted-foreground font-normal">–</span>
									<span>
										{currentPhase.planEnd
											? new Date(currentPhase.planEnd).toLocaleDateString("en-US", {
													month: "short",
													day: "numeric",
													year: "numeric",
											  })
											: "Not set"}
									</span>
								</div>
							</div>

							<div className="h-8 w-px bg-slate-200 hidden sm:block" />

							{/* Actual Section */}
							<div className="flex flex-col gap-1">
								<span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
									Actual
								</span>
								<div className="flex items-center gap-1.5 font-medium text-foreground">
									<span>
										{currentPhase.actualStart
											? new Date(currentPhase.actualStart).toLocaleDateString("en-US", {
													month: "short",
													day: "numeric",
													year: "numeric",
											  })
											: "Not started"}
									</span>
									<span className="text-muted-foreground font-normal">–</span>
									<span>
										{currentPhase.actualEnd
											? new Date(currentPhase.actualEnd).toLocaleDateString("en-US", {
													month: "short",
													day: "numeric",
													year: "numeric",
											  })
											: "Not finished"}
									</span>
								</div>
							</div>
						</div>
					</div>
				)}
			</div>

			{/* Phase Modals using AddPhase and EditPhase aliases */}
			{phaseToEdit ? (
				<EditPhase
					isOpen={isModalOpen}
					phase={phaseToEdit}
					stageId={stageId}
					onClose={() => {
						setIsModalOpen(false);
						setPhaseToEdit(null);
					}}
				/>
			) : (
				<AddPhase
					isOpen={isModalOpen}
					stageId={stageId}
					onClose={() => {
						setIsModalOpen(false);
						setPhaseToEdit(null);
					}}
				/>
			)}

			{/* Delete Confirmation Modal */}
			<ConfirmDeleteModal
				isOpen={isDeleteConfirmOpen}
				noun="Phase"
				title={
					phaseToDelete !== null ? `Delete Phase ${phaseToDelete}` : undefined
				}
				onConfirm={handleDeletePhase}
				onCancel={closeDeleteModal}
			/>
		</>
	);
});

PhaseCard.displayName = "PhaseCard";