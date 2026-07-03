"use client";

import { useState } from "react";
import { Workflow } from "@/app/(app)/editor/page";
import { AddWorkflow } from "./Modals/AddWorkflow";
import { EditWorkflow } from "./Modals/EditWorkflow";
import { DeleteWorkflow } from "./Modals/DeleteWorkflow";

interface WorkflowsListProps {
  workflows: Workflow[];
  moduleId: string;
  onUpdateWorkflows: (workflows: Workflow[]) => void;
}

export function WorkflowsList({ workflows, moduleId, onUpdateWorkflows }: WorkflowsListProps) {
  const [isWorkflowModalOpen, setIsWorkflowModalOpen] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingWorkflow, setEditingWorkflow] = useState<Workflow | null>(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [workflowToDelete, setWorkflowToDelete] = useState<Workflow | null>(null);

  // Workflow form state
  const [workflowFormData, setWorkflowFormData] = useState({
    name: "",
    tags: "",
  });

  const openCreateWorkflowModal = () => setIsAddOpen(true);
  const openEditWorkflowModal = (workflow: Workflow) => setEditingWorkflow(workflow);

  const closeWorkflowModal = () => {
    setIsWorkflowModalOpen(false);
    setEditingWorkflow(null);
    setWorkflowFormData({ name: "", tags: "" });
  };

  const handleAddWorkflow = (data: { name: string; tags: string }) => {
    const tagsList = data.tags.split(",").map(t => t.trim()).filter(Boolean);
    const newWorkflow: Workflow = {
      id: Date.now().toString(),
      name: data.name || "New Workflow",
      tags: tagsList.length > 0 ? tagsList : ["Draft"],
      ticketCount: 0,
      progress: 0,
    };
    onUpdateWorkflows([...workflows, newWorkflow]);
    setIsAddOpen(false);
  };

  const handleSaveWorkflow = (data: { name: string; tags: string }) => {
    if (!editingWorkflow) return;
    const tagsList = data.tags.split(",").map(t => t.trim()).filter(Boolean);
    onUpdateWorkflows(workflows.map(w =>
      w.id === editingWorkflow.id
        ? { ...w, name: data.name || "New Workflow", tags: tagsList.length > 0 ? tagsList : ["Draft"] }
        : w
    ));
    setEditingWorkflow(null);
  };

  const confirmDelete = (workflow: Workflow) => {
    setWorkflowToDelete(workflow);
    setIsDeleteConfirmOpen(true);
    setEditingWorkflow(null); // close edit modal if delete was triggered from there
  };

  const handleDeleteWorkflow = () => {
    if (!workflowToDelete) return;
    onUpdateWorkflows(workflows.filter(w => w.id !== workflowToDelete.id));
    setIsDeleteConfirmOpen(false);
    setWorkflowToDelete(null);
  };  

  return (
    <>
      {/* Workflows List */}
      <div className="bg-white">
        {workflows.map((workflow) => (
          <div
            key={workflow.id}
            className="flex items-center justify-between px-4 py-3 border-b border-[#F1F5F9] hover:bg-[#F8FAFC] transition-colors group"
          >
            <div className="flex items-center gap-3 flex-1">
              <svg width="6" height="6" viewBox="0 0 6 6" fill="none">
                <circle cx="3" cy="3" r="2" fill="#94A3B8" />
              </svg>
              <span className="font-medium text-sm text-[#0F172A]">
                {workflow.name}
              </span>
            </div>

            <div className="flex items-center gap-4">
              {/* Tags
              <div className="flex gap-1.5">
                {workflow.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-0.5 bg-[#EFF6FF] text-[#3B82F6] rounded text-[10px] font-semibold"
                  >
                    {tag}
                  </span>
                ))}
              </div> */}

              {/* Ticket Count */}
              <div className="flex items-center gap-1.5 min-w-[90px]">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path
                    d="M6 0L7.5 3.5L11 4L8.5 6.5L9 10L6 8L3 10L3.5 6.5L1 4L4.5 3.5L6 0Z"
                    fill="#94A3B8"
                  />
                </svg>
                <span className="text-xs text-[#64748B]">
                  {workflow.ticketCount} Tickets
                </span>
              </div>

              {/* Progress Bar */}
              <div className="flex items-center gap-2 min-w-[140px]">
                <div className="w-20 h-1.5 bg-[#E2E8F0] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#4F46E5] rounded-full transition-all"
                    style={{ width: `${workflow.progress}%` }}
                  />
                </div>
                <span className="text-[11px] font-semibold text-[#475569]">
                  {workflow.progress}%
                </span>
              </div>

              {/* Workflow Actions */}
              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => openEditWorkflowModal(workflow)} title="Edit workflow">
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M8.5 1.5L10.5 3.5L3.5 10.5L1 11L1.5 8.5L8.5 1.5Z" stroke="#94A3B8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M7 2.5L9.5 5" stroke="#94A3B8" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </button>
                <button onClick={() => confirmDelete(workflow)} title="Delete workflow">
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M9 3L3 9M3 3L9 9" stroke="#94A3B8" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </button>
              </div>

            </div>
          </div>
        ))}

        {/* Add Workflow Button */}
        <button
          onClick={openCreateWorkflowModal}
          className="w-full m-3 py-2 border-2 border-dashed border-[#CBD5E1] rounded-lg flex items-center justify-center gap-2 hover:bg-[#F8FAFC] hover:border-[#4F46E5] transition-all"
          style={{ width: "calc(100% - 24px)" }}
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M6 1V11M1 6H11" stroke="#94A3B8" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <span className="text-sm font-medium text-[#64748B]">
            Add Workflow
          </span>
        </button>
      </div>

      <AddWorkflow
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onSubmit={handleAddWorkflow}
      />
      <EditWorkflow
        isOpen={editingWorkflow !== null}
        workflow={editingWorkflow}
        onClose={() => setEditingWorkflow(null)}
        onSave={handleSaveWorkflow}
        onDelete={() => editingWorkflow && confirmDelete(editingWorkflow)}
      />
      <DeleteWorkflow
        isOpen={isDeleteConfirmOpen}
        workflowLabel={workflowToDelete?.name}
        onConfirm={handleDeleteWorkflow}
        onCancel={() => { setIsDeleteConfirmOpen(false); setWorkflowToDelete(null); }}
      />
    </>
  );
}