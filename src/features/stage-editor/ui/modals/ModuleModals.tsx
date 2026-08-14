"use client";

import { useState, useMemo } from "react";
import { z } from "zod";
import { Plus, Save, Trash2 } from "lucide-react";

import type { Module } from "../../types";
import { getFieldErrors } from "@/shared/lib/zod";
import { useResetOnOpen } from "@/shared/hooks/useResetOnOpen";
import {
	hasValidPlannedRange,
	toSchedulingDates,
} from "@/shared/lib/scheduling";
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

export interface ModuleFormData {
	name: string;
	planStart: Date | null;
	planEnd: Date | null;
	actualEnd: Date | null;
}

export interface ModuleModalProps {
	isOpen: boolean;
	onClose: () => void;
	/**
	 * Pass a `module` object for Edit mode, or `null`/`undefined` for Create mode.
	 */
	module?: Module | null;
	activePhase?: number | null;
	onSave: (data: ModuleFormData) => void;
	onDelete?: () => void;
}

const baseModuleModalSchema = z.object({
	name: z
		.string()
		.min(1, "Module name is required")
		.max(35, "Module name must be 35 characters or less"),
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

const moduleModalSchema = baseModuleModalSchema.superRefine((data, ctx) => {
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
});

const getInitialFormData = (module?: Module | null): ModuleFormData => ({
	name: module?.name ?? "",
	planStart: module?.planStart ? new Date(module.planStart) : null,
	planEnd: module?.planEnd ? new Date(module.planEnd) : null,
	actualEnd: module?.actualEnd ? new Date(module.actualEnd) : null,
});

type FieldErrors = Partial<Record<keyof ModuleFormData, string>>;

export function ModuleModal({
	isOpen,
	onClose,
	module,
	activePhase,
	onSave,
	onDelete,
}: ModuleModalProps) {
	const initialFormData = useMemo(() => getInitialFormData(module), [module]);

	const [displayModule, setDisplayModule] = useState(module);
	const [formData, setFormData] = useState<ModuleFormData>(initialFormData);
	const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
	const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);

	const isEditMode = Boolean(displayModule);

	// Reset form when modal opens
	useResetOnOpen(isOpen, () => {
		setDisplayModule(module);
		setFormData(initialFormData);
		setFieldErrors({});
		setShowDiscardConfirm(false);
	});

	// Check if user has made unsaved modifications
	const isDirty = useMemo(() => {
		return (
			formData.name !== initialFormData.name ||
			formData.planStart?.getTime() !== initialFormData.planStart?.getTime() ||
			formData.planEnd?.getTime() !== initialFormData.planEnd?.getTime() ||
			formData.actualEnd?.getTime() !== initialFormData.actualEnd?.getTime()
		);
	}, [formData, initialFormData]);

	const handleClose = () => {
		setFormData(initialFormData);
		setFieldErrors({});
		setShowDiscardConfirm(false);
		onClose();
	};

	// Prevents exiting if unsaved changes exist
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

	const clearFieldError = (field: keyof ModuleFormData) => {
		if (fieldErrors[field]) {
			setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
		}
	};

	const handleSubmit = () => {
		const result = moduleModalSchema.safeParse(formData);
		if (!result.success) {
			const mapped = getFieldErrors(result);
			setFieldErrors(mapped);
			return;
		}
		setFieldErrors({});
		onSave(formData);
		handleClose();

		if (isEditMode) {
			toast.add({
				title: "Module Edited",
				description: "Module has been edited successfully.",
				type: "success",
			});
		} else {
			toast.add({
				title: "Module Added",
				description: "Module has been added successfully.",
				type: "success",
			});
		}
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
							{isEditMode ? "Edit Module" : "Create New Module"}
						</DialogTitle>
						<DialogDescription>
							{isEditMode
								? "Update the module details below."
								: `Fill in the details to create a new module for Phase ${activePhase ?? ""}.`}
						</DialogDescription>
					</DialogHeader>

					<div className="space-y-4">
						<FormInput
							variant="input"
							label="Module Name"
							required
							maxLength={35}
							value={formData.name}
							placeholder="e.g., Authentication & Identity"
							error={fieldErrors.name}
							onChange={(e) => {
								setFormData({ ...formData, name: e.target.value });
								clearFieldError("name");
							}}
						/>

						<div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
							<DateTimePicker
								label="Plan Start"
								required
								value={
									formData.planStart ? new Date(formData.planStart) : undefined
								}
								onChange={(date) => {
									setFormData({
										...formData,
										planStart: date ?? null,
									});
									clearFieldError("planStart");
								}}
								placeholder="Pick Planned Start"
								error={fieldErrors.planStart}
							/>

							<DateTimePicker
								label="Plan End"
								required
								value={
									formData.planEnd ? new Date(formData.planEnd) : undefined
								}
								onChange={(date) => {
									setFormData({
										...formData,
										planEnd: date ?? null,
									});
									clearFieldError("planEnd");
								}}
								placeholder="Pick Planned End"
								error={fieldErrors.planEnd}
							/>
						</div>
					</div>

					<DialogFooter>
						{isEditMode && onDelete && (
							<Button
								type="button"
								className="mr-auto"
								variant="destructive"
								onClick={onDelete}
							>
								<Trash2 className="mr-2 h-4 w-4" /> Delete Module
							</Button>
						)}
						<Button type="button" variant="ghost" onClick={handleAttemptClose}>
							Cancel
						</Button>
						<Button type="button" onClick={handleSubmit}>
							{isEditMode ? (
								<>
									<Save className="mr-2 h-4 w-4" /> Save Changes
								</>
							) : (
								<>
									<Plus className="mr-2 h-4 w-4" /> Add Module
								</>
							)}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Discard Unsaved Changes Confirmation Modal */}
			<ConfirmationModal
				isOpen={showDiscardConfirm}
				title="Discard Unsaved Changes?"
				description="You have unsaved information in this module. Are you sure you want to discard your changes?"
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

export function AddModule(
	props: Omit<ModuleModalProps, "module" | "onSave"> & {
		onSubmit: (data: ModuleFormData) => void;
	},
) {
	return <ModuleModal {...props} module={null} onSave={props.onSubmit} />;
}

export function EditModule(
	props: ModuleModalProps & {
		onDelete: () => void;
	},
) {
	return <ModuleModal {...props} />;
}