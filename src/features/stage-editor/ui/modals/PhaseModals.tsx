"use client";

import { z } from "zod";
import { useAppForm, formErrorToMessage } from "@/shared/form";
import {
	hasValidActualRange,
	hasValidPlannedRange,
	toSchedulingDates,
} from "@/shared/lib/scheduling";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FormInput } from "@/components/ui/forminput";
import { DateTimePicker } from "@/components/ui/datetime-picker";
import { Label } from "@/components/ui/label";
import { useCreatePhase, useUpdatePhase } from "@/entities/phase/mutations";
import { useResetOnOpen } from "@/shared/hooks/useResetOnOpen";
import { Plus, Save } from "lucide-react";
import type { Phase } from "../../types";

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
			message: "Plan start date is required",
		}),
	planEnd: z
		.date()
		.nullable()
		.refine((val): val is Date => val !== null, {
			message: "Plan end date is required",
		}),
	actualStart: z.date().optional().nullable(),
	actualEnd: z.date().optional().nullable(),
});

const phaseModalSchema = basePhaseModalSchema
	.refine((data) => hasValidPlannedRange(toSchedulingDates(data)), {
		message: "Plan Start must be before or equal to Plan End",
		path: ["planStart"],
	})
	.refine((data) => hasValidActualRange(toSchedulingDates(data)), {
		message: "Actual Start must be before or equal to Actual End",
		path: ["actualStart"],
	});

type PhaseFormValues = z.input<typeof phaseModalSchema>;

export function PhaseModal({ isOpen, onClose, stageId, phase }: PhaseModalProps) {
	const isEditMode = Boolean(phase);

	const createPhaseMutation = useCreatePhase();
	const updatePhaseMutation = useUpdatePhase();

	const defaultValues: PhaseFormValues = {
		name: phase?.name ?? "",
		description: phase?.description ?? "",
		planStart: phase?.planStart ? new Date(phase.planStart) : null,
		planEnd: phase?.planEnd ? new Date(phase.planEnd) : null,
		actualStart: phase?.actualStart ? new Date(phase.actualStart) : null,
		actualEnd: phase?.actualEnd ? new Date(phase.actualEnd) : null,
	};

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
			}
			handleClose();
		},
	});

	// Reset form whenever modal opens or active phase changes
	useResetOnOpen(isOpen, () => form.reset(defaultValues));

	const handleClose = () => {
		form.reset();
		onClose();
	};

	const isPending = createPhaseMutation.isPending || updatePhaseMutation.isPending;

	return (
		<Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
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
										error={formErrorToMessage(field.state.meta.errors[0]) ?? undefined}
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
										error={formErrorToMessage(field.state.meta.errors[0]) ?? undefined}
									/>
								)}
							</form.AppField>

														{/* Date selection using DateTimePicker */}
							<div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
								<form.AppField name="planStart">
									{(field) => {
										const error = formErrorToMessage(field.state.meta.errors[0]);
										return (
											<DateTimePicker
												label="Plan Start"
												required
												value={field.state.value ? new Date(field.state.value) : undefined}
												onChange={(date) => field.handleChange(date ?? null)}
												placeholder="Pick planned start"
												error={error ?? undefined}
											/>
										);
									}}
								</form.AppField>

								<form.AppField name="planEnd">
									{(field) => {
										const error = formErrorToMessage(field.state.meta.errors[0]);
										return (
											<DateTimePicker
												label="Plan End"
												required
												value={field.state.value ? new Date(field.state.value) : undefined}
												onChange={(date) => field.handleChange(date ?? null)}
												placeholder="Pick planned end"
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
								onClick={handleClose}
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
	);
}

// ── Backward-compatible Aliases ──────────────────────────────────────────────

export function AddPhase(props: Omit<PhaseModalProps, "phase">) {
	return <PhaseModal {...props} phase={null} />;
}

export function EditPhase(props: PhaseModalProps) {
	return <PhaseModal {...props} />;
}