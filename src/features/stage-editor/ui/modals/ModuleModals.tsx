"use client";

import { useState, useEffect } from "react";
import type { Module } from "../../types";
import { moduleCreateSchema } from "@/shared/schemas";
import { getFieldErrors } from "@/shared/lib/zod";
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
		const result = moduleCreateSchema.safeParse(formData);
		if (!result.success) {
			const mapped = getFieldErrors(result);
			setFieldErrors(mapped);
			return;
		}
		setFieldErrors({});
		onSave(formData);
		handleClose();
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
							setFieldErrors({});
						}}
					/>

					<div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
						<div>
							<Label>Plan Start</Label>
							<DateTimePicker
								value={formData.planStart ? new Date(formData.planStart) : undefined}
								onChange={(date) =>
									setFormData({
										...formData,
										planStart: date ?? null,
									})
								}
								placeholder="Pick plan start date"
								className="h-9 text-xs"
							/>
						</div>

						<div>
							<Label>Plan End</Label>
							<DateTimePicker
								value={formData.planEnd ? new Date(formData.planEnd) : undefined}
								onChange={(date) =>
									setFormData({
										...formData,
										planEnd: date ?? null,
									})
								}
								placeholder="Pick plan end date"
								className="h-9 text-xs"
							/>
						</div>
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