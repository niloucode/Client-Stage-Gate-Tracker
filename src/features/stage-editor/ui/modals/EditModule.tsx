"use client";

import { useState, useEffect } from "react";
import type { Module } from "../../types";
import { Label } from "@/components/ui/label";
import { moduleCreateSchema } from "@/shared/schemas";
import { getFieldErrors } from "@/shared/lib/zod";
import {
	fromDateTimeLocalInput,
	toDateTimeLocalInput,
} from "@/shared/lib/scheduling";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Trash2, Plus } from "lucide-react"
import { FormInput } from "@/shared/ui/"

interface EditModuleFormData {
	name: string;
	planStart: Date | null;
	planEnd: Date | null;
	actualEnd: Date | null;
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
	planStart: module?.planStart ?? null,
	planEnd: module?.planEnd ?? null,
	actualEnd: module?.actualEnd ?? null,
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
			const mapped = getFieldErrors(result);
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
						label="Plan End"
						type="datetime-local"
						value={toDateTimeLocalInput(formData.planEnd)}
						containerClassName="flex-1"
						onChange={(e) =>
							setFormData({
								...formData,
								planEnd: fromDateTimeLocalInput(e.target.value),
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
