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

/**
 * Create Phase modal — pilot for the shared TanStack Form convention
 * (Task 1.4). Form values inferred from `phaseCreateSchema` (Zod); no
 * manual field-error mapper, no per-field useState; pending state and
 * server failure behavior come from the form + mutation.
 * Uses the canonical scheduling vocabulary (Task 1.5).
 */
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
				<form
					onSubmit={(e) => {
						e.preventDefault();
						e.stopPropagation();
						void form.handleSubmit();
					}}
					className="px-6"
				>
					<div className="flex flex-col gap-4">
						<form.AppField
							name="name"
							children={(field) => (
								<field.TextField
									label="Phase Name"
									required
									placeholder="e.g., Discovery"
									maxLength={20}
								/>
							)}
						/>
						<form.AppField
							name="description"
							children={(field) => (
								<field.TextAreaField
									label="Description"
									placeholder="Describe the objectives and scope of this phase..."
									rows={3}
								/>
							)}
						/>
						<SchedulingFields form={form} showActuals={false} />
						<form.Subscribe
							selector={(state) => state.errorMap.onSubmit}
							children={(onSubmitError) => {
								const message = formErrorToMessage(onSubmitError);
								return message ? (
									<p className="text-xs text-destructive" role="alert">
										{message}
									</p>
								) : null;
							}}
						/>
					</div>
					<DialogFooter showCloseButton={false}>
						<Button type="button" variant="ghost" onClick={handleClose}>
							Cancel
						</Button>
						<form.AppForm>
							<form.SubmitButton pendingLabel="Adding…">
								<Plus /> Add Phase
							</form.SubmitButton>
						</form.AppForm>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
