"use client";

import { useState, useEffect } from "react";
import { X, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Workflow } from "../../types";
import { Label } from "@/components/ui/label";
import { workflowCreateSchema } from "@/shared/schemas";
import { getFieldErrors } from "@/shared/lib/zod";
import {
	fromDateTimeLocalInput,
	toDateTimeLocalInput,
} from "@/shared/lib/scheduling";

interface EditWorkflowFormData {
	name: string;
	planStart: Date | null;
	planEnd: Date | null;
	actualEnd: Date | null;
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
	planStart: workflow?.planStart ?? null,
	planEnd: workflow?.planEnd ?? null,
	actualEnd: workflow?.actualEnd ?? null,
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
					<X size={20} />
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
							value={toDateTimeLocalInput(formData.planEnd)}
							onChange={(e) =>
								setFormData({
									...formData,
									planEnd: fromDateTimeLocalInput(e.target.value),
								})
							}
							className="w-full px-3 py-2 pr-14 bg-neutral-surface border border-brand-100 rounded-lg text-sm text-slate-900 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all"
						/>
					</div>
				</div>

				<div className="flex justify-between items-center mt-6 pt-4 border-t border-slate-100">
					<Button
						type="button"
						variant="danger"
						onClick={onDelete}
						className="flex items-center gap-2"
					>
						<Trash2 size={16} />
						Delete Workflow
					</Button>

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
