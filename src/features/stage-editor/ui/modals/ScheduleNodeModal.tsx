"use client";

import { useMemo, useState } from "react";
import { z } from "zod";
import { Plus, Save, Trash2 } from "lucide-react";
import { useSelector } from "@tanstack/react-form";

import { useAppForm, formErrorToMessage } from "@/shared/form";
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

/**
 * The shared create/edit modal for scheduled tree nodes (Modules,
 * Workflows). Extracted 2026-08-16 from the ~95% duplicated ModuleModals /
 * WorkflowModals — keep entity differences in `config`, never fork this
 * component.
 */

/** Minimal entity shape the modal edits (Modules/Workflows both fit). */
export interface ScheduleNodeEntity {
	id: string;
	name: string;
	planStart: Date;
	planEnd: Date;
	actualStart: Date | null;
	actualEnd: Date | null;
}

export interface ScheduleNodeModalProps {
	isOpen: boolean;
	onClose: () => void;
	/** Pass an entity for Edit mode, or `null`/`undefined` for Create mode. */
	entity?: ScheduleNodeEntity | null;
	stageId: string;
	/** Parent id for Create mode (phaseId for modules, moduleId for workflows). */
	parentId?: string | null;
	/** Human parent label for the create description, e.g. "Phase 3". */
	parentLabel?: string;
	onDelete?: () => void;
	/** True while either mutation is in flight (disables Cancel/Submit). */
	isPending?: boolean;
	config: {
		/** "Module" / "Workflow" — drives titles, labels and messages. */
		entityLabel: string;
		/** "added" (Module) / "created" (Workflow) — drives button + toast verbs. */
		createdVerb: "added" | "created";
		namePlaceholder: string;
		create: (params: {
			parentId: string;
			stageId: string;
			name: string;
			planStart: Date;
			planEnd: Date;
			actualStart?: Date;
			actualEnd?: Date;
		}) => Promise<unknown>;
		update: (params: {
			id: string;
			stageId: string;
			name: string;
			planStart: Date;
			planEnd: Date;
			actualStart?: Date;
			actualEnd?: Date;
		}) => Promise<unknown>;
	};
}

function buildNodeSchema(entityLabel: string) {
	return z
		.object({
			name: z
				.string()
				.min(1, `${entityLabel} name is required`)
				.max(35, `${entityLabel} name must be 35 characters or less`),
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
}

type NodeFormValues = z.input<ReturnType<typeof buildNodeSchema>>;

/**
 *
 * @returns The result.
 */
export function ScheduleNodeModal({
	isOpen,
	onClose,
	entity,
	stageId,
	parentId,
	parentLabel,
	onDelete,
	isPending = false,
	config,
}: ScheduleNodeModalProps) {
	const isEditMode = Boolean(entity);
	const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);

	const entityLabel = config.entityLabel;
	const lower = entityLabel.toLowerCase();
	const createdVerb = config.createdVerb;

	const schema = useMemo(() => buildNodeSchema(entityLabel), [entityLabel]);

	const defaultValues: NodeFormValues = useMemo(
		() => ({
			name: entity?.name ?? "",
			planStart: entity?.planStart ? new Date(entity.planStart) : null,
			planEnd: entity?.planEnd ? new Date(entity.planEnd) : null,
			actualStart: entity?.actualStart ? new Date(entity.actualStart) : null,
			actualEnd: entity?.actualEnd ? new Date(entity.actualEnd) : null,
		}),
		[entity],
	);

	const form = useAppForm({
		defaultValues,
		validators: { onSubmit: schema },
		onSubmit: async ({ value }) => {
			try {
				if (isEditMode && entity) {
					await config.update({
						id: entity.id,
						stageId,
						name: value.name,
						// non-null guaranteed by the schema (required plan dates)
						planStart: value.planStart!,
						planEnd: value.planEnd!,
						actualStart: value.actualStart ?? undefined,
						actualEnd: value.actualEnd ?? undefined,
					});
					toast.add({
						title: `${entityLabel} Edited`,
						description: `"${value.name}" has been edited successfully.`,
						type: "success",
					});
				} else {
					if (!parentId) return;

					// 1. Trigger Loading Toast upon adding
					toast.add({
						title: `Creating ${entityLabel}`,
						description: `Please wait while your ${lower} is being created...`,
						type: "loading",
					});

					// 2. Perform create mutation
					await config.create({
						parentId,
						stageId,
						name: value.name,
						// non-null guaranteed by the schema (required plan dates)
						planStart: value.planStart!,
						planEnd: value.planEnd!,
						actualStart: value.actualStart ?? undefined,
						actualEnd: value.actualEnd ?? undefined,
					});

					// 3. Trigger Success Toast
					toast.add({
						title: `${entityLabel} ${createdVerb === "added" ? "Added" : "Created"}`,
						description: `"${value.name}" has been ${createdVerb} successfully.`,
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
							: `An error occurred while saving the ${lower}.`,
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
							{isEditMode ? `Edit ${entityLabel}` : `Create New ${entityLabel}`}
						</DialogTitle>
						<DialogDescription>
							{isEditMode
								? `Update the ${lower} details below.`
								: `Fill in the details to create a new ${lower}${
										parentLabel ? ` for ${parentLabel}` : ""
									}.`}
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
											label={`${entityLabel} Name`}
											required
											maxLength={35}
											value={field.state.value}
											placeholder={config.namePlaceholder}
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
										<Trash2 className="mr-2 h-4 w-4" /> Delete {entityLabel}
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
									pendingLabel={
										isEditMode
											? "Saving…"
											: createdVerb === "added"
												? "Adding…"
												: "Creating…"
									}
								>
									{isEditMode ? (
										<>
											<Save className="mr-2 h-4 w-4" /> Save Changes
										</>
									) : (
										<>
											<Plus className="mr-2 h-4 w-4" />{" "}
											{createdVerb === "added" ? "Add" : "Create"} {entityLabel}
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
				description={`You have unsaved information in this ${lower}. Are you sure you want to discard your changes?`}
				cancelLabel="Keep Editing"
				confirmLabel="Discard Changes"
				variant="destructive"
				onConfirm={handleConfirmDiscard}
				onCancel={() => setShowDiscardConfirm(false)}
			/>
		</>
	);
}
