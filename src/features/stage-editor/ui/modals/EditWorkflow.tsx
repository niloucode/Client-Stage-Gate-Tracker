"use client";

import { useState, useEffect } from "react";
import type { Workflow } from "../../types";
import { Label } from "@/shared/ui/label";
import { workflowCreateSchema } from "@/shared/schemas";

interface EditWorkflowFormData {
	name: string;
	start_date: Date | null;
	deadline_date: Date | null;
	finish_date: Date | null;
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
	start_date: workflow?.start_date ?? null,
	deadline_date: workflow?.deadline_date ?? null,
	finish_date: workflow?.finish_date ?? null,
});

type FieldErrors = Partial<Record<"name", string>>;

export function EditWorkflow({
	isOpen,
	workflow,
	onClose,
	onSave,
	onDelete,
}: EditWorkflowProps) {
	const [formData, setFormData] = useState<EditWorkflowFormData>(
		toFormData(workflow),
	);
	const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

	useEffect(() => {
		setFormData(toFormData(workflow));
		setFieldErrors({});
	}, [workflow]);

	const handleSave = () => {
		const result = workflowCreateSchema.safeParse(formData);
		if (!result.success) {
			const flattened = result.error.flatten().fieldErrors;
			const mapped: FieldErrors = {};
			for (const [key, msgs] of Object.entries(flattened)) {
				if (msgs && msgs.length > 0) mapped[key as keyof FieldErrors] = msgs[0];
			}
			setFieldErrors(mapped);
			return;
		}
		setFieldErrors({});
		onSave(formData);
	};

	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 bg-foreground/50 flex items-center justify-center z-50">
			<div className="bg-neutral-surface rounded-xl shadow-xl w-full max-w-md p-6 relative">
				<button
					onClick={onClose}
					className="absolute top-4 right-4 text-[#94A3B8] hover:text-[#475569] transition-colors"
				>
					<svg width="20" height="20" viewBox="0 0 20 20" fill="none">
						<path
							d="M15 5L5 15M5 5L15 15"
							stroke="currentColor"
							strokeWidth="2"
							strokeLinecap="round"
						/>
					</svg>
				</button>

				<h2 className="text-xl font-bold text-[#0F172A] mb-2">Edit Workflow</h2>
				<p className="text-sm text-neutral-subtle mb-6">
					Update the workflow details below.
				</p>

				<div className="space-y-4">
					<div>
						<Label required error={!!fieldErrors.name}>
							Workflow Name
						</Label>
						<input
							type="text"
							maxLength={35}
							value={formData.name}
							onChange={(e) => {
								setFormData({ ...formData, name: e.target.value });
								setFieldErrors({});
							}}
							placeholder="e.g., User Login Flow"
							className={`w-full px-3 py-2 bg-neutral-surface border rounded-lg text-sm text-[#0F172A] focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all ${fieldErrors.name ? "border-red-400 focus:ring-red-400" : "border-brand-100"}`}
						/>
						<div className="flex justify-between mt-1">
							{fieldErrors.name ? (
								<p className="text-xs text-red-500">{fieldErrors.name}</p>
							) : (
								<span />
							)}
							<span className="text-[10px] text-[#94A3B8]">
								{formData.name.length}/35
							</span>
						</div>
					</div>

					<div>
						<Label>Deadline Date</Label>
						<input
							type="datetime-local"
							value={
								formData.deadline_date
									? new Date(
											formData.deadline_date.getTime() -
												formData.deadline_date.getTimezoneOffset() * 60000,
										)
											.toISOString()
											.slice(0, 16)
									: ""
							}
							onChange={(e) =>
								setFormData({
									...formData,
									deadline_date: e.target.value
										? new Date(e.target.value)
										: null,
								})
							}
							className="w-full px-3 py-2 bg-neutral-surface border border-brand-100 rounded-lg text-sm text-[#0F172A] focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all"
						/>
					</div>
				</div>

				<div className="flex justify-between items-center mt-6 pt-4 border-t border-[#F1F5F9]">
					<button
						onClick={onDelete}
						className="px-4 py-2 text-sm font-semibold text-[#EF4444] hover:text-[#DC2626] hover:bg-[#FEE2E2] rounded-lg transition-colors flex items-center gap-2"
					>
						<svg width="16" height="16" viewBox="0 0 16 16" fill="none">
							<path
								d="M12 4L4 12M4 4L12 12"
								stroke="currentColor"
								strokeWidth="2"
								strokeLinecap="round"
							/>
						</svg>
						Delete Workflow
					</button>

					<div className="flex gap-3 ml-auto">
						<button
							onClick={onClose}
							className="px-4 py-2 text-sm font-semibold text-neutral-subtle hover:text-[#0F172A] transition-colors"
						>
							Cancel
						</button>
						<button
							onClick={handleSave}
							className="px-4 py-2 bg-brand-500 text-neutral-surface text-sm font-semibold rounded-lg hover:bg-[#4338CA] transition-all shadow-sm"
						>
							Save Changes
						</button>
					</div>
				</div>
			</div>
		</div>
	);
}
