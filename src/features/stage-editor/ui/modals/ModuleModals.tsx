"use client";

import { useState, useMemo } from "react";
import { z } from "zod";
import { Plus, Save, Trash2 } from "lucide-react";
import { useSelector } from "@tanstack/react-form";

import type { Module } from "../../types";
import { useAppForm, formErrorToMessage } from "@/shared/form";
import { useResetOnOpen } from "@/shared/hooks/useResetOnOpen";
import {
	hasValidPlannedRange,
	toSchedulingDates,
} from "@/shared/lib/scheduling";
import { useCreateModule, useUpdateModule } from "@/entities/module/mutations";
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

export interface ModuleModalProps {
	isOpen: boolean;
	onClose: () => void;
	/**
	 * Pass a `module` object for Edit mode, or `null`/`undefined` for Create mode.
	 */
	module?: Module | null;
	activePhase?: number | null;
	stageId: string;
	/** Parent phase — required for Create mode. */
	phaseId?: string | null;
	onDelete?: () => void;
}

const moduleModalSchema = z
	.object({
		name: z
			.string()
			.min(1, "Module name is required")
			.max(35, "Module name must be 35 characters or less"),
		planStart: z
			.date()
			.nullable()
			.refine((val): val is Date => val !== null, {
				error: "Plan Start Date is required",
			}),
		planEnd: z
			.date()
			.nullable()
			.refine((val): val is Date => val !== null, {
				error: "Plan End Date is required",
			}),
		actualStart: z.date().optional().nullable(),
		actualEnd: z.date().optional().nullable(),
	})
	.superRefine((data, ctx) => {
		if (!hasValidPlannedRange(toSchedulingDates(data))) {
			ctx.addIssue({
				code: "custom",
				message: "Start must be before End",
				path: ["planStart"],
			});
			ctx.addIssue({
				code: "custom",
				message: "End must be after Start",
				path: ["planEnd"],
			});
		}
	});

type ModuleFormValues = z.input<typeof moduleModalSchema>;

function ModuleModal({
	isOpen,
	onClose,
	module,
	activePhase,
	stageId,
	phaseId,
	onDelete,
}: ModuleModalProps) {
	const isEditMode = Boolean(module);
	const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);

	const createModuleMutation = useCreateModule();
	const updateModuleMutation = useUpdateModule();

	const defaultValues: ModuleFormValues = useMemo(
		() => ({
			name: module?.name ?? "",
			planStart: module?.planStart ? new Date(module.planStart) : null,
			planEnd: module?.planEnd ? new Date(module.planEnd) : null,
			actualStart: module?.actualStart ? new Date(module.actualStart) : null,
			actualEnd: module?.actualEnd ? new Date(module.actualEnd) : null,
		}),
		[module],
	);

	const form = useAppForm({
		defaultValues,
		validators: { onSubmit: moduleModalSchema },
		onSubmit: async ({ value }) => {
			try {
				if (isEditMode && module) {
					await updateModuleMutation.mutateAsync({
						moduleId: module.module_id,
						stageId,
						name: value.name,
						// non-null guaranteed by moduleModalSchema (required plan dates)
						planStart: value.planStart!,
						planEnd: value.planEnd!,
						actualStart: value.actualStart ?? undefined,
						actualEnd: value.actualEnd ?? undefined,
					});
					toast.add({
						title: "Module Edited",
						description: `"${value.name}" has been edited successfully.`,
						type: "success",
					});
				} else {
					if (!phaseId) return;

					// 1. Trigger Loading Toast upon adding
					toast.add({
						title: "Creating Module",
						description: "Please wait while your module is being created...",
						type: "loading",
					});

					// 2. Perform create mutation
					await createModuleMutation.mutateAsync({
						phaseId,
						stageId,
						name: value.name,
						// non-null guaranteed by moduleModalSchema (required plan dates)
						planStart: value.planStart!,
						planEnd: value.planEnd!,
						actualStart: value.actualStart ?? undefined,
						actualEnd: value.actualEnd ?? undefined,
					});

					// 3. Trigger Success Toast
					toast.add({
						title: "Module Added",
						description: `"${value.name}" has been added successfully.`,
						type: "success",
					});
				}
				handleClose();
			} catch (error) {
				toast.add({
					title: isEditMode ? "Edit Failed" : "Creation Failed",
					description:
						error instanceof Error
							? error.message
							: "An error occurred while saving the module.",
					type: "error",
				});
			}
		},
	});

	// Correct TanStack Form store subscription (useStore is a deprecated alias).
	const isDirty = useSelector(form.store, (state) => state.isDirty);

	// Reset form whenever modal opens
	useResetOnOpen(isOpen, () => {
		form.reset(defaultValues);
		setShowDiscardConfirm(false);
	});

	const handleClose = () => {
		form.reset();
		setShowDiscardConfirm(false);
		onClose();
	};

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

	const isPending =
		createModuleMutation.isPending || updateModuleMutation.isPending;

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
											label="Module Name"
											required
											maxLength={35}
											value={field.state.value}
											placeholder="e.g., Authentication & Identity"
											error={
												formErrorToMessage(field.state.meta.errors[0]) ??
												undefined
											}
											onChange={(e) => field.handleChange(e.target.value)}
										/>
									)}
								</form.AppField>

								<div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
									<form.AppField name="planStart">
										{(field) => (
											<DateTimePicker
												label="Plan Start"
												required
												value={
													field.state.value
														? new Date(field.state.value)
														: undefined
												}
												onChange={(date) => field.handleChange(date ?? null)}
												placeholder="Pick Planned Start"
												error={
													formErrorToMessage(field.state.meta.errors[0]) ??
													undefined
												}
											/>
										)}
									</form.AppField>

									<form.AppField name="planEnd">
										{(field) => (
											<DateTimePicker
												label="Plan End"
												required
												value={
													field.state.value
														? new Date(field.state.value)
														: undefined
												}
												onChange={(date) => field.handleChange(date ?? null)}
												placeholder="Pick Planned End"
												error={
													formErrorToMessage(field.state.meta.errors[0]) ??
													undefined
												}
											/>
										)}
									</form.AppField>
								</div>
							</div>

							<DialogFooter className="mt-6" showCloseButton={false}>
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
								<Button
									type="button"
									variant="ghost"
									onClick={handleAttemptClose}
									disabled={isPending}
								>
									Cancel
								</Button>
								<form.SubmitButton
									pendingLabel={isEditMode ? "Saving…" : "Adding…"}
								>
									{isEditMode ? (
										<>
											<Save className="mr-2 h-4 w-4" /> Save Changes
										</>
									) : (
										<>
											<Plus className="mr-2 h-4 w-4" /> Add Module
										</>
									)}
								</form.SubmitButton>
							</DialogFooter>
						</form>
					</form.AppForm>
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

export function AddModule(props: Omit<ModuleModalProps, "module">) {
	return <ModuleModal {...props} module={null} />;
}

export function EditModule(props: ModuleModalProps) {
	return <ModuleModal {...props} />;
}
