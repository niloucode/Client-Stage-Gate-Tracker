"use client";

import { useState, useMemo } from "react";
import { z } from "zod";
import { Plus, Save, Trash2 } from "lucide-react";

import type { Workflow } from "../../types";
import { getFieldErrors } from "@/shared/lib/zod";
import { useResetOnOpen } from "@/shared/hooks/useResetOnOpen";
import {
	hasValidPlannedRange,
	toSchedulingDates,
} from "@/shared/lib/scheduling";
import {
	Button,
	ConfirmationModal,
	DateTimePicker,
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	FormInput,
} from "@/components/ui";

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

const workflowModalSchema = baseWorkflowModalSchema.superRefine((data, ctx) => {
	if (!hasValidPlannedRange(toSchedulingDates(data))) {
		const message = "Start must be before End";
		ctx.addIssue({
			code: z.ZodIssueCode.custom,
			message,
			path: ["planStart"],
		});
		ctx.addIssue({
			code: z.ZodIssueCode.custom,
			message,
			path: ["planEnd"],
		});
	}
});

const getInitialFormData = (workflow?: Workflow | null): WorkflowFormData => ({
	name: workflow?.name ?? "",
	planStart: workflow?.planStart ? new Date(workflow.planStart) : null,
	planEnd: workflow?.planEnd ? new Date(workflow.planEnd) : null,
	actualEnd: workflow?.actualEnd ? new Date(workflow.actualEnd) : null,
});

type FieldErrors = Partial<Record<keyof WorkflowFormData, string>>;

export function WorkflowModal({
	isOpen,
	onClose,
	workflow,
	onSave,
	onDelete,
}: WorkflowModalProps) {
	const initialFormData = useMemo(() => getInitialFormData(workflow), [workflow]);

	const [displayWorkflow, setDisplayWorkflow] = useState(workflow);
	const [formData, setFormData] = useState<WorkflowFormData>(initialFormData);
	const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
	const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);

	const isEditMode = Boolean(displayWorkflow);

	// Reset form when modal opens
	useResetOnOpen(isOpen, () => {
		setDisplayWorkflow(workflow);
		setFormData(initialFormData);
		setFieldErrors({});
		setShowDiscardConfirm(false);
	});

	// Check if user has made unsaved modifications
	const isDirty = useMemo(() => {
		return (
			formData.name !== initialFormData.name ||
			formData.planStart?.getTime() !== initialFormData.planStart?.getTime() ||
			formData.planEnd?.getTime() !== initialFormData.planEnd?.getTime() ||
			formData.actualEnd?.getTime() !== initialFormData.actualEnd?.getTime()
		);
	}, [formData, initialFormData]);

	const handleClose = () => {
		setFormData(initialFormData);
		setFieldErrors({});
		setShowDiscardConfirm(false);
		onClose();
	};

	// Prevents exiting if unsaved changes exist
	const handleAttemptClose = () => {
		if (isDirty) {
			setShowDiscardConfirm(true);
			return;
		}
		handleClose();
	};

	const handleConfirmDiscard = () => {
		setShowDiscardConfirm(false);
		handleClose();
	};

	const clearFieldError = (field: keyof WorkflowFormData) => {
		if (fieldErrors[field]) {
			setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
		}
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
		<>
			<Dialog
				open={isOpen}
				onOpenChange={(open) => {
					if (!open) handleAttemptClose();
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
								clearFieldError("name");
							}}
						/>

						<div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
							<DateTimePicker
								label="Plan Start"
								required
								value={
									formData.planStart ? new Date(formData.planStart) : undefined
								}
								onChange={(date) => {
									setFormData({
										...formData,
										planStart: date ?? null,
									});
									clearFieldError("planStart");
								}}
								placeholder="Pick Planned Start"
								error={fieldErrors.planStart}
							/>

							<DateTimePicker
								label="Plan End"
								required
								value={
									formData.planEnd ? new Date(formData.planEnd) : undefined
								}
								onChange={(date) => {
									setFormData({
										...formData,
										planEnd: date ?? null,
									});
									clearFieldError("planEnd");
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
						<Button type="button" variant="ghost" onClick={handleAttemptClose}>
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

			{/* Discard Unsaved Changes Confirmation Modal */}
			<ConfirmationModal
				isOpen={showDiscardConfirm}
				title="Discard Unsaved Changes?"
				description="You have unsaved information in this workflow. Are you sure you want to discard your changes?"
				cancelLabel="Keep Editing"
				confirmLabel="Discard Changes"
				variant="destructive"
				onConfirm={handleConfirmDiscard}
				onCancel={() => setShowDiscardConfirm(false)}
			/>
		</>
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