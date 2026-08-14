"use client";

import { useState, useMemo } from "react";
import { z } from "zod";
import { Plus, Save } from "lucide-react";
import { useStore } from "@tanstack/react-form";

import type { Phase } from "../../types";
import { useAppForm, formErrorToMessage } from "@/shared/form";
import { useResetOnOpen } from "@/shared/hooks/useResetOnOpen";
import {
	hasValidActualRange,
	hasValidPlannedRange,
	toSchedulingDates,
} from "@/shared/lib/scheduling";
import { useCreatePhase, useUpdatePhase } from "@/entities/phase/mutations";
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

export interface PhaseModalProps {
	isOpen: boolean;
	onClose: () => void;
	stageId: string;
	/**
	 * Pass a `phase` object for Edit mode, or `null`/`undefined` for Create mode.
	 */
	phase?: Phase | null;
}

const basePhaseModalSchema = z.object({
	name: z
		.string()
		.min(1, "Phase name cannot be empty")
		.max(20, "Phase name must be 20 characters or less"),
	description: z.string().optional().default(""),
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

const phaseModalSchema = basePhaseModalSchema.superRefine((data, ctx) => {
	if (!hasValidPlannedRange(toSchedulingDates(data))) {
		const message = "Start must be before End";
		ctx.addIssue({
			code: "custom",
			message,
			path: ["planStart"],
		});
		ctx.addIssue({
			code: "custom",
			message,
			path: ["planEnd"],
		});
	}
	if (!hasValidActualRange(toSchedulingDates(data))) {
		const message = "Actual Start date must be before Actual End date";
		ctx.addIssue({
			code: "custom",
			message,
			path: ["actualStart"],
		});
		ctx.addIssue({
			code: "custom",
			message,
			path: ["actualEnd"],
		});
	}
});

type PhaseFormValues = z.input<typeof phaseModalSchema>;

export function PhaseModal({ isOpen, onClose, stageId, phase }: PhaseModalProps) {
	const isEditMode = Boolean(phase);
	const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);

	const createPhaseMutation = useCreatePhase();
	const updatePhaseMutation = useUpdatePhase();

	const defaultValues: PhaseFormValues = useMemo(
		() => ({
			name: phase?.name ?? "",
			description: phase?.description ?? "",
			planStart: phase?.planStart ? new Date(phase.planStart) : null,
			planEnd: phase?.planEnd ? new Date(phase.planEnd) : null,
			actualStart: phase?.actualStart ? new Date(phase.actualStart) : null,
			actualEnd: phase?.actualEnd ? new Date(phase.actualEnd) : null,
		}),
		[phase],
	);

	const form = useAppForm({
		defaultValues,
		validators: {
			onSubmit: phaseModalSchema,
		},
		onSubmit: async ({ value }) => {
			if (isEditMode && phase) {
				await updatePhaseMutation.mutateAsync({
					phaseId: phase.phase_id,
					stageId,
					name: value.name,
					description: value.description ?? "",
					planStart: value.planStart ?? undefined,
					planEnd: value.planEnd ?? undefined,
					actualStart: value.actualStart ?? undefined,
					actualEnd: value.actualEnd ?? undefined,
				});
				toast.add({
					title: "Phase Edited",
					description: `"${value.name}" has been edited successfully.`,
					type: "success",
				});
			} else {
				await createPhaseMutation.mutateAsync({
					stageId,
					name: value.name,
					description: value.description ?? "",
					planStart: value.planStart ?? undefined,
					planEnd: value.planEnd ?? undefined,
					actualStart: value.actualStart ?? undefined,
					actualEnd: value.actualEnd ?? undefined,
				});
				toast.add({
					title: "Phase Created",
					description: `"${value.name}" has been created successfully.`,
					type: "success",
				});
			}
			handleClose();
		},
	});

	// Correct TanStack Form store subscription
	const isDirty = useStore(form.store, (state) => state.isDirty);

	// Reset form whenever modal opens or active phase changes
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

	const isPending = createPhaseMutation.isPending || updatePhaseMutation.isPending;

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
							{isEditMode ? `Edit Phase ${phase?.number ?? ""}` : "Create New Phase"}
						</DialogTitle>
						<DialogDescription>
							{isEditMode
								? "Update the phase details."
								: "Fill in the details to create a new phase."}
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
											label="Phase Name"
											required
											placeholder="e.g., Discovery"
											maxLength={20}
											value={field.state.value}
											onChange={(e) => field.handleChange(e.target.value)}
											error={
												formErrorToMessage(field.state.meta.errors[0]) ??
												undefined
											}
										/>
									)}
								</form.AppField>

								<form.AppField name="description">
									{(field) => (
										<FormInput
											variant="textarea"
											label="Description"
											placeholder="Describe the objectives and scope of this phase..."
											rows={3}
											maxLength={60}
											value={field.state.value}
											onChange={(e) => field.handleChange(e.target.value)}
											error={
												formErrorToMessage(field.state.meta.errors[0]) ??
												undefined
											}
										/>
									)}
								</form.AppField>

								{/* Date selection using DateTimePicker */}
								<div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
									<form.AppField name="planStart">
										{(field) => {
											const error = formErrorToMessage(
												field.state.meta.errors[0],
											);
											return (
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
													error={error ?? undefined}
												/>
											);
										}}
									</form.AppField>

									<form.AppField name="planEnd">
										{(field) => {
											const error = formErrorToMessage(
												field.state.meta.errors[0],
											);
											return (
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
													error={error ?? undefined}
												/>
											);
										}}
									</form.AppField>
								</div>
							</div>

							<DialogFooter className="mt-6" showCloseButton={false}>
								<Button
									type="button"
									variant="ghost"
									onClick={handleAttemptClose}
									disabled={isPending}
								>
									Cancel
								</Button>
								<form.SubmitButton pendingLabel={isEditMode ? "Saving…" : "Adding…"}>
									{isEditMode ? (
										<>
											<Save className="mr-2 h-4 w-4" /> Save Changes
										</>
									) : (
										<>
											<Plus className="mr-2 h-4 w-4" /> Add Phase
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
				description="You have unsaved information in this phase. Are you sure you want to discard your changes?"
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

export function AddPhase(props: Omit<PhaseModalProps, "phase">) {
	return <PhaseModal {...props} phase={null} />;
}

export function EditPhase(props: PhaseModalProps) {
	return <PhaseModal {...props} />;
}