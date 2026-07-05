"use client";

import { useState } from "react";
import { workflowSchema } from "@/shared/schemas";

interface AddWorkflowFormData {
  name: string;
  startDate: Date | null;
  endDate: Date | null;
}

interface AddWorkflowProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: AddWorkflowFormData) => void;
}

const emptyFormData: AddWorkflowFormData = { name: "", startDate: null, endDate: null };

type FieldErrors = Partial<Record<keyof AddWorkflowFormData, string>>;

export function AddWorkflow({ isOpen, onClose, onSubmit }: AddWorkflowProps) {
  const [formData, setFormData] = useState<AddWorkflowFormData>(emptyFormData);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  if (!isOpen) return null;

  const handleClose = () => {
    setFormData(emptyFormData);
    setFieldErrors({});
    onClose();
  };

  const handleSubmit = () => {
    const result = workflowSchema.safeParse(formData);
    if (!result.success) {
      const flattened = result.error.flatten().fieldErrors;
      const mapped: FieldErrors = {};
      for (const [key, msgs] of Object.entries(flattened)) {
        if (msgs && msgs.length > 0) mapped[key as keyof AddWorkflowFormData] = msgs[0];
      }
      setFieldErrors(mapped);
      return;
    }
    onSubmit(formData);
    setFormData(emptyFormData);
    setFieldErrors({});
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 relative">
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-[#94A3B8] hover:text-[#475569] transition-colors"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M15 5L5 15M5 5L15 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>

        <h2 className="text-xl font-bold text-[#0F172A] mb-2">
          Create New Workflow
        </h2>
        <p className="text-sm text-[#64748B] mb-6">
          Fill in the details to create a new workflow.
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
            {fieldErrors.name && (
              <p className="text-xs text-red-500 mt-1">{fieldErrors.name}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#475569] mb-1.5">
                Start Date
              </label>
              <input
                type="datetime-local"
                value={formData.startDate ? new Date(formData.startDate.getTime() - formData.startDate.getTimezoneOffset() * 60000).toISOString().slice(0, 16) : ""}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value ? new Date(e.target.value) : null })}
                className="w-full px-3 py-2 bg-white border border-[#CBD5E1] rounded-lg text-sm text-[#0F172A] focus:outline-none focus:border-[#4F46E5] focus:ring-1 focus:ring-[#4F46E5] transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#475569] mb-1.5">
                End Date
              </label>
              <input
                type="datetime-local"
                value={formData.endDate ? new Date(formData.endDate.getTime() - formData.endDate.getTimezoneOffset() * 60000).toISOString().slice(0, 16) : ""}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value ? new Date(e.target.value) : null })}
                className="w-full px-3 py-2 bg-white border border-[#CBD5E1] rounded-lg text-sm text-[#0F172A] focus:outline-none focus:border-[#4F46E5] focus:ring-1 focus:ring-[#4F46E5] transition-all"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-[#F1F5F9]">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-sm font-semibold text-[#64748B] hover:text-[#0F172A] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 bg-[#4F46E5] text-white text-sm font-semibold rounded-lg hover:bg-[#4338CA] transition-all shadow-sm"
          >
            Create Workflow
          </button>
        </div>
      </div>
    </div>
  );
}