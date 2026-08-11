"use client";

import type { z } from "zod";
import { useAppForm, SchedulingFields } from "@/shared/form";
import { phaseCreateSchema } from "@/shared/schemas";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useCreatePhase } from "@/entities/phase/mutations";
import { useResetOnOpen } from "@/shared/hooks/useResetOnOpen";
import { formErrorToMessage } from "@/shared/form/errors";
import { Plus } from "lucide-react";

interface AddPhaseProps {
	isOpen: boolean;
	onClose: () => void;
	stageId: string;
}

/** Form values are the Zod schema's *input* type (Task 1.4 acceptance). */
type AddPhaseFormValues = z.input<typeof phaseCreateSchema>;

export function AddPhase({ isOpen, onClose, stageId }: AddPhaseProps) {
	const createPhaseMutation = useCreatePhase();

	const defaultValues: AddPhaseFormValues = {
		name: "",
		description: "",
		planStart: null,
		planEnd: null,
		actualStart: null,
		actualEnd: null,
	};

	const form = useAppForm({
		defaultValues,
		validators: {
			onSubmit: phaseCreateSchema,
		},
		onSubmit: async ({ value }) => {
			await createPhaseMutation.mutateAsync({
				stageId,
				name: value.name,
				description: value.description ?? "",
				planStart: value.planStart ?? undefined,
				planEnd: value.planEnd ?? undefined,
				actualStart: value.actualStart ?? undefined,
				actualEnd: value.actualEnd ?? undefined,
			});
			handleClose();
		},
	});

	useResetOnOpen(isOpen, () => form.reset());

	const handleClose = () => {
		form.reset();
		onClose();
	};

	return (
		<Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Create New Phase</DialogTitle>
					<DialogDescription>
						Fill in the details to create a new phase.
					</DialogDescription>
				</DialogHeader>

				{/* form.AppForm MUST wrap the entire form tree to provide formContext */}
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
								disabled={createPhaseMutation.isPending}
							>
								Cancel
							</Button>
							<form.SubmitButton pendingLabel="Adding…">
								<Plus className="mr-2 h-4 w-4" /> Add Phase
							</form.SubmitButton>
						</DialogFooter>
					</form>
				</form.AppForm>
			</DialogContent>
		</Dialog>
	);
}