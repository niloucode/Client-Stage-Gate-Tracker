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
	Check,
	Pencil,
	ChevronLeft,
	ChevronRight,
	Workflow,
} from "lucide-react";

interface PhaseCardProps {
	phases: Phase[];
	stageId: string;
	activePhase: number | null;
	setActivePhase: (phase: number | null) => void;
	/** Clients are read-only: hide edit/delete controls and drag handles. */
	readOnly?: boolean;
}

// ─── Sub-Component: Phase Step Node (Exact match to StageStep) ───────────────

function PhaseStepNode({
	phaseNumber,
	phaseName,
	isCompleted,
	selected,
	badge,
	onClick,
	onEdit,
}: {
	phaseNumber: number;
	phaseName: string;
	isCompleted: boolean;
	selected?: boolean;
	badge?: "completed" | "current" | null;
	onClick?: () => void;
	onEdit?: () => void;
}) {
	const isCurrent = badge === "current";

	return (
		<div className="group relative flex flex-col items-center shrink-0 text-center transition-all duration-200">
			{/* Node Circle & Action Button Wrapper */}
			<div className="relative z-10 flex flex-col items-center">
				<button
					type="button"
					onClick={onClick}
					className="cursor-pointer focus:outline-none"
				>
					{/* Node Circle — Exact h-13 w-13 size */}
					<div
						className={`
							relative flex h-13 w-13 items-center justify-center rounded-full text-sm font-bold transition-all shadow-xs
							${
								selected
									? "border-4 border-brand-100 bg-brand-600 text-white ring-4 ring-brand-100"
									: isCompleted
										? "border-4 border-brand-100 bg-brand-500 text-white hover:bg-brand-600"
										: isCurrent
											? "border-4 border-brand-100 bg-brand-50 text-brand-600 hover:bg-brand-100"
											: "border-4 border-brand-100 bg-neutral-surface text-brand-600 hover:bg-brand-50"
							}
						`}
					>
						{isCompleted ? (
							<Check className="h-5 w-5" />
						) : (
							<span>{phaseNumber}</span>
						)}
					</div>
				</button>

				{/* Pencil Button on Group Hover */}
				{onEdit && (
					<button
						type="button"
						onClick={(e) => {
							e.stopPropagation();
							onEdit();
						}}
						className="flex items-center justify-center h-6 w-6 absolute -top-1 -right-1 opacity-0 group-hover:opacity-100 bg-brand-100 rounded-full z-20 hover:bg-brand-600 hover:text-brand-10 transition-all cursor-pointer shadow-xs"
						title={`Edit phase ${phaseName}`}
						aria-label={`Edit phase ${phaseName}`}
					>
						<Pencil size={12} strokeWidth={3} />
					</button>
				)}
			</div>

			{/* Badge Tag */}
			{badge && (
				<span
					className={`mt-2 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
						badge === "completed"
							? "border-green-600/30 bg-green-100 text-green-600"
							: "border-brand-500/30 bg-brand-50 text-brand-600"
					}`}
				>
					{badge === "completed" ? "Completed" : "In Progress"}
				</span>
			)}

			{/* Title */}
			<span
				className={`max-w-25 text-xs font-semibold leading-tight line-clamp-2 ${badge ? "mt-1.5" : "mt-2"} ${
					selected || isCurrent ? "text-brand-600" : "text-neutral-muted"
				}`}
			>
				{phaseName}
			</span>
		</div>
	);
}

// ─── Main Component ──────────────────────────────────────────────────────────

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

	const handleEditDeleteClick = () => {
		if (!phaseToEdit || phaseToEdit.number === null) return;
		confirmDelete(phaseToEdit.number);
		setIsModalOpen(false);
		setPhaseToEdit(null);
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

	// Find the current active phase to populate the details section below
	const currentPhase = phases.find((p) => p.number === activePhase);

	// Calculate connector progress from completed phases
	const lastCompletedIdx = phases.reduce(
		(acc, p, i) => (p.actualEnd !== null ? i : acc),
		-1,
	);
	const progressPct =
		phases.length > 1 ? (lastCompletedIdx / (phases.length - 1)) * 100 : 0;

	const NODE_SLOT = 130;
	const CIRCLE_CENTER_Y = 26; // Exact Center of h-13 (52px)

	return (
		<>
			<div className="relative bg-neutral-surface border border-slate-200 rounded-md shadow-sm mb-8">
				<div className="px-4 py-6 relative">
					{/* Empty State */}
					{phases.length === 0 ? (
						<div className="flex flex-col items-center justify-center py-8 text-center bg-neutral-subtle/30 rounded-md border border-dashed border-warm-gray-200 my-2">
							<Workflow className="h-8 w-8 text-muted-foreground/40 mb-2" />
							<p className="text-sm font-medium text-charcoal">No phases yet</p>
							<p className="text-xs text-muted-foreground mt-1 max-w-sm">
								Click Add Phase above to create your first phase.
							</p>
						</div>
					) : (
						<>
							{/* Left Scroll Arrow */}
							{showLeftArrow && (
								<button
									type="button"
									onClick={() => scroll("left")}
									className="absolute left-2 top-1/2 -translate-y-1/2 z-20 w-8 h-8 bg-neutral-surface border border-slate-200 rounded-full shadow-md hover:bg-slate-50 hover:border-brand-500 transition-all flex items-center justify-center cursor-pointer"
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
									type="button"
									onClick={() => scroll("right")}
									className="absolute right-2 top-1/2 -translate-y-1/2 z-20 w-8 h-8 bg-neutral-surface border border-slate-200 rounded-full shadow-md hover:bg-slate-50 hover:border-brand-500 transition-all flex items-center justify-center cursor-pointer"
								>
									<ChevronRight
										size={16}
										strokeWidth={2}
										className="text-slate-500"
									/>
								</button>
							)}

							{/* Scrollable Stepper Container */}
							<div
								ref={scrollContainerRef}
								onScroll={checkScroll}
								className="hide-scrollbar overflow-x-auto py-2"
							>
								<div
									className="relative flex items-start justify-between min-w-full px-4"
									style={{ minWidth: `${phases.length * NODE_SLOT}px` }}
								>
									{/* Progress Connector Line — Centered behind h-13 circles */}
									{phases.length > 1 && (
										<div
											className="absolute -translate-y-1/2 rounded-full"
											style={{
												top: CIRCLE_CENTER_Y,
												left: NODE_SLOT / 2,
												width: `calc(100% - ${NODE_SLOT}px)`,
												height: 3,
												backgroundColor: "#E5E3E0",
											}}
										>
											<div
												className="h-full rounded-full bg-brand-600 transition-all duration-300"
												style={{ width: `${progressPct}%` }}
											/>
										</div>
									)}

									{/* Node Items */}
									{phases.map((phase, index) => {
										const num = phase.number ?? 0;
										const isActive = phase.number === activePhase;
										const isCompleted = phase.actualEnd !== null;

										const badge = isCompleted
											? "completed"
											: isActive
												? "current"
												: null;

										return (
											<div
												key={phase.phase_id}
												className="relative z-10 flex flex-col items-center cursor-grab active:cursor-grabbing"
												style={{ width: NODE_SLOT }}
												draggable={!readOnly}
												onDragStart={(e) => handleDragStart(e, index)}
												onDragEnd={handleDragEnd}
												onDragOver={(e) => handleDragOver(e, index)}
												onDragLeave={handleDragLeave}
												onDrop={(e) => handleDrop(e, index)}
											>
												<PhaseStepNode
													phaseNumber={num}
													phaseName={phase.name}
													isCompleted={isCompleted}
													selected={isActive}
													badge={badge}
													onClick={() =>
														phase.number !== null && setActivePhase(phase.number)
													}
													onEdit={
														!readOnly ? () => openEditModal(phase) : undefined
													}
												/>
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
					onDelete={handleEditDeleteClick}
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