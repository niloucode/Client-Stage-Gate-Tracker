"use client";

import { useState, useEffect } from "react";
import { z } from "zod";
import type { Module } from "../../types";
import { getFieldErrors } from "@/shared/lib/zod";
import {
	hasValidPlannedRange,
	toSchedulingDates,
} from "@/shared/lib/scheduling";
import { useResetOnOpen } from "@/shared/hooks/useResetOnOpen";
import { Label } from "@/components/ui/label";
import { DateTimePicker } from "@/components/ui/datetime-picker";
import { FormInput } from "@/components/ui/forminput";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogDescription,
	DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Plus, Save, Trash2 } from "lucide-react";
import { toast } from "@/components/ui/toast"

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
			message: "Plan Start date is required",
		}),
	planEnd: z
		.date()
		.nullable()
		.refine((val): val is Date => val !== null, {
			message: "Plan End date is required",
		}),
	actualStart: z.date().optional().nullable(),
	actualEnd: z.date().optional().nullable(),
});

const moduleModalSchema = baseModuleModalSchema.refine(
	(data) => hasValidPlannedRange(toSchedulingDates(data)),
	{
		message: "Plan Start must be before or equal to Plan End",
		path: ["planStart"],
	},
);

const emptyFormData: ModuleFormData = {
	name: "",
	planStart: null,
	planEnd: null,
	actualEnd: null,
};

const getInitialFormData = (module?: Module | null): ModuleFormData => ({
	name: module?.name ?? "",
	planStart: module?.planStart ?? null,
	planEnd: module?.planEnd ?? null,
	actualEnd: module?.actualEnd ?? null,
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
	// Preserve the active module during exit animations so closing the modal
	// doesn't flash "Create New Module" while fading out.
	const [displayModule, setDisplayModule] = useState(module);

	useEffect(() => {
		if (isOpen) {
			setDisplayModule(module);
		}
	}, [isOpen, module]);

	const isEditMode = Boolean(displayModule);

	const [formData, setFormData] = useState<ModuleFormData>(() =>
		getInitialFormData(displayModule),
	);
	const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

	// Reset form when modal opens or active module changes
	useEffect(() => {
		if (isOpen) {
			setFormData(getInitialFormData(displayModule));
			setFieldErrors({});
		}
	}, [isOpen, displayModule]);

	useResetOnOpen(isOpen && !displayModule, () => {
		setFormData(emptyFormData);
		setFieldErrors({});
	});

	const handleClose = () => {
		onClose();
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

		if (isEditMode)
		{
			toast.add({
				title: "Module Edited",
				description: `Module has been edited successfully.`,
				type: "success",
			});
		}
		else
		{
			toast.add({
				title: "Module Added",
				description: `Module has been added successfully.`,
				type: "success",
			});
		}
		
	};

	return (
		<Dialog
			open={isOpen}
			onOpenChange={(open) => {
				if (!open) handleClose();
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
							setFieldErrors((prev) => ({ ...prev, name: undefined }));
						}}
					/>

					<div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
						<DateTimePicker
							label="Plan Start"
							required
							value={formData.planStart ? new Date(formData.planStart) : undefined}
							onChange={(date) => {
								setFormData({
									...formData,
									planStart: date ?? null,
								});
								setFieldErrors((prev) => ({ ...prev, planStart: undefined }));
							}}
							placeholder="Pick plan start date"
							error={fieldErrors.planStart}
						/>

						<DateTimePicker
							label="Plan End"
							required
							value={formData.planEnd ? new Date(formData.planEnd) : undefined}
							onChange={(date) => {
								setFormData({
									...formData,
									planEnd: date ?? null,
								});
								setFieldErrors((prev) => ({ ...prev, planEnd: undefined }));
							}}
							placeholder="Pick plan end date"
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
					<Button type="button" variant="ghost" onClick={handleClose}>
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
