"use client";

import type { z } from "zod";
import { useAppForm, SchedulingFields } from "@/shared/form";
import { phaseUpdateSchema } from "@/shared/schemas";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useUpdatePhase } from "@/entities/phase/mutations";
import { useResetOnOpen } from "@/shared/hooks/useResetOnOpen";
import { formErrorToMessage } from "@/shared/form/errors";
import { Save } from "lucide-react";
import type { Phase } from "../../types";

interface EditPhaseProps {
	isOpen: boolean;
	onClose: () => void;
	stageId: string;
	phase: Phase | null;
}

/** Form values are the Zod schema's *input* type (Task 1.4 acceptance). */
type EditPhaseFormValues = z.input<typeof phaseUpdateSchema>;

/**
 * Edit Phase modal — update path of the Task 1.4 pilot. Pre-populated from
 * the passed phase; values inferred from `phaseUpdateSchema` (Zod).
 */
export function EditPhase({ isOpen, onClose, stageId, phase }: EditPhaseProps) {
	const updatePhaseMutation = useUpdatePhase();

	const defaultValues: EditPhaseFormValues = {
		name: phase?.name ?? "",
		description: phase?.description ?? "",
		planStart: phase?.planStart ?? null,
		planEnd: phase?.planEnd ?? null,
		actualStart: phase?.actualStart ?? null,
		actualEnd: phase?.actualEnd ?? null,
	};

	const form = useAppForm({
		defaultValues,
		validators: {
			onSubmit: phaseUpdateSchema,
		},
		onSubmit: async ({ value }) => {
			if (!phase) return;
			await updatePhaseMutation.mutateAsync({
				phaseId: phase.phase_id,
				stageId,
				name: value.name ?? "",
				description: value.description ?? "",
				planStart: value.planStart ?? undefined,
				planEnd: value.planEnd ?? undefined,
				actualStart: value.actualStart ?? undefined,
				actualEnd: value.actualEnd ?? undefined,
			});
			handleClose();
		},
	});

	// Reset form with the latest phase data when modal opens
	useResetOnOpen(isOpen, () => form.reset(defaultValues));

	const handleClose = () => {
		form.reset();
		onClose();
	};

	return (
		<Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Edit Phase {phase?.number ?? ""}</DialogTitle>
					<DialogDescription>Update the phase details.</DialogDescription>
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
									<field.TextField
										label="Phase Name"
										required
										placeholder="e.g., Discovery"
										maxLength={20}
									/>
								)}
							</form.AppField>

							<form.AppField name="description">
								{(field) => (
									<field.TextAreaField
										label="Description"
										placeholder="Describe the objectives and scope of this phase..."
										rows={3}
									/>
								)}
							</form.AppField>

							<SchedulingFields form={form} showActuals={false} />

							<form.Subscribe selector={(state) => state.errorMap.onSubmit}>
								{(onSubmitError) => {
									const message = formErrorToMessage(onSubmitError);
									return message ? (
										<p className="text-xs text-destructive" role="alert">
											{message}
										</p>
									) : null;
								}}
							</form.Subscribe>
						</div>

						<DialogFooter className="mt-6" showCloseButton={false}>
							<Button
								type="button"
								variant="ghost"
								onClick={handleClose}
								disabled={updatePhaseMutation.isPending}
							>
								Cancel
							</Button>
							<form.SubmitButton pendingLabel="Saving…">
								<Save className="mr-2 h-4 w-4" /> Save Changes
							</form.SubmitButton>
						</DialogFooter>
					</form>
				</form.AppForm>
			</DialogContent>
		</Dialog>
	);
}