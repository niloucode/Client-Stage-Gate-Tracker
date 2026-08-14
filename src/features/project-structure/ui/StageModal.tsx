"use client";

import { useState } from "react";
import { z } from "zod";
import { getFieldErrors } from "@/shared/lib/zod";
import { FormInput } from "@/components/ui/forminput";
import { DateTimePicker } from "@/components/ui/datetime-picker";
import { Label } from "@/components/ui/label";
import { createStage, updateStage } from "@/entities/stage";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogDescription,
	DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const stageFormSchema = z
	.object({
		name: z
			.string()
			.min(1, "Stage name is required")
			.max(20, "Stage name must be 20 characters or less"),
		description: z
			.string()
			.max(160, "Description must be 160 characters or less")
			.optional()
			.default(""),
		// Plan dates are REQUIRED (date-rules follow-up; DB columns are NOT
		// NULL). Actual dates are derived from contract/gate events and are
		// never edited here.
		planStart: z.date({ message: "Start date is required" }),
		planEnd: z.date({ message: "Deadline date is required" }),
	})
	.refine((d) => d.planEnd >= d.planStart, {
		path: ["planEnd"],
		message: "Deadline must be on or after the start date.",
	});

interface StageFormData {
	name: string;
	description: string;
	planStart: Date | null;
	planEnd: Date | null;
}

interface StageModalStage {
	stage_id: string;
	name: string;
	description?: string | null;
	planStart?: Date | null;
	planEnd?: Date | null;
}

interface StageModalProps {
	isOpen: boolean;
	/** Non-null when editing an existing stage. */
	stage: StageModalStage | null;
	projectId: string;
	onClose: () => void;
	/**
	 * Called after a successful create or update. Receives the saved stage
	 * (create mode returns the DB row) so callers can sync their queries.
	 */
	onSaved?: (saved: { stage_id: string; name: string }) => void;
}

type FieldErrors = Partial<Record<keyof StageFormData, string>>;

function StageForm({
	stage,
	projectId,
	onClose,
	onSaved,
}: {
	stage: StageModalStage | null;
	projectId: string;
	onClose: () => void;
	onSaved?: (saved: { stage_id: string; name: string }) => void;
}) {
	const isEditMode = stage !== null;

	// Fresh state per mount: the parent remounts this form (key change) on
	// every open, so no effect-based syncing is needed.
	const [formData, setFormData] = useState<StageFormData>(() => ({
		name: stage?.name ?? "",
		description: stage?.description ?? "",
		planStart: stage?.planStart ? new Date(stage.planStart) : null,
		planEnd: stage?.planEnd ? new Date(stage.planEnd) : null,
	}));
	const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
	const [serverError, setServerError] = useState<string | null>(null);
	const [isSubmitting, setIsSubmitting] = useState(false);

	const handleClose = () => {
		onClose();
	};

	const clearFieldError = (field: keyof StageFormData) => {
		if (fieldErrors[field]) {
			setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
		}
	};

	const handleSubmit = async () => {
		const result = stageFormSchema.safeParse(formData);
		if (!result.success) {
			const mapped = getFieldErrors(result);
			setFieldErrors(mapped);
			return;
		}

		setFieldErrors({});
		setServerError(null);
		setIsSubmitting(true);

		const { name, description, planStart, planEnd } = result.data;

		try {
			const res = isEditMode
				? await updateStage(
						stage!.stage_id,
						name,
						description,
						planStart,
						planEnd,
					)
				: await createStage(projectId, name, description, planStart, planEnd);

			if (!res.success || !res.data) {
				setServerError(
					typeof res.error === "string"
						? res.error
						: "Failed to save the stage.",
				);
				return;
			}

			onSaved?.({
				stage_id: isEditMode ? stage!.stage_id : res.data.stage_id,
				name: res.data.name,
			});
			handleClose();
		} catch {
			setServerError("An unexpected error occurred.");
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<div className="space-y-4">
			{/* Stage Name */}
			<FormInput
				variant="input"
				label="Stage Name"
				required
				maxLength={20}
				value={formData.name}
				placeholder="e.g., Discovery & UX"
				error={fieldErrors.name}
				onChange={(e) => setFormData({ ...formData, name: e.target.value })}
				onClearError={() => clearFieldError("name")}
			/>

			{/* Description */}
			<FormInput
				variant="textarea"
				label="Description"
				maxLength={160}
				rows={3}
				value={formData.description}
				placeholder="Describe the objectives and scope of this stage..."
				error={fieldErrors.description}
				onChange={(e) =>
					setFormData({ ...formData, description: e.target.value })
				}
				onClearError={() => clearFieldError("description")}
			/>

			{/* Planned Dates Section */}
			<div className="flex gap-4">
				<div className="flex flex-1 flex-col gap-1 min-w-0">
					<Label error={!!fieldErrors.planStart}>Start Date</Label>
					<DateTimePicker
						value={
							formData.planStart ? new Date(formData.planStart) : undefined
						}
						onChange={(date) => {
							setFormData({
								...formData,
								planStart: date ?? null,
							});
							clearFieldError("planStart");
							clearFieldError("planEnd");
						}}
						placeholder="Pick start date"
						className="h-9 text-xs"
					/>
					{fieldErrors.planStart && (
						<p className="text-xs text-destructive">{fieldErrors.planStart}</p>
					)}
				</div>

				<div className="flex flex-1 flex-col gap-1 min-w-0">
					<Label error={!!fieldErrors.planEnd}>Deadline Date</Label>
					<DateTimePicker
						value={formData.planEnd ? new Date(formData.planEnd) : undefined}
						onChange={(date) => {
							setFormData({
								...formData,
								planEnd: date ?? null,
							});
							clearFieldError("planEnd");
						}}
						placeholder="Pick deadline date"
						className="h-9 text-xs"
					/>
					{fieldErrors.planEnd && (
						<p className="text-xs text-destructive">{fieldErrors.planEnd}</p>
					)}
				</div>
			</div>

			{serverError && (
				<p className="text-xs text-destructive" role="alert">
					{serverError}
				</p>
			)}

			<DialogFooter>
				<Button onClick={handleClose} variant="ghost" disabled={isSubmitting}>
					Cancel
				</Button>
				<Button onClick={handleSubmit} disabled={isSubmitting}>
					{isSubmitting
						? isEditMode
							? "Saving…"
							: "Adding…"
						: isEditMode
							? "Save Changes"
							: "Create Stage"}
				</Button>
			</DialogFooter>
		</div>
	);
}

export function StageModal({
	isOpen,
	stage,
	projectId,
	onClose,
	onSaved,
}: StageModalProps) {
	// Increment on every open so the inner form remounts with fresh state —
	// no effect-based syncing (avoids react-hooks/set-state-in-effect).
	const [openSeq, setOpenSeq] = useState(0);

	const isEditMode = stage !== null;

	return (
		<Dialog
			open={isOpen}
			onOpenChange={(open) => {
				if (open) setOpenSeq((s) => s + 1);
				else onClose();
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
							? "Update the stage details."
							: "Fill in the details to create a new stage."}
					</DialogDescription>
				</DialogHeader>

				<StageForm
					key={`${stage?.stage_id ?? "new"}-${openSeq}`}
					stage={stage}
					projectId={projectId}
					onClose={onClose}
					onSaved={onSaved}
				/>
			</DialogContent>
		</Dialog>
	);
}
