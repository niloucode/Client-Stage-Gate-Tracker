"use client";

import { useState, useEffect } from "react";
import type { Phase } from "../types";
import { DeletePhase } from "@/features/stage-editor/ui/modals/DeletePhase";
import { useUpdatePhase, useDeletePhase } from "@/entities/phase/mutations";

interface ActivePhaseDetailsProps {
  activePhase: number | null;
  phases: Phase[];
  stageId: string;
}

export function ActivePhaseDetails({ activePhase, phases, stageId }: ActivePhaseDetailsProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const currentPhase = activePhase !== null ? phases.find(p => p.number === activePhase) ?? null : null;

  // Local buffer — only synced to server on explicit save
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);

  const updatePhaseMutation = useUpdatePhase();
  const deletePhaseMutation = useDeletePhase();

  // Reset buffer when selected phase changes
  useEffect(() => {
    setName(currentPhase?.name ?? "");
    setDescription(currentPhase?.description ?? "");
    setStartDate(currentPhase?.start_date ?? null);
    setEndDate(currentPhase?.end_date ?? null);
  }, [currentPhase]);

  const isDirty =
    name !== (currentPhase?.name ?? "") ||
    description !== (currentPhase?.description ?? "") ||
    startDate?.getTime() !== (currentPhase?.start_date?.getTime() ?? null) ||
    endDate?.getTime() !== (currentPhase?.end_date?.getTime() ?? null);

  const formatDate = (date: Date | null) => {
    if (!date) return "";
    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatCreatedAt = (date: Date) => {
    return `${date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    })}`;
  };

  if (activePhase === null || !currentPhase) {
    return (
      <div className="bg-white border border-[#E2E8F0] rounded-xl shadow-sm mb-8 relative overflow-hidden">
        <div className="p-6 text-center">
          <p className="text-sm text-[#64748B]">No phase selected</p>
          <p className="text-xs text-[#94A3B8] mt-1">Select a phase from the stepper above or create a new one</p>
        </div>
      </div>
    );
  }

  // Enforce start_date < end_date with at least 1 day gap
  const MIN_GAP_MS = 24 * 60 * 60 * 1000;

  const handleStartDateChange = (d: Date | null) => {
    setStartDate(d);
    if (d && endDate && d.getTime() + MIN_GAP_MS > endDate.getTime()) {
      setEndDate(new Date(d.getTime() + MIN_GAP_MS));
    }
  };

  const handleEndDateChange = (d: Date | null) => {
    setEndDate(d);
    if (d && startDate && startDate.getTime() + MIN_GAP_MS > d.getTime()) {
      setStartDate(new Date(d.getTime() - MIN_GAP_MS));
    }
  };

  const handleSave = async () => {
    if (!isDirty) return;
    await updatePhaseMutation.mutateAsync({
      phaseId: currentPhase.phase_id,
      stageId,
      name,
      description,
      start_date: startDate ?? undefined,
      end_date: endDate ?? undefined,
    });
  };

  const handleDeletePhase = async () => {
    if (!currentPhase) return;
    await deletePhaseMutation.mutateAsync({
      phaseId: currentPhase.phase_id,
      stageId,
    });
    setIsDeleteConfirmOpen(false);
  };

  const toDateInput = (d: Date | null) =>
    d ? new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16) : "";

  return (
    <>
      <div className="bg-white border border-[#E2E8F0] rounded-xl shadow-sm mb-8 relative overflow-hidden">
        {isExpanded && (
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#4F46E5] rounded-l-xl" />
        )}

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

        {isExpanded && (
          <div className="p-6 pl-7">
            <div className="grid grid-cols-1 gap-6">
              <div>
                <label className="block text-xs font-semibold text-[#475569] mb-1.5">
                  Phase Name
                </label>
                <input
                  type="text"
                  placeholder="e.g., Discovery"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-[#CBD5E1] rounded-lg text-sm text-[#0F172A] focus:outline-none focus:border-[#4F46E5] focus:ring-1 focus:ring-[#4F46E5] transition-all"
                  onClick={(e) => e.stopPropagation()}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#475569] mb-1.5">
                  Description
                </label>
                <textarea
                  placeholder="Describe the objectives and scope of this phase..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 bg-white border border-[#CBD5E1] rounded-lg text-sm text-[#0F172A] resize-none focus:outline-none focus:border-[#4F46E5] focus:ring-1 focus:ring-[#4F46E5] transition-all"
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-6 mt-4">
              <div>
                <label className="block text-xs font-semibold text-[#475569] mb-1.5">
                  Created
                </label>
                <input
                  type="text"
                  value={formatCreatedAt(currentPhase.creation_date || new Date())}
                  disabled
                  className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-sm text-[#64748B] cursor-not-allowed"
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#475569] mb-1.5">
                  Start Date
                </label>
                <input
                  type="datetime-local"
                  value={toDateInput(startDate)}
                  onChange={(e) => handleStartDateChange(e.target.value ? new Date(e.target.value) : null)}
                  className="w-full px-3 py-2 bg-white border border-[#CBD5E1] rounded-lg text-sm text-[#0F172A] focus:outline-none focus:border-[#4F46E5] focus:ring-1 focus:ring-[#4F46E5] transition-all"
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#475569] mb-1.5">
                  End Date
                </label>
                <input
                  type="datetime-local"
                  value={toDateInput(endDate)}
                  onChange={(e) => handleEndDateChange(e.target.value ? new Date(e.target.value) : null)}
                  className="w-full px-3 py-2 bg-white border border-[#CBD5E1] rounded-lg text-sm text-[#0F172A] focus:outline-none focus:border-[#4F46E5] focus:ring-1 focus:ring-[#4F46E5] transition-all"
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            </div>

            <div className="flex justify-between items-center mt-6 pt-4 border-t border-[#F1F5F9]">
              <button
                onClick={() => setIsDeleteConfirmOpen(true)}
                className="px-4 py-2 text-sm font-semibold text-[#EF4444] hover:text-[#DC2626] hover:bg-[#FEE2E2] rounded-lg transition-colors flex items-center gap-2"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M12 4L4 12M4 4L12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
                Delete Phase
              </button>

              <button
                onClick={handleSave}
                disabled={!isDirty}
                className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all shadow-sm ${
                  isDirty
                    ? 'bg-[#4F46E5] text-white hover:bg-[#4338CA]'
                    : 'bg-[#E2E8F0] text-[#94A3B8] cursor-not-allowed'
                }`}
              >
                Save Phase
              </button>
            </div>
          </div>
        )}
      </div>

      <DeletePhase
        isOpen={isDeleteConfirmOpen}
        phaseLabel={`Phase ${activePhase}`}
        onConfirm={handleDeletePhase}
        onCancel={() => setIsDeleteConfirmOpen(false)}
      />
    </>
  );
}
