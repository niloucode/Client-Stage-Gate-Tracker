"use client";

import { useState } from "react";
import type { Workflow } from "../types";
import { AddWorkflow } from "@/features/project-editor/ui/modals/AddWorkflow";
import { EditWorkflow } from "@/features/project-editor/ui/modals/EditWorkflow";
import { DeleteWorkflow } from "@/features/project-editor/ui/modals/DeleteWorkflow";

interface WorkflowsListProps {
  workflows: Workflow[];
  moduleId: string;
  onUpdateWorkflows: (workflows: Workflow[]) => void;
}

export function WorkflowsList({ workflows, onUpdateWorkflows }: WorkflowsListProps) {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingWorkflow, setEditingWorkflow] = useState<Workflow | null>(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [workflowToDelete, setWorkflowToDelete] = useState<Workflow | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const openCreateWorkflowModal = () => setIsAddOpen(true);
  const openEditWorkflowModal = (workflow: Workflow) => setEditingWorkflow(workflow);

  const formatDate = (date: Date) => {
    return `${date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    })}`;
  };

  const handleAddWorkflow = (data: { name: string; startDate: Date | null; endDate: Date | null }) => {
    const newWorkflow: Workflow = {
      id: Date.now().toString(),
      name: data.name || "New Workflow",
      startDate: data.startDate || null,
      endDate: data.endDate || null,
      createdAt: new Date(),
      ticketCount: 0,
      progress: 0,
    };
    onUpdateWorkflows([...workflows, newWorkflow]);
    setIsAddOpen(false);
  };

  const handleSaveWorkflow = (data: { name: string; startDate: Date | null; endDate: Date | null }) => {
    if (!editingWorkflow) return;
    onUpdateWorkflows(workflows.map(w =>
      w.id === editingWorkflow.id
        ? { 
            ...w, 
            name: data.name || "New Workflow", 
            startDate: data.startDate || null,
            endDate: data.endDate || null,
          }
        : w
    ));
    setEditingWorkflow(null);
  };

  const confirmDelete = (workflow: Workflow) => {
    setWorkflowToDelete(workflow);
    setIsDeleteConfirmOpen(true);
    setEditingWorkflow(null);
  };

  const handleDeleteWorkflow = () => {
    if (!workflowToDelete) return;
    onUpdateWorkflows(workflows.filter(w => w.id !== workflowToDelete.id));
    setIsDeleteConfirmOpen(false);
    setWorkflowToDelete(null);
  };

  // Drag and Drop Handlers
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    setTimeout(() => {
      (e.target as HTMLElement).style.opacity = '0.5';
    }, 0);
  };

  const handleDragEnd = (e: React.DragEvent) => {
    (e.target as HTMLElement).style.opacity = '1';
    setDraggedIndex(null);
    document.querySelectorAll('.drag-over-workflow').forEach(el => {
      el.classList.remove('drag-over-workflow');
    });
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    
    if (draggedIndex === null || draggedIndex === index) return;
    
    document.querySelectorAll('.drag-over-workflow').forEach(el => {
      el.classList.remove('drag-over-workflow');
    });
    
    const target = e.currentTarget as HTMLElement;
    target.classList.add('drag-over-workflow');
  };

  const handleDragLeave = (e: React.DragEvent) => {
    (e.currentTarget as HTMLElement).classList.remove('drag-over-workflow');
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    
    const dragIndex = draggedIndex;
    if (dragIndex === null || dragIndex === dropIndex) {
      setDraggedIndex(null);
      return;
    }

    document.querySelectorAll('.drag-over-workflow').forEach(el => {
      el.classList.remove('drag-over-workflow');
    });

    const reorderedWorkflows = [...workflows];
    const [draggedWorkflow] = reorderedWorkflows.splice(dragIndex, 1);
    reorderedWorkflows.splice(dropIndex, 0, draggedWorkflow);
    
    onUpdateWorkflows(reorderedWorkflows);
    setDraggedIndex(null);
  };

  return (
    <>
      {/* Workflows List */}
      <div className="bg-white">
        {workflows.map((workflow, index) => (
          <div
            key={workflow.id}
            className="flex items-center justify-between px-4 py-3 border-b border-[#F1F5F9] hover:bg-[#F8FAFC] transition-colors group cursor-grab active:cursor-grabbing"
            draggable={true}
            onDragStart={(e) => handleDragStart(e, index)}
            onDragEnd={handleDragEnd}
            onDragOver={(e) => handleDragOver(e, index)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, index)}
          >
            <div className="flex items-center gap-3 flex-1">
              {/* Drag handle */}
              <svg width="8" height="12" viewBox="0 0 8 12" fill="none" className="text-[#94A3B8] opacity-40 group-hover:opacity-100 transition-opacity">
                <circle cx="1" cy="1" r="1" fill="currentColor" />
                <circle cx="1" cy="6" r="1" fill="currentColor" />
                <circle cx="1" cy="11" r="1" fill="currentColor" />
                <circle cx="5" cy="1" r="1" fill="currentColor" />
                <circle cx="5" cy="6" r="1" fill="currentColor" />
                <circle cx="5" cy="11" r="1" fill="currentColor" />
              </svg>
              <div>
                <span className="font-normal text-sm text-[#0F172A]">
                  {workflow.name}
                </span>
                <p className="text-xs text-[#8392a6] mt-0.5">
                  Created: {formatDate(workflow.createdAt)}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* Date Badge */}
              {workflow.startDate && workflow.endDate && (
                <div className="px-3 py-1 bg-[#ffffff] border border-slate-300 rounded-md">
                  <span className="font-medium text-xs text-slate-400">
                    {formatDate(workflow.startDate)} – {formatDate(workflow.endDate)}
                  </span>
                </div>
              )}

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

      {/* Add Workflow Modal */}
      <AddWorkflow
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onSubmit={handleAddWorkflow}
      />

      {/* Edit Workflow Modal */}
      <EditWorkflow
        isOpen={editingWorkflow !== null}
        workflow={editingWorkflow}
        onClose={() => setEditingWorkflow(null)}
        onSave={handleSaveWorkflow}
        onDelete={() => editingWorkflow && confirmDelete(editingWorkflow)}
      />

      {/* Delete Confirmation Modal */}
      <DeleteWorkflow
        isOpen={isDeleteConfirmOpen}
        workflowLabel={workflowToDelete?.name}
        onConfirm={handleDeleteWorkflow}
        onCancel={() => { setIsDeleteConfirmOpen(false); setWorkflowToDelete(null); }}
      />
    </>
  );
}