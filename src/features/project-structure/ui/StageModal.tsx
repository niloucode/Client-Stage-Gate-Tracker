"use client"

import { useState, useEffect, useRef } from "react"
import { z } from "zod"
import { useResetOnOpen } from "@/shared/hooks/useResetOnOpen"
import { getFieldErrors } from "@/shared/lib/zod"
import { toDateTimeLocalInput } from "@/shared/lib/scheduling"
import { FormInput } from "@/components/ui/forminput"
import { createStage, updateStage } from "@/entities/stage/stageActions"
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogDescription,
	DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

const stageFormSchema = z.object({
	name: z
		.string()
		.min(1, "Stage name is required")
		.max(20, "Stage name must be 20 characters or less"),
	description: z
		.string()
		.max(160, "Description must be 160 characters or less")
		.optional()
		.default(""),
	planStart: z.date().nullable().optional(),
	planEnd: z.date().nullable().optional(),
	actualStart: z.date().nullable().optional(),
	actualEnd: z.date().nullable().optional(),
})

export interface StageFormData {
	name: string
	description: string
	planStart: Date | null
	planEnd: Date | null
	actualStart: Date | null
	actualEnd: Date | null
}

interface StageModalProps {
	isOpen: boolean
	/** Non-null when editing an existing stage. */
	stage: {
		stage_id: string
		name: string
		description?: string | null
		planStart?: Date | null
		planEnd?: Date | null
		actualStart?: Date | null
		actualEnd?: Date | null
	} | null
	projectId: string
	onClose: () => void
	/**
	 * Called after a successful create or update. Receives the saved stage
	 * (create mode returns the DB row) so callers can sync local lists.
	 */
	onSaved?: (saved: { stage_id: string; name: string }) => void
}

const emptyFormData: StageFormData = {
	name: "",
	description: "",
	planStart: null,
	planEnd: null,
	actualStart: null,
	actualEnd: null,
}

type FieldErrors = Partial<Record<keyof StageFormData, string>>

function toDateInput(date: Date | null): string {
	return toDateTimeLocalInput(date)
}

export function StageModal({
	isOpen,
	stage,
	projectId,
	onClose,
	onSaved,
}: StageModalProps) {
	// Freeze the "displayed" stage while the dialog is open/closing so the
	// exit animation doesn't flash Add-mode when the parent clears `stage`
	// at the same time it sets isOpen=false.
	const [displayStage, setDisplayStage] = useState(stage)
	useEffect(() => {
		if (isOpen) setDisplayStage(stage)
	}, [isOpen, stage])

	const isEditMode = displayStage !== null

	const getInitialFormData = (): StageFormData => {
		if (stage) {
			return {
				name: stage.name,
				description: stage.description ?? "",
				planStart: stage.planStart ?? null,
				planEnd: stage.planEnd ?? null,
				actualStart: stage.actualStart ?? null,
				actualEnd: stage.actualEnd ?? null,
			}
		}
		return emptyFormData
	}

	const [formData, setFormData] = useState<StageFormData>(getInitialFormData)
	const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
	const [serverError, setServerError] = useState<string | null>(null)
	const [isSubmitting, setIsSubmitting] = useState(false)
	const mountedRef = useRef(true)

	useEffect(() => {
		mountedRef.current = true
		return () => {
			mountedRef.current = false
		}
	}, [])

	// Sync form data when stage prop changes
	useEffect(() => {
		if (isOpen) {
			setFormData(
				stage
					? {
							name: stage.name,
							description: stage.description ?? "",
							planStart: stage.planStart ?? null,
							planEnd: stage.planEnd ?? null,
							actualStart: stage.actualStart ?? null,
							actualEnd: stage.actualEnd ?? null,
						}
					: emptyFormData
			)
			setFieldErrors({})
			setServerError(null)
		}
	}, [isOpen, stage])

	// Reset form state on Add mode open
	useResetOnOpen(isOpen && !stage, () => {
		setFormData(emptyFormData)
		setFieldErrors({})
		setServerError(null)
	})

	const formKey = isEditMode ? displayStage!.stage_id : "new"

	const handleClose = () => {
		setFormData(emptyFormData)
		setFieldErrors({})
		setServerError(null)
		onClose()
	}

	const clearFieldError = (field: keyof StageFormData) => {
		if (fieldErrors[field]) {
			setFieldErrors((prev) => ({ ...prev, [field]: undefined }))
		}
	}

	const handleSubmit = async () => {
		const result = stageFormSchema.safeParse(formData)
		if (!result.success) {
			const mapped = getFieldErrors(result)
			setFieldErrors(mapped)
			return
		}

		setFieldErrors({})
		setServerError(null)
		setIsSubmitting(true)

		try {
			const res = isEditMode
				? await updateStage(
						displayStage!.stage_id,
						formData.name,
						formData.planStart ?? undefined,
						formData.planEnd ?? undefined,
						formData.actualStart ?? undefined,
						formData.actualEnd ?? undefined
					)
				: await createStage(
						projectId,
						formData.name,
						formData.planStart ?? undefined,
						formData.planEnd ?? undefined,
						formData.actualStart ?? undefined,
						formData.actualEnd ?? undefined
					)

			if (!res.success || !res.data) {
				if (mountedRef.current) {
					setServerError(
						typeof res.error === "string"
							? res.error
							: "Failed to save the stage."
					)
				}
				return
			}

			onSaved?.({
				stage_id: isEditMode ? displayStage!.stage_id : res.data.stage_id,
				name: res.data.name,
			})
			handleClose()
		} catch {
			if (mountedRef.current) {
				setServerError("An unexpected error occurred.")
			}
		} finally {
			if (mountedRef.current) {
				setIsSubmitting(false)
			}
		}
	}

	return (
		<Dialog open={isOpen} onOpenChange={(open) => { if (!open) handleClose() }}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>
						{isEditMode ? `Edit Stage ${displayStage?.name ?? ""}` : "Create New Stage"}
					</DialogTitle>
					<DialogDescription>
						{isEditMode
							? "Update the stage details."
							: "Fill in the details to create a new stage."}
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-4" key={formKey}>
					{/* Stage Name */}
					<FormInput
						variant="input"
						label="Stage Name"
						required
						maxLength={32}
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
						onChange={(e) => setFormData({ ...formData, description: e.target.value })}
						onClearError={() => clearFieldError("description")}
					/>

					{/* Planned Dates Section */}
					<div className="flex gap-4">
						<FormInput
							variant="datetime-local"
							label="Start Date"
							type="datetime-local"
							value={toDateInput(formData.planStart)}
							error={fieldErrors.planStart}
							containerClassName="flex-1"
							onChange={(e) =>
								setFormData({
									...formData,
									planStart: e.target.value ? new Date(e.target.value) : null,
								})
							}
							onClearError={() => clearFieldError("planStart")}
						/>

						<FormInput
							variant="datetime-local"
							label="Deadline Date"
							type="datetime-local"
							value={toDateInput(formData.planEnd)}
							error={fieldErrors.planEnd}
							containerClassName="flex-1"
							onChange={(e) =>
								setFormData({
									...formData,
									planEnd: e.target.value ? new Date(e.target.value) : null,
								})
							}
							onClearError={() => clearFieldError("planEnd")}
						/>
					</div>

					{serverError && (
						<p className="text-xs text-destructive" role="alert">
							{serverError}
						</p>
					)}
				</div>

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
			</DialogContent>
		</Dialog>
	)
}