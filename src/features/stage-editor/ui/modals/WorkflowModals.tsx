"use client";

import { useState } from "react";
import { z } from "zod";
import type { Workflow } from "../../types";
import { getFieldErrors } from "@/shared/lib/zod";
import {
	hasValidPlannedRange,
	toSchedulingDates,
} from "@/shared/lib/scheduling";
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

const baseWorkflowModalSchema = z.object({
	name: z
		.string()
		.min(1, "Workflow name is required")
		.max(35, "Workflow name must be 35 characters or less"),
	planStart: z
		.date()
		.nullable()
		.refine((val): val is Date => val !== null, {
			message: "Plan Start Date is required",
		}),
	planEnd: z
		.date()
		.nullable()
		.refine((val): val is Date => val !== null, {
			message: "Plan End Date is required",
		}),
	actualStart: z.date().optional().nullable(),
	actualEnd: z.date().optional().nullable(),
});

const workflowModalSchema = baseWorkflowModalSchema.refine(
	(data) => hasValidPlannedRange(toSchedulingDates(data)),
	{
		message: "Plan Start must be before or equal to Deadline Date",
		path: ["planStart"],
	},
);

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
	// Sync props to state during render (React pattern for adjusting state based on props)
	const [prevIsOpen, setPrevIsOpen] = useState(isOpen);
	const [prevWorkflow, setPrevWorkflow] = useState(workflow);

	const [displayWorkflow, setDisplayWorkflow] = useState(workflow);
	const [formData, setFormData] = useState<WorkflowFormData>(() =>
		getInitialFormData(workflow),
	);
	const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

	// Adjust state synchronously during render when props change
	if (isOpen && (!prevIsOpen || prevWorkflow !== workflow)) {
		setPrevIsOpen(true);
		setPrevWorkflow(workflow);
		setDisplayWorkflow(workflow);
		setFormData(getInitialFormData(workflow));
		setFieldErrors({});
	} else if (!isOpen && prevIsOpen) {
		setPrevIsOpen(false);
	}

	const isEditMode = Boolean(displayWorkflow);

	const handleClose = () => {
		onClose();
	};

	const handleSubmit = () => {
		const result = workflowModalSchema.safeParse(formData);
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
							setFieldErrors((prev) => ({ ...prev, name: undefined }));
						}}
					/>

					<div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
						<DateTimePicker
							label="Plan Start"
							required
							value={formData.planStart ? new Date(formData.planStart) : undefined}
							onChange={(date) => {
								setFormData({
									...formData,
									planStart: date ?? null,
								});
								setFieldErrors((prev) => ({ ...prev, planStart: undefined }));
							}}
							placeholder="Pick Planned Start"
							error={fieldErrors.planStart}
						/>

						<DateTimePicker
							label="Plan End"
							required
							value={formData.planEnd ? new Date(formData.planEnd) : undefined}
							onChange={(date) => {
								setFormData({
									...formData,
									planEnd: date ?? null,
								});
								setFieldErrors((prev) => ({ ...prev, planEnd: undefined }));
							}}
							placeholder="Pick Planned End"
							error={fieldErrors.planEnd}
						/>
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