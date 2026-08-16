"use client";

import { useState, useMemo } from "react";
import { z } from "zod";
import { Plus, Save, Trash2 } from "lucide-react";
import { useSelector } from "@tanstack/react-form";

import type { Workflow } from "../../types";
import { useAppForm, formErrorToMessage } from "@/shared/form";
import { useResetOnOpen } from "@/shared/hooks/useResetOnOpen";
import {
	hasValidPlannedRange,
	toSchedulingDates,
} from "@/shared/lib/scheduling";
import {
	useCreateWorkflow,
	useUpdateWorkflow,
} from "@/entities/workflow/mutations";
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
	toast,
} from "@/components/ui";

export interface WorkflowModalProps {
	isOpen: boolean;
	onClose: () => void;
	/**
	 * Pass a `workflow` object for Edit mode, or `null`/`undefined` for Create mode.
	 */
	workflow?: Workflow | null;
	moduleId: string;
	stageId: string;
	onDelete?: () => void;
}

const workflowModalSchema = z
	.object({
		name: z
			.string()
			.min(1, "Workflow name is required")
			.max(35, "Workflow name must be 35 characters or less"),
		planStart: z
			.date()
			.nullable()
			.refine((val): val is Date => val !== null, {
				error: "Plan Start Date is required",
			}),
		planEnd: z
			.date()
			.nullable()
			.refine((val): val is Date => val !== null, {
				error: "Plan End Date is required",
			}),
		actualStart: z.date().optional().nullable(),
		actualEnd: z.date().optional().nullable(),
	})
	.superRefine((data, ctx) => {
		if (!hasValidPlannedRange(toSchedulingDates(data))) {
			ctx.addIssue({
				code: "custom",
				message: "Start must be before End",
				path: ["planStart"],
			});
			ctx.addIssue({
				code: "custom",
				message: "End must be after Start",
				path: ["planEnd"],
			});
		}
	});

type WorkflowFormValues = z.input<typeof workflowModalSchema>;

function WorkflowModal({
	isOpen,
	onClose,
	workflow,
	moduleId,
	stageId,
	onDelete,
}: WorkflowModalProps) {
	const isEditMode = Boolean(workflow);
	const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);

	const createWorkflowMutation = useCreateWorkflow();
	const updateWorkflowMutation = useUpdateWorkflow();

	const defaultValues: WorkflowFormValues = useMemo(
		() => ({
			name: workflow?.name ?? "",
			planStart: workflow?.planStart ? new Date(workflow.planStart) : null,
			planEnd: workflow?.planEnd ? new Date(workflow.planEnd) : null,
			actualStart: workflow?.actualStart
				? new Date(workflow.actualStart)
				: null,
			actualEnd: workflow?.actualEnd ? new Date(workflow.actualEnd) : null,
		}),
		[workflow],
	);

	const form = useAppForm({
		defaultValues,
		validators: { onSubmit: workflowModalSchema },
		onSubmit: async ({ value }) => {
			try {
				if (isEditMode && workflow) {
					await updateWorkflowMutation.mutateAsync({
						workflowId: workflow.workflow_id,
						stageId,
						name: value.name,
						// non-null guaranteed by workflowModalSchema (required plan dates)
						planStart: value.planStart!,
						planEnd: value.planEnd!,
						actualStart: value.actualStart ?? undefined,
						actualEnd: value.actualEnd ?? undefined,
					});
					toast.add({
						title: "Workflow Edited",
						description: `"${value.name}" has been edited successfully.`,
						type: "success",
					});
				} else {
					// 1. Trigger Loading Toast upon adding
					toast.add({
						title: "Creating Workflow",
						description: "Please wait while your workflow is being created...",
						type: "loading",
					});

					// 2. Perform create mutation
					await createWorkflowMutation.mutateAsync({
						moduleId,
						stageId,
						name: value.name,
						// non-null guaranteed by workflowModalSchema (required plan dates)
						planStart: value.planStart!,
						planEnd: value.planEnd!,
						actualStart: value.actualStart ?? undefined,
						actualEnd: value.actualEnd ?? undefined,
					});

					// 3. Trigger Success Toast
					toast.add({
						title: "Workflow Created",
						description: `"${value.name}" has been created successfully.`,
						type: "success",
					});
				}
				handleClose();
			} catch (error) {
				toast.add({
					title: isEditMode ? "Edit Failed" : "Creation Failed",
					description:
						error instanceof Error
							? error.message
							: "An error occurred while saving the workflow.",
					type: "error",
				});
			}
		},
	});

	// Correct TanStack Form store subscription (useStore is a deprecated alias).
	const isDirty = useSelector(form.store, (state) => state.isDirty);

	// Reset form whenever modal opens
	useResetOnOpen(isOpen, () => {
		form.reset(defaultValues);
		setShowDiscardConfirm(false);
	});

	const handleClose = () => {
		form.reset();
		setShowDiscardConfirm(false);
		onClose();
	};

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

	const isPending =
		createWorkflowMutation.isPending || updateWorkflowMutation.isPending;

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

					<form.AppForm>
						<form
							onSubmit={(e) => {
								e.preventDefault();
								e.stopPropagation();
								void form.handleSubmit();
							}}
						>
							<div className="flex flex-col gap-4">
								<form.AppField name="name">
									{(field) => (
										<FormInput
											label="Workflow Name"
											required
											maxLength={35}
											value={field.state.value}
											placeholder="e.g., User Login Flow"
											error={
												formErrorToMessage(field.state.meta.errors[0]) ??
												undefined
											}
											onChange={(e) => field.handleChange(e.target.value)}
										/>
									)}
								</form.AppField>

								<div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
									<form.AppField name="planStart">
										{(field) => (
											<DateTimePicker
												label="Plan Start"
												required
												value={
													field.state.value
														? new Date(field.state.value)
														: undefined
												}
												onChange={(date) => field.handleChange(date ?? null)}
												placeholder="Pick Planned Start"
												error={
													formErrorToMessage(field.state.meta.errors[0]) ??
													undefined
												}
											/>
										)}
									</form.AppField>

									<form.AppField name="planEnd">
										{(field) => (
											<DateTimePicker
												label="Plan End"
												required
												value={
													field.state.value
														? new Date(field.state.value)
														: undefined
												}
												onChange={(date) => field.handleChange(date ?? null)}
												placeholder="Pick Planned End"
												error={
													formErrorToMessage(field.state.meta.errors[0]) ??
													undefined
												}
											/>
										)}
									</form.AppField>
								</div>
							</div>

							<DialogFooter className="mt-6" showCloseButton={false}>
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
								<Button
									type="button"
									variant="ghost"
									onClick={handleAttemptClose}
									disabled={isPending}
								>
									Cancel
								</Button>
								<form.SubmitButton
									pendingLabel={isEditMode ? "Saving…" : "Creating…"}
								>
									{isEditMode ? (
										<>
											<Save className="mr-2 h-4 w-4" /> Save Changes
										</>
									) : (
										<>
											<Plus className="mr-2 h-4 w-4" /> Create Workflow
										</>
									)}
								</form.SubmitButton>
							</DialogFooter>
						</form>
					</form.AppForm>
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

export function AddWorkflow(props: Omit<WorkflowModalProps, "workflow">) {
	return <WorkflowModal {...props} workflow={null} />;
}

export function EditWorkflow(props: WorkflowModalProps) {
	return <WorkflowModal {...props} />;
}
