"use client";

import { useState, useEffect } from "react";
import type { Workflow } from "../../types";
import { Label } from "@/components/ui/label";
import { workflowCreateSchema } from "@/shared/schemas";
import { getFieldErrors } from "@/shared/lib/zod";

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
			const mapped = getFieldErrors(result);
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
					className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors"
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

				<h2 className="text-xl font-bold text-slate-900 mb-2">Edit Workflow</h2>
				<p className="text-sm text-neutral-subtle mb-6">
					Update the workflow details below.
				</p>

				<div className="space-y-4">
					<div>
						<div className="flex justify-between items-center">
							<Label required error={!!fieldErrors.name}>
								Workflow Name
							</Label>
							<span className="text-[10px] text-muted-foreground">
								{formData.name.length}/35
							</span>
						</div>
						<input
							type="text"
							maxLength={35}
							value={formData.name}
							onChange={(e) => {
								setFormData({ ...formData, name: e.target.value });
								setFieldErrors({});
							}}
							placeholder="e.g., User Login Flow"
							className={`w-full px-3 py-2 bg-neutral-surface border rounded-lg text-sm text-slate-900 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all ${fieldErrors.name ? "border-red-400 focus:ring-red-400" : "border-brand-100"}`}
						/>
						<div className="flex justify-between mt-1">
							{fieldErrors.name ? (
								<p className="text-xs text-destructive">{fieldErrors.name}</p>
							) : (
								<span />
							)}
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
							className="w-full px-3 py-2 pr-14 bg-neutral-surface border border-brand-100 rounded-lg text-sm text-slate-900 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all"
						/>
					</div>
				</div>

				<div className="flex justify-between items-center mt-6 pt-4 border-t border-slate-100">
					<button
						onClick={onDelete}
						className="px-4 py-2 text-sm font-semibold text-red-500 hover:text-red-600 hover:bg-[#FEE2E2] rounded-lg transition-colors flex items-center gap-2"
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
							className="px-4 py-2 text-sm font-semibold text-neutral-subtle hover:text-slate-900 transition-colors"
						>
							Cancel
						</button>
						<button
							onClick={handleSave}
							className="px-4 py-2 bg-brand-500 text-neutral-surface text-sm font-semibold rounded-lg hover:bg-indigo-700 transition-all shadow-sm"
						>
							Save Changes
						</button>
					</div>
				</div>
			</div>
		</div>
	);
}
