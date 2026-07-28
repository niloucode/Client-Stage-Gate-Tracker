"use client";

import { useState } from "react";
import { workflowCreateSchema } from "@/shared/schemas";
import { Label } from "@/shared/ui/label";

interface AddWorkflowFormData {
	name: string;
	start_date: Date | null;
	deadline_date: Date | null;
	finish_date: Date | null;
}

interface AddWorkflowProps {
	isOpen: boolean;
	onClose: () => void;
	onSubmit: (data: AddWorkflowFormData) => void;
}

const emptyFormData: AddWorkflowFormData = {
	name: "",
	start_date: null,
	deadline_date: null,
	finish_date: null,
};

type FieldErrors = Partial<Record<keyof AddWorkflowFormData, string>>;

export function AddWorkflow({ isOpen, onClose, onSubmit }: AddWorkflowProps) {
	const [formData, setFormData] = useState<AddWorkflowFormData>(emptyFormData);
	const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

	const MIN_GAP_MS = 24 * 60 * 60 * 1000;

	const handleStartDate = (d: Date | null) => {
		const next = d ? new Date(d) : null;
		setFormData((prev) => {
			if (
				next &&
				prev.finish_date &&
				next.getTime() + MIN_GAP_MS > prev.finish_date.getTime()
			) {
				return {
					...prev,
					start_date: next,
					finish_date: new Date(next.getTime() + MIN_GAP_MS),
				};
			}
			return { ...prev, start_date: next };
		});
	};

	const handleFinishDate = (d: Date | null) => {
		const next = d ? new Date(d) : null;
		setFormData((prev) => {
			if (
				next &&
				prev.start_date &&
				prev.start_date.getTime() + MIN_GAP_MS > next.getTime()
			) {
				return {
					...prev,
					finish_date: next,
					start_date: new Date(next.getTime() - MIN_GAP_MS),
				};
			}
			return { ...prev, finish_date: next };
		});
	};

	if (!isOpen) return null;

	const handleClose = () => {
		setFormData(emptyFormData);
		setFieldErrors({});
		onClose();
	};

	const handleSubmit = () => {
		const result = workflowCreateSchema.safeParse(formData);
		if (!result.success) {
			const flattened = result.error.flatten().fieldErrors;
			const mapped: FieldErrors = {};
			for (const [key, msgs] of Object.entries(flattened)) {
				if (msgs && msgs.length > 0)
					mapped[key as keyof AddWorkflowFormData] = msgs[0];
			}
			setFieldErrors(mapped);
			return;
		}
		onSubmit(formData);
		setFormData(emptyFormData);
		setFieldErrors({});
	};

	return (
		<div className="fixed inset-0 bg-foregroundal-main/50 flex items-center justify-center z-50">
			<div className="bg-neutral-surface rounded-xl shadow-xl w-full max-w-md p-6 relative">
				<button
					onClick={handleClose}
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

				<h2 className="text-xl font-bold text-[#0F172A] mb-2">
					Create New Workflow
				</h2>
				<p className="text-sm text-neutral-subtle mb-6">
					Fill in the details to create a new workflow.
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
							onChange={(e) =>
								setFormData({ ...formData, name: e.target.value })
							}
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
						<label className="block text-xs font-semibold text-[#475569] mb-1.5">
							Deadline Date
						</label>
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

				<div className="flex justify-end gap-3 mt-6 pt-4 border-t border-[#F1F5F9]">
					<button
						onClick={handleClose}
						className="px-4 py-2 text-sm font-semibold text-neutral-subtle hover:text-[#0F172A] transition-colors"
					>
						Cancel
					</button>
					<button
						onClick={handleSubmit}
						className="px-4 py-2 bg-brand-500 text-neutral-surface text-sm font-semibold rounded-lg hover:bg-[#4338CA] transition-all shadow-sm"
					>
						Create Workflow
					</button>
				</div>
			</div>
		</div>
	);
}
