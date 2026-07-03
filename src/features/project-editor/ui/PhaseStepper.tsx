"use client";

import { forwardRef, useImperativeHandle, useState, useRef, useEffect } from "react";
import type { Phase } from "../types";
import { DeletePhase } from "@/features/project-editor/ui/modals/DeletePhase";
import { AddPhase } from "@/features/project-editor/ui/modals/AddPhase";

interface PhaseStepperProps {
  phases: Phase[];
  setPhases: (phases: Phase[]) => void;
  activePhase: number;
  setActivePhase: (phase: number) => void;
}

export const PhaseStepper = forwardRef<{ openCreateModal: () => void }, PhaseStepperProps>(
  ({ phases, setPhases, activePhase, setActivePhase }, ref) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
    const [phaseToDelete, setPhaseToDelete] = useState<number | null>(null);
    const [showLeftArrow, setShowLeftArrow] = useState(false);
    const [showRightArrow, setShowRightArrow] = useState(true);
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    // Modal form state
    const [formData, setFormData] = useState({
      name: "",
      subtitle: "",
      description: "",
    });

    useImperativeHandle(ref, () => ({
      openCreateModal: () => setIsModalOpen(true)
    }));

    // Check scroll position to show/hide arrows
    const checkScroll = () => {
      const container = scrollContainerRef.current;
      if (!container) return;

      const { scrollLeft, scrollWidth, clientWidth } = container;
      setShowLeftArrow(scrollLeft > 10);
      setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 10);
    };

    useEffect(() => {
      checkScroll();
      window.addEventListener('resize', checkScroll);
      return () => window.removeEventListener('resize', checkScroll);
    }, [phases]);

    const scroll = (direction: 'left' | 'right') => {
      const container = scrollContainerRef.current;
      if (!container) return;

      const scrollAmount = container.clientWidth * 0.6;
      container.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    };

    const closeModal = () => {
      setIsModalOpen(false);
      setFormData({ name: "", subtitle: "", description: "" });
    };

    const handleAddPhase = (data: { name: string; subtitle: string; description: string }) => {
      const newNumber = phases.length > 0 ? Math.max(...phases.map(p => p.number)) + 1 : 1;
      const newPhase: Phase = {
        number: newNumber,
        name: data.name || `Phase ${newNumber}`,
        subtitle: data.subtitle || "New Phase",
        description: data.description || "Phase description",
        modules: []
      };
      setPhases([...phases, newPhase]);
      setActivePhase(newNumber);
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

    const handleDeletePhase = () => {
      if (phaseToDelete === null) return;
      
      if (phases.length <= 1) {
        alert("Cannot delete the last phase. At least one phase is required.");
        setIsDeleteConfirmOpen(false);
        setPhaseToDelete(null);
        return;
      }

      const updatedPhases = phases.filter((p) => p.number !== phaseToDelete);
      const renumberedPhases = updatedPhases.map((p, index) => ({
        ...p,
        number: index + 1,
      }));
      
      setPhases(renumberedPhases);
      
      if (activePhase === phaseToDelete) {
        setActivePhase(1);
      } else if (activePhase > phaseToDelete) {
        setActivePhase(activePhase - 1);
      }
      
      setIsDeleteConfirmOpen(false);
      setPhaseToDelete(null);
    };

    return (
      <>
        <div className="relative bg-white border border-[#E2E8F0] rounded-xl shadow-sm mb-8">
          <div className="px-8 py-8 relative">
            {/* Left Scroll Arrow */}
            {showLeftArrow && (
              <button
                onClick={() => scroll('left')}
                className="absolute left-2 top-1/2 -translate-y-1/2 z-20 w-8 h-8 bg-white border border-[#E2E8F0] rounded-full shadow-md hover:bg-[#F8FAFC] hover:border-[#4F46E5] transition-all flex items-center justify-center"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M10 12L6 8L10 4" stroke="#64748B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            )}

            {/* Right Scroll Arrow */}
            {showRightArrow && (
              <button
                onClick={() => scroll('right')}
                className="absolute right-2 top-1/2 -translate-y-1/2 z-20 w-8 h-8 bg-white border border-[#E2E8F0] rounded-full shadow-md hover:bg-[#F8FAFC] hover:border-[#4F46E5] transition-all flex items-center justify-center"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M6 12L10 8L6 4" stroke="#64748B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            )}

            {/* Scrollable Container */}
            <div 
              ref={scrollContainerRef}
              onScroll={checkScroll}
              className="overflow-x-auto scroll-smooth hide-scrollbar"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              <div className="flex items-start" style={{ minWidth: `${phases.length * 180}px` }}>
                {phases.map((phase) => {
                  const isActive = phase.number === activePhase;
                  const isCompleted = phase.number < activePhase;
                  const isPending = phase.number > activePhase;

                  return (
                    <div key={phase.number} className="relative flex flex-col items-center flex-shrink-0" style={{ width: `${100 / phases.length}%`, minWidth: '140px' }}>
                      {/* Phase Node */}
                      <div className="relative z-10 flex flex-col items-center group">
                        <button
                          onClick={() => setActivePhase(phase.number)}
                          className="focus:outline-none"
                        >
                          <div
                            className={`
                              w-10 h-10 rounded-full flex items-center justify-center
                              transition-all duration-200 relative
                              ${isActive 
                                ? "bg-[#4F46E5] border-2 border-[#4F46E5] shadow-lg" 
                                : isCompleted
                                ? "bg-[#3525CD] border-2 border-white shadow-md"
                                : "bg-white border-2 border-[#E2E8F0] group-hover:border-[#4F46E5]"
                              }
                            `}
                          >
                            {isCompleted ? (
                              <svg width="16" height="12" viewBox="0 0 16 12" fill="none">
                                <path
                                  d="M1 6L5.5 10.5L15 1"
                                  stroke="white"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </svg>
                            ) : (
                              <span
                                className={`
                                  font-semibold text-sm
                                  ${isActive ? "text-white" : isPending ? "text-[#94A3B8]" : "text-[#475569]"}
                                `}
                              >
                                {phase.number}
                              </span>
                            )}
                          </div>
                        </button>

                        {/* Delete button - shown on hover */}
                        <button
                          onClick={() => confirmDelete(phase.number)}
                          className="absolute -top-2 -right-8 p-1 opacity-0 group-hover:opacity-100 hover:bg-[#FEE2E2] rounded transition-all"
                          title="Delete phase"
                        >
                          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                            <path d="M10.5 3.5L3.5 10.5M3.5 3.5L10.5 10.5" stroke="#94A3B8" strokeWidth="1.5" strokeLinecap="round" />
                          </svg>
                        </button>
                      </div>

                      {/* Phase Labels */}
                      <div className="mt-3 text-center">
                        <div
                          className={`
                            text-xs font-semibold tracking-wide whitespace-nowrap
                            ${isActive ? "text-[#4F46E5]" : isPending ? "text-[#94A3B8]" : "text-[#475569]"}
                          `}
                        >
                          {phase.name}
                        </div>
                        <div
                          className={`
                            text-[11px] mt-0.5 whitespace-nowrap
                            ${isActive ? "text-[#4F46E5]" : isPending ? "text-[#94A3B8]" : "text-[#64748B]"}
                          `}
                        >
                          {phase.subtitle}
                        </div>
                      </div>

                      {/* Diamond Gate - positioned between phases */}
                      {/* {idx < phases.length - 1 && (
                        <div className="absolute -right-[calc(15%-20px)] top-3">
                          <div className="relative">
                            <div className={`w-6 h-6 border-2 rotate-45 border-[#CBD5E1] transition-all duration-200
                                      ${isCompleted ? "bg-[#F1F5F9]" : "bg-white"}
                                      `}
                            />
                            <div className="absolute left-1/2 -translate-x-1/2 whitespace-nowrap top-8">
                              <span className="text-[9px] font-bold text-[#64748B] uppercase tracking-wider 
                              bg-white px-2 py-0.5 rounded whitespace-nowrap">
                                GATE
                              </span>
                            </div>
                          </div>
                        </div>
                      )} */}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Connecting Line */}
            <div className="absolute left-[calc(8%+20px)] right-[calc(8%+20px)] top-[calc(50%+4px)] h-0.5 bg-[#E2E8F0] -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* Add Phase Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 relative">
              <button
                onClick={closeModal}
                className="absolute top-4 right-4 text-[#94A3B8] hover:text-[#475569] transition-colors"
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M15 5L5 15M5 5L15 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </button>

              <h2 className="text-xl font-bold text-[#0F172A] mb-2">
                Create New Phase
              </h2>
              <p className="text-sm text-[#64748B] mb-6">
                Fill in the details to create a new phase in the pipeline.
              </p>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-[#475569] mb-1.5">
                    Phase Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Phase 5: Testing"
                    className="w-full px-3 py-2 bg-white border border-[#CBD5E1] rounded-lg text-sm text-[#0F172A] focus:outline-none focus:border-[#4F46E5] focus:ring-1 focus:ring-[#4F46E5] transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#475569] mb-1.5">
                    Subtitle
                  </label>
                  <input
                    type="text"
                    value={formData.subtitle}
                    onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                    placeholder="e.g., QA & Testing"
                    className="w-full px-3 py-2 bg-white border border-[#CBD5E1] rounded-lg text-sm text-[#0F172A] focus:outline-none focus:border-[#4F46E5] focus:ring-1 focus:ring-[#4F46E5] transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#475569] mb-1.5">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Describe the objectives and scope of this phase..."
                    rows={3}
                    className="w-full px-3 py-2 bg-white border border-[#CBD5E1] rounded-lg text-sm text-[#0F172A] resize-none focus:outline-none focus:border-[#4F46E5] focus:ring-1 focus:ring-[#4F46E5] transition-all"
                  />
                </div>
              </div>

              <AddPhase
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSubmit={handleAddPhase}
              />
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        <DeletePhase
          isOpen={isDeleteConfirmOpen}
          phaseLabel={phaseToDelete !== null ? `Phase ${phaseToDelete}` : undefined}
          onConfirm={handleDeletePhase}
          onCancel={closeDeleteModal}
        />
      </>
    );
  }
);

PhaseStepper.displayName = 'PhaseStepper';