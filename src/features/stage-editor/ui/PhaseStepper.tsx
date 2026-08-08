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
import { AddPhase } from "@/features/stage-editor/ui/modals/AddPhase";
import {
    useCreatePhase,
    useDeletePhase,
    useReorderPhase,
} from "@/entities/phase/mutations";
import { X } from "lucide-react";

interface PhaseStepperProps {
    phases: Phase[];
    stageId: string;
    activePhase: number | null;
    setActivePhase: (phase: number | null) => void;
}

export const PhaseStepper = forwardRef<
    { openCreateModal: () => void },
    PhaseStepperProps
>(({ phases, stageId, activePhase, setActivePhase }, ref) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
    const [phaseToDelete, setPhaseToDelete] = useState<number | null>(null);
    const [showLeftArrow, setShowLeftArrow] = useState(false);
    const [showRightArrow, setShowRightArrow] = useState(true);
    const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    const createPhaseMutation = useCreatePhase();
    const deletePhaseMutation = useDeletePhase();
    const reorderPhaseMutation = useReorderPhase();

    useImperativeHandle(ref, () => ({
        openCreateModal: () => setIsModalOpen(true),
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

    const handleAddPhase = async (data: {
        name: string;
        description: string;
        start_date: Date | null;
        deadline_date: Date | null;
        finish_date: Date | null;
    }) => {
        await createPhaseMutation.mutateAsync({
            stageId,
            name: data.name,
            description: data.description,
            start_date: data.start_date ?? undefined,
            deadline_date: data.deadline_date ?? undefined,
            finish_date: data.finish_date ?? undefined,
        });
        setIsModalOpen(false);
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

        await deletePhaseMutation.mutateAsync({
            phaseId: phase.phase_id,
            stageId,
        });

        if (activePhase === phaseToDelete) {
            setActivePhase(null);
        } else if (activePhase !== null && activePhase > phaseToDelete) {
            setActivePhase(activePhase - 1);
        }

        setIsDeleteConfirmOpen(false);
        setPhaseToDelete(null);
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
        document.querySelectorAll(".drag-over").forEach((el) => {
            el.classList.remove("drag-over");
        });
    };

    const handleDragOver = (e: React.DragEvent, index: number) => {
        e.preventDefault();
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

        await reorderPhaseMutation.mutateAsync({
            phaseId: draggedPhase.phase_id,
            targetNumber,
            stageId,
        });

        setDraggedIndex(null);
    };

    // Find the current active phase to populate the details section
    const currentPhase = phases.find((p) => p.number === activePhase);

    return (
        <>
            <div className="relative bg-neutral-surface border border-slate-200 rounded-xl shadow-sm mb-8">
                <div className="px-8 py-8 relative">
                    {/* Empty State */}
                    {phases.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-8 text-center">
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
                                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                        <path
                                            d="M10 12L6 8L10 4"
                                            stroke="#64748B"
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        />
                                    </svg>
                                </button>
                            )}

                            {/* Right Scroll Arrow */}
                            {showRightArrow && (
                                <button
                                    onClick={() => scroll("right")}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 z-20 w-8 h-8 bg-neutral-surface border border-slate-200 rounded-full shadow-md hover:bg-slate-50 hover:border-brand-500 transition-all flex items-center justify-center"
                                >
                                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                        <path
                                            d="M6 12L10 8L6 4"
                                            stroke="#64748B"
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        />
                                    </svg>
                                </button>
                            )}

                            {/* Scrollable Container */}
                            <div
                                ref={scrollContainerRef}
                                onScroll={checkScroll}
                                className="relative z-10 overflow-x-auto scroll-smooth hide-scrollbar"
                                style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
                            >
                                {/* Connecting Line through Node Centers */}
                                <div className="z-0 absolute left-0 right-0 top-[54px] h-0.5 bg-brand-100 pointer-events-none" />

                                <div
                                    className="flex items-start pt-7"
                                    style={{ minWidth: `${phases.length * 180}px` }}
                                >
                                    {phases.map((phase, index) => {
                                        const num = phase.number ?? 0;
                                        const isActive = phase.number === activePhase;
                                        const isCompleted =
                                            activePhase !== null && num < activePhase;

                                        return (
                                            <div
                                                key={phase.phase_id}
                                                className="relative flex flex-col items-center flex-shrink-0 transition-all duration-200 cursor-grab active:cursor-grabbing"
                                                style={{
                                                    width: `${100 / phases.length}%`,
                                                    minWidth: "140px",
                                                }}
                                                draggable={true}
                                                onDragStart={(e) => handleDragStart(e, index)}
                                                onDragEnd={handleDragEnd}
                                                onDragOver={(e) => handleDragOver(e, index)}
                                                onDragLeave={handleDragLeave}
                                                onDrop={(e) => handleDrop(e, index)}
                                            >
                                                <div className="relative z-10 flex flex-col items-center group">
                                                    <button
                                                        onClick={() =>
                                                            phase.number !== null &&
                                                            setActivePhase(phase.number)
                                                        }
                                                        className="focus:outline-none"
                                                    >
                                                        {/* Node Circle matching Sequence design */}
                                                        <div
                                                            className={`
                                                                relative flex h-13 w-13 items-center justify-center rounded-full text-sm font-bold border-2 transition-all shadow-xs
                                                                ${
                                                                    isActive
                                                                        ? "border-brand-600 bg-brand-600 text-white ring-4 ring-brand-100"
                                                                        : isCompleted
                                                                        ? "border-brand-500 bg-brand-500 text-white group-hover:border-brand-600 group-hover:bg-brand-600"
                                                                        : "border-warm-gray-200 bg-neutral-subtle text-neutral-border group-hover:border-brand-500 group-hover:bg-brand-50 group-hover:text-brand-600"
                                                                }
                                                            `}
                                                        >
                                                            <span>{phase.number ?? ""}</span>
                                                        </div>
                                                    </button>

                                                    {/* Delete Button on Group Hover */}
                                                    <button
                                                        onClick={() =>
                                                            phase.number !== null &&
                                                            confirmDelete(phase.number)
                                                        }
                                                        className="flex items-center justify-center h-4 w-4 absolute -top-1 -right-1 opacity-0 group-hover:opacity-100 bg-background border border-slate-200 shadow-xs rounded-full transition-all hover:scale-110 z-20"
                                                        title="Delete phase"
                                                    >
                                                        <X size={12} strokeWidth={3} />
                                                    </button>
                                                </div>

                                                {/* Phase Labels */}
                                                <div className="mt-3 text-center">
                                                    <div
                                                        className={`
                                                            text-xs font-semibold tracking-wide
                                                            max-w-[120px] truncate
                                                            ${
                                                                isActive
                                                                    ? "text-brand-600"
                                                                    : "text-neutral-muted"
                                                            }
                                                        `}
                                                        title={phase.name}
                                                    >
                                                        {phase.name}
                                                    </div>
                                                    {phase.start_date && phase.finish_date && (
                                                        <div className="text-[10px] text-muted-foreground mt-0.5 whitespace-nowrap">
                                                            {new Date(phase.start_date).toLocaleDateString("en-US", {
                                                                month: "short",
                                                                day: "numeric",
                                                            })}{" "}
                                                            –{" "}
                                                            {new Date(phase.finish_date).toLocaleDateString("en-US", {
                                                                month: "short",
                                                                day: "numeric",
                                                            })}
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
                    <div className="p-6 pl-8 border-t border-slate-200 bg-neutral-surface rounded-b-xl">
                        <div className="grid grid-cols-1 gap-6">
                            <div className="mb-2">
                                <label className="block text-sm font-medium text-neutral-800">Description</label>
                                <div className="mt-2 text-sm text-neutral-600 bg-slate-50 border border-slate-200 rounded-lg p-3 min-h-[80px]">
                                    {currentPhase.description || "No description provided."}
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-6 mt-4">
                            <div>
                                <label className="block text-sm font-medium text-neutral-800">Start Date</label>
                                <input
                                    type="text"
                                    value={currentPhase.start_date ? new Date(currentPhase.start_date).toLocaleDateString() : ""}
                                    disabled
                                    className="mt-1 w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-neutral-500 cursor-not-allowed"
                                    onClick={(e) => e.stopPropagation()}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-neutral-800">Deadline Date</label>
                                <input
                                    type="text"
                                    value={currentPhase.deadline_date ? new Date(currentPhase.deadline_date).toLocaleDateString() : ""}
                                    disabled
                                    className="mt-1 w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-neutral-500 cursor-not-allowed"
                                    onClick={(e) => e.stopPropagation()}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-neutral-800">Finish Date</label>
                                <input
                                    type="text"
                                    value={currentPhase.finish_date ? new Date(currentPhase.finish_date).toLocaleDateString() : ""}
                                    disabled
                                    className="mt-1 w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-neutral-500 cursor-not-allowed"
                                    onClick={(e) => e.stopPropagation()}
                                />
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Add Phase Modal */}
            <AddPhase
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSubmit={handleAddPhase}
            />

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

PhaseStepper.displayName = "PhaseStepper";