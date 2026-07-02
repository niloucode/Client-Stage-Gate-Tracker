"use client";

import { useState } from "react";
import { Phase } from "@/app/(app)/editor/page";

interface ActivePhaseDetailsProps {
  activePhase: number;
  phases: Phase[];
  setPhases: (phases: Phase[]) => void;
}

export function ActivePhaseDetails({ activePhase, phases, setPhases }: ActivePhaseDetailsProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const currentPhase = phases.find(p => p.number === activePhase) || phases[0];

  const updatePhase = (field: keyof Phase, value: string) => {
    setPhases(
      phases.map(p =>
        p.number === activePhase
          ? { ...p, [field]: value }
          : p
      )
    );
  };

  const handleDeletePhase = () => {
    if (phases.length <= 1) {
      alert("Cannot delete the last phase. At least one phase is required.");
      setIsDeleteConfirmOpen(false);
      return;
    }

    const updatedPhases = phases.filter((p) => p.number !== activePhase);
    const renumberedPhases = updatedPhases.map((p, index) => ({
      ...p,
      number: index + 1,
    }));
    
    setPhases(renumberedPhases);
    setIsDeleteConfirmOpen(false);
  };

  return (
    <>
      <div className="bg-white border border-[#E2E8F0] rounded-xl shadow-sm mb-8 relative overflow-hidden">
        {/* Left accent bar - only visible when expanded */}
        {isExpanded && (
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#4F46E5] rounded-l-xl" />
        )}

        {/* Header - always visible, clickable to toggle */}
        <div 
          className={`flex justify-between items-center px-6 py-4 cursor-pointer hover:bg-[#F8FAFC] transition-colors ${isExpanded ? 'border-b border-[#E2E8F0]' : ''}`}
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex items-center gap-3">
            <svg
              width="12"
              height="8"
              viewBox="0 0 12 8"
              fill="none"
              className={`transform transition-transform ${isExpanded ? "" : "-rotate-90"}`}
            >
              <path d="M1 1L6 6L11 1" stroke="#64748B" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            <div className="flex items-center gap-2">
              {/* Clipboard/list icon */}
              <svg width="18" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="3" y="4" width="18" height="22" rx="2" stroke="#4F46E5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M8 2V6M16 2V6" stroke="#4F46E5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M8 10H16" stroke="#4F46E5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M8 14H12" stroke="#4F46E5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <h2 className="text-base font-semibold text-[#0F172A]">
                Active Phase Details
              </h2>
              <span className="text-sm text-[#64748B] font-normal ml-1">
                {currentPhase?.name || `Phase ${activePhase}`}
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="px-2.5 py-1 bg-[#EFF6FF] text-[#4F46E5] rounded-md">
              <span className="text-[10px] font-bold tracking-wide">
                PHASE {activePhase}
              </span>
            </div>
          </div>
        </div>

        {/* Content - conditionally rendered */}
        {isExpanded && (
          <div className="p-6 pl-7">
            {/* Form Fields */}
            <div className="grid grid-cols-[1fr,1fr,2fr] gap-6">
              {/* Phase name form */}
              <div>
                <label className="block text-xs font-semibold text-[#475569] mb-1.5">
                  Phase Name
                </label>
                <input
                  type="text"
                  value={currentPhase?.name || ""}
                  onChange={(e) => updatePhase("name", e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-[#CBD5E1] rounded-lg text-sm text-[#0F172A] focus:outline-none focus:border-[#4F46E5] focus:ring-1 focus:ring-[#4F46E5] transition-all"
                  onClick={(e) => e.stopPropagation()}
                />
              </div>

              {/* Phase subtitle form */}
              <div>
                <label className="block text-xs font-semibold text-[#475569] mb-1.5">
                  Subtitle
                </label>
                <input
                  type="text"
                  value={currentPhase?.subtitle || ""}
                  onChange={(e) => updatePhase("subtitle", e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-[#CBD5E1] rounded-lg text-sm text-[#0F172A] focus:outline-none focus:border-[#4F46E5] focus:ring-1 focus:ring-[#4F46E5] transition-all"
                  onClick={(e) => e.stopPropagation()}
                />
              </div>

              {/* Phase description form */}
              <div>
                <label className="block text-xs font-semibold text-[#475569] mb-1.5">
                  Description
                </label>
                <textarea
                  value={currentPhase?.description || ""}
                  onChange={(e) => updatePhase("description", e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 bg-white border border-[#CBD5E1] rounded-lg text-sm text-[#0F172A] resize-none focus:outline-none focus:border-[#4F46E5] focus:ring-1 focus:ring-[#4F46E5] transition-all"
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            </div>

            {/* Delete Phase Button */}
            <div className="flex justify-end mt-6 pt-4 border-t border-[#F1F5F9]">
              <button
                onClick={() => setIsDeleteConfirmOpen(true)}
                className="px-4 py-2 text-sm font-semibold text-[#EF4444] hover:text-[#DC2626] hover:bg-[#FEE2E2] rounded-lg transition-colors flex items-center gap-2"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M12 4L4 12M4 4L12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
                Delete Phase
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {isDeleteConfirmOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6 relative">
            <h2 className="text-xl font-bold text-[#0F172A] mb-2">
              Delete Phase {activePhase}
            </h2>
            <p className="text-sm text-[#64748B] mb-6">
              Are you sure you want to delete this phase? This action cannot be undone.
            </p>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setIsDeleteConfirmOpen(false)}
                className="px-4 py-2 text-sm font-semibold text-[#64748B] hover:text-[#0F172A] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeletePhase}
                className="px-4 py-2 bg-[#EF4444] text-white text-sm font-semibold rounded-lg hover:bg-[#DC2626] transition-all shadow-sm"
              >
                Delete Phase
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}