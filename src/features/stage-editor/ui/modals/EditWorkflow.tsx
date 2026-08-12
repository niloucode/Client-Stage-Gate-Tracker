"use client";

import { useState, useEffect } from "react";
import type { Workflow } from "../../types";
import { workflowCreateSchema } from "@/shared/schemas";
import { getFieldErrors } from "@/shared/lib/zod";
import {
	fromDateTimeLocalInput,
	toDateTimeLocalInput,
} from "@/shared/lib/scheduling";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogDescription,
	DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { FormInput } from "@/components/ui/forminput";

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

	return (
		<Dialog
			open={isOpen}
			onOpenChange={(open) => {
				if (!open) onClose();
			}}
		>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Edit Workflow</DialogTitle>
					<DialogDescription>
						Update the workflow details below.
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-4">
					<FormInput
						variant="input"
						label="Workflow Name"
						required
						maxLength={35}
						value={formData.name}
						placeholder="e.g., User Login Flow"
						error={fieldErrors.name}
						onChange={(e) => {
							setFormData({ ...formData, name: e.target.value });
							setFieldErrors({});
						}}
					/>

					<FormInput
						variant="datetime-local"
						label="Deadline Date"
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
						<Trash2 /> Delete Workflow
					</Button>
					<Button variant="ghost" onClick={onClose}>
						Cancel
					</Button>
					<Button onClick={handleSave}>
						Save Changes
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}