"use client";

import { useState, useEffect } from "react";
import type { Workflow } from "../../types";

interface EditWorkflowFormData {
  name: string;
  tags: string;
}

interface EditWorkflowProps {
  isOpen: boolean;
  workflow: Workflow | null;
  onClose: () => void;
  onSave: (data: EditWorkflowFormData) => void;
  onDelete: () => void;
}

const toFormData = (workflow: Workflow | null): EditWorkflowFormData => ({
  name: workflow?.name ?? "",
  tags: workflow?.tags.join(", ") ?? "",
});

export function EditWorkflow({ isOpen, workflow, onClose, onSave, onDelete }: EditWorkflowProps) {
  const [formData, setFormData] = useState<EditWorkflowFormData>(toFormData(workflow));

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setFormData(toFormData(workflow));
  }, [workflow]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[#94A3B8] hover:text-[#475569] transition-colors"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M15 5L5 15M5 5L15 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>

        <h2 className="text-xl font-bold text-[#0F172A] mb-2">
          Edit Workflow
        </h2>
        <p className="text-sm text-[#64748B] mb-6">
          Update the workflow details below.
        </p>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#475569] mb-1.5">
              Workflow Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., User Login Flow"
              className="w-full px-3 py-2 bg-white border border-[#CBD5E1] rounded-lg text-sm text-[#0F172A] focus:outline-none focus:border-[#4F46E5] focus:ring-1 focus:ring-[#4F46E5] transition-all"
            />
          </div>
        </div>

        <div className="flex justify-between items-center mt-6 pt-4 border-t border-[#F1F5F9]">
          <button
            onClick={onDelete}
            className="px-4 py-2 text-sm font-semibold text-[#EF4444] hover:text-[#DC2626] hover:bg-[#FEE2E2] rounded-lg transition-colors flex items-center gap-2"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M12 4L4 12M4 4L12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            Delete Workflow
          </button>

          <div className="flex gap-3 ml-auto">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold text-[#64748B] hover:text-[#0F172A] transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => onSave(formData)}
              className="px-4 py-2 bg-[#4F46E5] text-white text-sm font-semibold rounded-lg hover:bg-[#4338CA] transition-all shadow-sm"
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}