"use client";

import { useState, useEffect } from "react";
import type { Workflow } from "../../types";
import { workflowCreateSchema } from "@/shared/schemas";
import { getFieldErrors } from "@/shared/lib/zod";
import { useResetOnOpen } from "@/shared/hooks/useResetOnOpen";
import { Label } from "@/components/ui/label";
import { DateTimePicker } from "@/components/ui/datetime-picker";
import { FormInput } from "@/components/ui/forminput";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogDescription,
	DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Plus, Save, Trash2 } from "lucide-react";

export interface WorkflowFormData {
	name: string;
	planStart: Date | null;
	planEnd: Date | null;
	actualEnd: Date | null;
}

export interface WorkflowModalProps {
	isOpen: boolean;
	onClose: () => void;
	/**
	 * Pass a `workflow` object for Edit mode, or `null`/`undefined` for Create mode.
	 */
	workflow?: Workflow | null;
	onSave: (data: WorkflowFormData) => void;
	onDelete?: () => void;
}

const emptyFormData: WorkflowFormData = {
	name: "",
	planStart: null,
	planEnd: null,
	actualEnd: null,
};

const getInitialFormData = (workflow?: Workflow | null): WorkflowFormData => ({
	name: workflow?.name ?? "",
	planStart: workflow?.planStart ?? null,
	planEnd: workflow?.planEnd ?? null,
	actualEnd: workflow?.actualEnd ?? null,
});

type FieldErrors = Partial<Record<keyof WorkflowFormData, string>>;

export function WorkflowModal({
	isOpen,
	onClose,
	workflow,
	onSave,
	onDelete,
}: WorkflowModalProps) {
	// Preserve the active workflow during exit animations so closing the modal
	// doesn't flash "Create New Workflow" while fading out.
	const [displayWorkflow, setDisplayWorkflow] = useState(workflow);

	useEffect(() => {
		if (isOpen) {
			setDisplayWorkflow(workflow);
		}
	}, [isOpen, workflow]);

	const isEditMode = Boolean(displayWorkflow);

	const [formData, setFormData] = useState<WorkflowFormData>(() =>
		getInitialFormData(displayWorkflow),
	);
	const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

	// Reset form when modal opens or active workflow changes
	useEffect(() => {
		if (isOpen) {
			setFormData(getInitialFormData(displayWorkflow));
			setFieldErrors({});
		}
	}, [isOpen, displayWorkflow]);

	useResetOnOpen(isOpen && !displayWorkflow, () => {
		setFormData(emptyFormData);
		setFieldErrors({});
	});

	const handleClose = () => {
		onClose();
	};

	const handleSubmit = () => {
		const result = workflowCreateSchema.safeParse(formData);
		if (!result.success) {
			const mapped = getFieldErrors(result);
			setFieldErrors(mapped);
			return;
		}
		setFieldErrors({});
		onSave(formData);
		handleClose();
	};

	return (
		<Dialog
			open={isOpen}
			onOpenChange={(open) => {
				if (!open) handleClose();
			}}
		>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>
						{isEditMode ? "Edit Workflow" : "Create New Workflow"}
					</DialogTitle>
					<DialogDescription>
						{isEditMode
							? "Update the workflow details below."
							: "Fill in the details to create a new workflow."}
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

					<div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
						<div>
							<Label>Plan Start</Label>
							<DateTimePicker
								value={formData.planStart ? new Date(formData.planStart) : undefined}
								onChange={(date) =>
									setFormData({
										...formData,
										planStart: date ?? null,
									})
								}
								placeholder="Pick plan start date"
								className="h-9 text-xs"
							/>
						</div>

						<div>
							<Label>Deadline Date</Label>
							<DateTimePicker
								value={formData.planEnd ? new Date(formData.planEnd) : undefined}
								onChange={(date) =>
									setFormData({
										...formData,
										planEnd: date ?? null,
									})
								}
								placeholder="Pick deadline date"
								className="h-9 text-xs"
							/>
						</div>
					</div>
				</div>

				<DialogFooter>
					{isEditMode && onDelete && (
						<Button
							type="button"
							className="mr-auto"
							variant="destructive"
							onClick={onDelete}
						>
							<Trash2 className="mr-2 h-4 w-4" /> Delete Workflow
						</Button>
					)}
					<Button type="button" variant="ghost" onClick={handleClose}>
						Cancel
					</Button>
					<Button type="button" onClick={handleSubmit}>
						{isEditMode ? (
							<>
								<Save className="mr-2 h-4 w-4" /> Save Changes
							</>
						) : (
							<>
								<Plus className="mr-2 h-4 w-4" /> Create Workflow
							</>
						)}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

// ── Backward-compatible Aliases ──────────────────────────────────────────────

export function AddWorkflow(
	props: Omit<WorkflowModalProps, "workflow" | "onSave"> & {
		onSubmit: (data: WorkflowFormData) => void;
	},
) {
	return <WorkflowModal {...props} workflow={null} onSave={props.onSubmit} />;
}

export function EditWorkflow(
	props: WorkflowModalProps & {
		onDelete: () => void;
	},
) {
	return <WorkflowModal {...props} />;
}