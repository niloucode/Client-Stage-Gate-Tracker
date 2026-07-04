"use client";

import { useState } from "react";
import type { Module, Phase, Workflow } from "../types";
import { WorkflowsList } from "./WorkflowsList";
import { AddModule } from "@/features/project-editor/ui/modals/AddModule";
import { EditModule } from "@/features/project-editor/ui/modals/EditModule";

interface ModulesCardProps {
  activePhase: number | null;
  phases: Phase[];
  setPhases: (phases: Phase[]) => void;
}

export function ModulesCard({ activePhase, phases, setPhases }: ModulesCardProps) {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingModule, setEditingModule] = useState<Module | null>(null);
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set(["1"]));
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [moduleToDelete, setModuleToDelete] = useState<string | null>(null);

  // Get modules for the current active phase
  const currentPhase = activePhase !== null ? phases.find(p => p.number === activePhase) : null;
  const modules = currentPhase?.modules || [];

  const openCreateModuleModal = () => {
    if (activePhase === null) return;
    setIsAddOpen(true);
  };
  
  const openEditModuleModal = (module: Module) => setEditingModule(module);

  const formatDate = (date: Date) => {
    return `${date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    })}`;
  };

  const handleAddModule = (data: { name: string; startDate: Date | null; endDate: Date | null }) => {
    if (activePhase === null) return;
    
    const newModule: Module = {
      id: Date.now().toString(),
      name: data.name || "New Module",
      startDate: data.startDate || null,
      endDate: data.endDate || null,
      createdAt: new Date(),
      workflows: [],
    };
    setPhases(phases.map(phase =>
      phase.number === activePhase ? { ...phase, modules: [...phase.modules, newModule] } : phase
    ));
    setExpandedModules(prev => new Set(prev).add(newModule.id));
    setIsAddOpen(false);
  };

  const handleSaveModule = (data: { name: string; startDate: Date | null; endDate: Date | null }) => {
    if (!editingModule || activePhase === null) return;
    setPhases(phases.map(phase =>
      phase.number === activePhase ? {
        ...phase,
        modules: phase.modules.map(m =>
          m.id === editingModule.id ? { 
            ...m, 
            name: data.name, 
            startDate: data.startDate, 
            endDate: data.endDate
          } : m
        ),
      } : phase
    ));
    setEditingModule(null);
  };

  const handleEditDeleteClick = () => {
    if (!editingModule) return;
    confirmDelete(editingModule.id);
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

  const handleDeleteModule = () => {
    if (!moduleToDelete || activePhase === null) return;
    
    const updatedPhases = phases.map((phase) => {
      if (phase.number !== activePhase) return phase;
      return {
        ...phase,
        modules: phase.modules.filter((m) => m.id !== moduleToDelete),
      };
    });
    setPhases(updatedPhases);
    
    setIsDeleteConfirmOpen(false);
    setModuleToDelete(null);
  };

  const handleUpdateWorkflows = (moduleId: string, workflows: Workflow[]) => {
    if (activePhase === null) return;
    
    const updatedPhases = phases.map((phase) => {
      if (phase.number !== activePhase) return phase;
      return {
        ...phase,
        modules: phase.modules.map((m) =>
          m.id === moduleId
            ? { ...m, workflows }
            : m
        ),
      };
    });
    setPhases(updatedPhases);
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
              ? 'bg-[#E2E8F0] text-[#94A3B8] cursor-not-allowed' 
              : 'bg-[#4F46E5] text-white hover:bg-[#4338CA]'
          }`}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M7 2V12M2 7H12" stroke={activePhase === null ? "#94A3B8" : "white"} strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          Add Module
        </button>
      </div>

      {/* Module Cards */}
      <div className="space-y-4">
        {activePhase === null ? (
          <div className="bg-white border border-[#E2E8F0] rounded-xl shadow-sm p-8 text-center">
            <p className="text-sm text-[#64748B]">No phase selected</p>
            <p className="text-xs text-[#94A3B8] mt-1">Select a phase from the stepper above to manage its modules</p>
          </div>
        ) : modules.length === 0 ? (
          <div className="bg-white border border-[#E2E8F0] rounded-xl shadow-sm p-8 text-center">
            <p className="text-sm text-[#64748B]">No modules yet for this phase.</p>
            <p className="text-xs text-[#94A3B8] mt-1">Click Add Module to create one.</p>
          </div>
        ) : (
          modules.map((module) => {
            const isExpanded = expandedModules.has(module.id);

            return (
              <div
                key={module.id}
                className="bg-white border border-[#E2E8F0] rounded-xl shadow-sm overflow-hidden"
              >
                {/* Module Header */}
                <div className="flex justify-between items-center px-5 py-4 bg-[#F8FAFC] border-b border-[#E2E8F0]">
                  
                  {/* Left Side Block */}
                  <div
                    className="flex-1 flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={() => toggleModule(module.id)}
                  >
                    <svg
                      width="12"
                      height="8"
                      viewBox="0 0 12 8"
                      fill="none"
                      className={`flex-shrink-0 transform transition-transform ${isExpanded ? "" : "-rotate-90"}`}
                    >
                      <path d="M1 1L6 6L11 1" stroke="#64748B" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                    <div>
                      <h4 className="font-semibold text-sm text-[#0F172A]">
                        {module.name}
                      </h4>
                      <p className="text-xs text-[#64748B] mt-0.5">
                        Created: {formatDate(module.createdAt)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {/* Date Badge */}
                    {module.startDate && module.endDate && (
                      <div className="px-3 py-1 bg-[#EEF2FF] border border-[#E0E7FF] rounded-md">
                        <h4 className="font-semibold text-xs text-[#334155]">
                          {formatDate(module.startDate)} – {formatDate(module.endDate)}
                        </h4>
                      </div>
                    )}
                    
                    {/* Vertical Divider */}
                    {module.startDate && module.endDate && (
                      <div className="w-px h-5 bg-[#E2E8F0] mx-1"></div>
                    )}

                    {/* Edit button */}
                    <button
                      onClick={() => openEditModuleModal(module)}
                      className="opacity-60 hover:opacity-100 transition-opacity p-1 hover:bg-[#E2E8F0] rounded"
                    >
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
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
                    moduleId={module.id}
                    onUpdateWorkflows={(workflows) => handleUpdateWorkflows(module.id, workflows)}
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6 relative">
            <h2 className="text-xl font-bold text-[#0F172A] mb-2">
              Delete Module
            </h2>
            <p className="text-sm text-[#64748B] mb-6">
              Are you sure you want to delete this module? This action cannot be undone.
            </p>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setIsDeleteConfirmOpen(false);
                  setModuleToDelete(null);
                }}
                className="px-4 py-2 text-sm font-semibold text-[#64748B] hover:text-[#0F172A] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteModule}
                className="px-4 py-2 bg-[#EF4444] text-white text-sm font-semibold rounded-lg hover:bg-[#DC2626] transition-all shadow-sm"
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