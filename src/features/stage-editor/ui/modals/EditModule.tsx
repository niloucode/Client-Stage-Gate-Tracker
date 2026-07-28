"use client";

import { useState, useEffect } from "react";
import type { Module } from "../../types";
import { Label } from "@/shared/ui/label";
import { moduleCreateSchema } from "@/shared/schemas";
import { Modal } from "@/shared/ui/modal"
import { Button } from "@/shared/ui/button"

interface EditModuleFormData {
	name: string;
	start_date: Date | null;
	deadline_date: Date | null;
	finish_date: Date | null;
}

interface EditModuleProps {
	isOpen: boolean;
	module: Module | null;
	onClose: () => void;
	onSave: (data: EditModuleFormData) => void;
	onDelete: () => void;
}

const toFormData = (module: Module | null): EditModuleFormData => ({
	name: module?.name ?? "",
	start_date: module?.start_date ?? null,
	deadline_date: module?.deadline_date ?? null,
	finish_date: module?.finish_date ?? null,
});

type FieldErrors = Partial<Record<"name", string>>;

export function EditModule({
	isOpen,
	module,
	onClose,
	onSave,
	onDelete,
}: EditModuleProps) {
	const [formData, setFormData] = useState<EditModuleFormData>(
		toFormData(module),
	);
	const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

	useEffect(() => {
		setFormData(toFormData(module));
		setFieldErrors({});
	}, [module]);

	const handleSubmit = () => {
		const result = moduleCreateSchema.safeParse(formData);
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
		<Modal
			isOpen={isOpen}
			onClose={onClose}
			title={"Edit Module"}
			subtitle={"Update the module details below."}
			width="xl"
			footer={<>
			<Button className="mr-auto" icon="delete" variant="red" onClick={onDelete}> 
				Delete Module 
			</Button>
			<Button variant="transparency" onClick={onClose}>
				Cancel
			</Button>
			<Button icon="add" onClick={handleSubmit}>
				Edit module
			</Button>
			</>}>
				<div className="space-y-4">
					<div>
						<Label required error={!!fieldErrors.name}>
							Module Name
						</Label>
						<input
							type="text"
							maxLength={35}
							value={formData.name}
							onChange={(e) => {
								setFormData({ ...formData, name: e.target.value });
								setFieldErrors({});
							}}
							placeholder="e.g., Authentication & Identity"
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
		</Modal>
	);
}
