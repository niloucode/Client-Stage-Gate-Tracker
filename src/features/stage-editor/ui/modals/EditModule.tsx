"use client";

import { useState, useEffect } from "react";
import type { Module } from "../../types";
import { Label } from "@/components/ui/label";
import { moduleCreateSchema } from "@/shared/schemas";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Trash2, Plus } from "lucide-react"
import { FormInput } from "@/shared/ui/"

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

	return (
		<Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose() }}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Edit Module</DialogTitle>
					<DialogDescription>Update the module details below.</DialogDescription>
				</DialogHeader>
				<div className="space-y-4 p-6">
					<FormInput
						variant="input"
						label="Module Name"
						required
						maxLength={35}
						value={formData.name}
						placeholder="Module Name"
						error={fieldErrors.name}
						onChange={(e) => {
							setFormData({ ...formData, name: e.target.value });
							setFieldErrors({});
						}}
					/>
					<FormInput
						variant="datetime-local"
						label="Start Date"
						type="datetime-local"
						value={formData.deadline_date
							? new Date(
									formData.deadline_date.getTime() -
										formData.deadline_date.getTimezoneOffset() * 60000,
								)
									.toISOString()
									.slice(0, 16)
							: ""}
						containerClassName="flex-1"
						onChange={(e) =>
							setFormData({
								...formData,
								deadline_date: e.target.value
									? new Date(e.target.value)
									: null,
							})
						}
					/>
				</div>
				<DialogFooter>
				<Button className="mr-auto" variant="destructive" onClick={onDelete}>
					<Trash2 />Delete Module 
				</Button>
				<Button variant="ghost" onClick={onClose}>
					Cancel
				</Button>
				<Button onClick={handleSubmit}>
					<Plus />Edit module
				</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
