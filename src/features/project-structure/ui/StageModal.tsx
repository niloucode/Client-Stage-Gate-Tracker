"use client";

import { z } from "zod";
import { useState } from "react";
import { useAppForm, SchedulingFields } from "@/shared/form";
import { useResetOnOpen } from "@/shared/hooks/useResetOnOpen";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { createStage, updateStage } from "@/entities/stage/stageActions";
import { Plus, Save } from "lucide-react";

/**
 * Single stateful Add/Edit Stage modal (Task 5.7) — mirrors the
 * Phase/Module/Workflow modal structure. `stage` null = create mode,
 * non-null = pre-populated edit mode.
 */

const stageFormSchema = z.object({
	name: z
		.string()
		.min(1, "Stage name is required")
		.max(60, "Stage name must be 60 characters or less"),
	description: z.string().optional().default(""),
	planStart: z.date().nullable().optional(),
	planEnd: z.date().nullable().optional(),
	actualStart: z.date().nullable().optional(),
	actualEnd: z.date().nullable().optional(),
});

type StageFormValues = z.input<typeof stageFormSchema>;

export interface StageFormData {
	name: string;
	description?: string;
	startDate?: Date | null;
	endDate?: Date | null;
	actualStart?: Date | null;
	actualEnd?: Date | null;
}

interface StageModalProps {
	isOpen: boolean;
	/** Non-null when editing an existing stage. */
	stage: {
		stage_id: string;
		name: string;
		description?: string | null;
		planStart?: Date | null;
		planEnd?: Date | null;
		actualStart?: Date | null;
		actualEnd?: Date | null;
	} | null;
	projectId: string;
	onClose: () => void;
	/**
	 * Called after a successful create or update. Receives the saved stage
	 * (create mode returns the DB row) so callers can sync local lists.
	 */
	onSaved?: (saved: { stage_id: string; name: string }) => void;
}

export function StageModal({
	isOpen,
	stage,
	projectId,
	onClose,
	onSaved,
}: StageModalProps) {
	const isEditMode = stage !== null;
	const [serverError, setServerError] = useState<string | null>(null);

	const defaultValues: StageFormValues = {
		name: stage?.name ?? "",
		description: stage?.description ?? "",
		planStart: stage?.planStart ?? null,
		planEnd: stage?.planEnd ?? null,
		actualStart: stage?.actualStart ?? null,
		actualEnd: stage?.actualEnd ?? null,
	};

	const form = useAppForm({
		defaultValues,
		validators: { onSubmit: stageFormSchema },
		onSubmit: async ({ value }) => {
			setServerError(null);
			const result = isEditMode
				? await updateStage(
						stage!.stage_id,
						value.name,
						value.planStart ?? undefined,
						value.planEnd ?? undefined,
						value.actualStart ?? undefined,
						value.actualEnd ?? undefined,
					)
				: await createStage(
						projectId,
						value.name,
						value.planStart ?? undefined,
						value.planEnd ?? undefined,
						value.actualStart ?? undefined,
						value.actualEnd ?? undefined,
					);

			if (!result.success || !result.data) {
				setServerError(
					typeof result.error === "string"
						? result.error
						: "Failed to save the stage.",
				);
				return;
			}
			onSaved?.({
				stage_id: isEditMode ? stage!.stage_id : result.data.stage_id,
				name: result.data.name,
			});
			onClose();
		},
	});

	useResetOnOpen(isOpen, () => {
		setServerError(null);
		form.reset();
	});

	return (
		<Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>{isEditMode ? `Edit Stage ${stage?.name}` : "Create New Stage"}</DialogTitle>
					<DialogDescription>
						{isEditMode
							? "Update the stage details."
							: "Fill in the details to create a new stage."}
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
									label="Stage Name"
									required
									placeholder="e.g., Discovery & UX"
									maxLength={60}
								/>
							)}
						/>
						<form.AppField
							name="description"
							children={(field) => (
								<field.TextAreaField
									label="Description"
									placeholder="Describe the objectives and scope of this stage..."
									rows={3}
								/>
							)}
						/>
						<SchedulingFields form={form} showActuals={false} />
						{serverError && (
							<p className="text-xs text-destructive" role="alert">
								{serverError}
							</p>
						)}
					</div>
					<DialogFooter showCloseButton={false}>
						<Button type="button" variant="ghost" onClick={onClose}>
							Cancel
						</Button>
						<form.AppForm>
							<form.SubmitButton pendingLabel={isEditMode ? "Saving…" : "Adding…"}>
								{isEditMode ? <Save /> : <Plus />}
								{isEditMode ? "Save Changes" : "Add Stage"}
							</form.SubmitButton>
						</form.AppForm>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
