"use client";

import { useState } from "react";
import { Module, Phase, Workflow } from "@/app/(app)/editor/page";
import { WorkflowsList } from "./WorkflowsList";
import { AddModule } from "./Modals/AddModule";
import { EditModule } from "./Modals/EditModule";

interface ModulesCardProps {
  activePhase: number;
  phases: Phase[];
  setPhases: (phases: Phase[]) => void;
}

export function ModulesCard({ activePhase, phases, setPhases }: ModulesCardProps) {
  const [isModuleModalOpen, setIsModuleModalOpen] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingModule, setEditingModule] = useState<Module | null>(null);
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set(["1"]));
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [moduleToDelete, setModuleToDelete] = useState<string | null>(null);
  
  const openCreateModuleModal = () => setIsAddOpen(true);
  const openEditModuleModal = (module: Module) => setEditingModule(module);

  // Get modules for the current active phase
  const currentPhase = phases.find(p => p.number === activePhase);
  const modules = currentPhase?.modules || [];

  // Module form state
  const [moduleFormData, setModuleFormData] = useState({
    name: "",
    description: "",
    roles: "",
  });

  const handleAddModule = (data: { name: string; description: string; roles: string }) => {
    const rolesList = data.roles.split(",").map(r => r.trim()).filter(Boolean);
    const newModule: Module = {
      id: Date.now().toString(),
      name: data.name || "New Module",
      description: data.description || "Module description",
      roles: rolesList.length > 0 ? rolesList : ["Unassigned"],
      workflows: [],
    };
    setPhases(phases.map(phase =>
      phase.number !== activePhase ? phase : { ...phase, modules: [...phase.modules, newModule] }
    ));
    setExpandedModules(prev => new Set(prev).add(newModule.id));
    setIsAddOpen(false);
  };

  const handleSaveModule = (data: { name: string; description: string; roles: string }) => {
    if (!editingModule) return;
    const rolesList = data.roles.split(",").map(r => r.trim()).filter(Boolean);
    setPhases(phases.map(phase =>
      phase.number !== activePhase ? phase : {
        ...phase,
        modules: phase.modules.map(m =>
          m.id === editingModule.id ? { ...m, name: data.name, description: data.description, roles: rolesList } : m
        ),
      }
    ));
    setEditingModule(null);
  };

  // EditModule's "Delete" hands off to your existing confirm-delete modal
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

  const closeModuleModal = () => {
    setIsModuleModalOpen(false);
    setEditingModule(null);
    setModuleFormData({ name: "", description: "", roles: "" });
  };

  const confirmDelete = (moduleId: string) => {
    setModuleToDelete(moduleId);
    setIsDeleteConfirmOpen(true);
    closeModuleModal();
  };

  const handleDeleteModule = () => {
    if (!moduleToDelete) return;
    
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
          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#4F46E5] text-white text-sm font-semibold rounded-lg hover:bg-[#4338CA] transition-all shadow-sm"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M7 2V12M2 7H12" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          Add Module
        </button>
      </div>

      {/* Module Cards */}
      <div className="space-y-4">
        {modules.length === 0 ? (
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
                  <div
                    className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity flex-1"
                    onClick={() => toggleModule(module.id)}
                  >
                    <svg
                      width="12"
                      height="8"
                      viewBox="0 0 12 8"
                      fill="none"
                      className={`transform transition-transform ${isExpanded ? "" : "-rotate-90"}`}
                    >
                      <path d="M1 1L6 6L11 1" stroke="#64748B" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                    <div>
                      <h4 className="font-semibold text-sm text-[#0F172A]">
                        {module.name}
                      </h4>
                      <p className="text-xs text-[#64748B] mt-0.5">{module.description}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Role avatars */}
                    {/* <div className="flex items-center -space-x-1">
                      {module.roles.slice(0, 3).map((role, idx) => (
                        <div
                          key={idx}
                          className="w-6 h-6 rounded-full flex items-center justify-center shadow-[0_0_0_2px_#FAF8FF]"
                          style={{ backgroundColor: roleColors[idx % roleColors.length] }}
                        >
                          <span className="text-[9px] font-bold text-white">
                            {role.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      ))}
                      {module.roles.length > 3 && (
                        <div className="w-6 h-6 bg-[#94A3B8] rounded-full flex items-center justify-center shadow-[0_0_0_2px_#FAF8FF]">
                          <span className="text-[9px] font-bold text-white">
                            +{module.roles.length - 3}
                          </span>
                        </div>
                      )}
                    </div> */}

                    <div className="w-px h-4 bg-[#C7C4D8] mx-2" />

                    {/* Edit button */}
                    <button
                      onClick={() => openEditModuleModal(module)}
                      className="opacity-60 hover:opacity-100 transition-opacity p-1 hover:bg-[#F1F5F9] rounded"
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

      {/* Module Modal */}
      <AddModule
        isOpen={isAddOpen}
        activePhase={activePhase}
        onClose={() => setIsAddOpen(false)}
        onSubmit={handleAddModule}
      />
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