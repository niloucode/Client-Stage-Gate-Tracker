"use client";

import { useState, useMemo } from "react";
import type { z } from "zod";
import { Plus, Save, Trash2 } from "lucide-react";
import { useSelector } from "@tanstack/react-form";

import { useAppForm, formErrorToMessage } from "@/shared/form";
import { useResetOnOpen } from "@/shared/hooks/useResetOnOpen";
import { stageCreateSchema } from "@/shared/schemas";
import { createStage, updateStage } from "@/entities/stage";
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

export interface StageModalStage {
	stage_id: string;
	name: string;
	description?: string | null;
	planStart?: Date | null;
	planEnd?: Date | null;
}

export interface StageModalProps {
	isOpen: boolean;
	onClose: () => void;
	/**
	 * Pass a `stage` object for Edit mode, or `null`/`undefined` for Create mode.
	 */
	stage?: StageModalStage | null;
	projectId: string;
	/**
	 * Called after a successful create or update. Receives the saved stage
	 * so callers can sync their queries.
	 */
	onSaved?: (saved: { stage_id: string; name: string }) => void;
	onDelete?: () => void;
}

const stageModalSchema = stageCreateSchema;

type StageFormValues = z.input<typeof stageModalSchema>;

export function StageModal({
	isOpen,
	onClose,
	stage,
	projectId,
	onSaved,
	onDelete,
}: StageModalProps) {
	const isEditMode = Boolean(stage);
	const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);

	const defaultValues: StageFormValues = useMemo(
		() => ({
			name: stage?.name ?? "",
			description: stage?.description ?? "",
			planStart: stage?.planStart ? new Date(stage.planStart) : null,
			planEnd: stage?.planEnd ? new Date(stage.planEnd) : null,
		}),
		[stage],
	);

	const form = useAppForm({
		defaultValues,
		validators: { onSubmit: stageModalSchema },
		onSubmit: async ({ value }) => {
			try {
				if (isEditMode && stage) {
					const res = await updateStage(
						stage.stage_id,
						value.name,
						value.description ?? "",
						value.planStart!,
						value.planEnd!,
					);

					if (!res.success || !res.data) {
						const errMsg =
							typeof res.error === "string"
								? res.error
								: "Failed to update the stage.";
						toast.add({
							title: "Edit Failed",
							description: errMsg,
							type: "error",
						});
						return;
					}

					toast.add({
						title: "Stage Edited",
						description: `"${value.name}" has been updated successfully.`,
						type: "success",
					});
					onSaved?.({
						stage_id: stage.stage_id,
						name: res.data.name,
					});
				} else {
					// 1. Trigger Loading Toast upon adding
					toast.add({
						title: "Creating Stage",
						description: "Please wait while your stage is being created...",
						type: "loading",
					});

					const res = await createStage(
						projectId,
						value.name,
						value.description ?? "",
						value.planStart!,
						value.planEnd!,
					);

					if (!res.success || !res.data) {
						const errMsg =
							typeof res.error === "string"
								? res.error
								: "Failed to create the stage.";
						toast.add({
							title: "Creation Failed",
							description: errMsg,
							type: "error",
						});
						return;
					}

					// 2. Trigger Success Toast
					toast.add({
						title: "Stage Created",
						description: `"${value.name}" has been created successfully.`,
						type: "success",
					});
					onSaved?.({
						stage_id: res.data.stage_id,
						name: res.data.name,
					});
				}
				handleClose();
			} catch (error) {
				toast.add({
					title: isEditMode ? "Edit Failed" : "Creation Failed",
					description:
						error instanceof Error
							? error.message
							: "An error occurred while saving the stage.",
					type: "error",
				});
			}
		},
	});

	// Correct TanStack Form store subscription
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
							{isEditMode
								? `Edit Stage ${stage?.name ?? ""}`
								: "Create New Stage"}
						</DialogTitle>
						<DialogDescription>
							{isEditMode
								? "Update the stage details below."
								: "Fill in the details to create a new stage."}
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
											label="Stage Name"
											required
											maxLength={20}
											value={field.state.value}
											placeholder="e.g., Discovery & UX"
											error={
												formErrorToMessage(field.state.meta.errors[0]) ??
												undefined
											}
											onChange={(e) => field.handleChange(e.target.value)}
										/>
									)}
								</form.AppField>

								<form.AppField name="description">
									{(field) => (
										<FormInput
											variant="textarea"
											label="Description"
											maxLength={160}
											rows={3}
											value={field.state.value}
											placeholder="Describe the objectives and scope of this stage..."
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
										<Trash2 className="mr-2 h-4 w-4" /> Delete Stage
									</Button>
								)}
								<Button
									type="button"
									variant="ghost"
									onClick={handleAttemptClose}
									disabled={form.state.isSubmitting}
								>
									Cancel
								</Button>
								<form.SubmitButton
									pendingLabel={isEditMode ? "Saving…" : "Adding…"}
								>
									{isEditMode ? (
										<>
											<Save className="mr-2 h-4 w-4" /> Save Changes
										</>
									) : (
										<>
											<Plus className="mr-2 h-4 w-4" /> Add Stage
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
				description="You have unsaved information in this stage. Are you sure you want to discard your changes?"
				cancelLabel="Keep Editing"
				confirmLabel="Discard Changes"
				variant="destructive"
				onConfirm={handleConfirmDiscard}
				onCancel={() => setShowDiscardConfirm(false)}
			/>
		</>
	);
}
