"use client";

import { useState, useMemo } from "react";
import { useResetOnOpen } from "@/shared/hooks/useResetOnOpen";
import { projectCreateSchema, type ProjectCreateInput } from "@/shared/schemas";
import { getFieldErrors } from "@/shared/lib/zod";
import { useClients } from "@/entities/client";
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
	Label,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	toast,
} from "@/components/ui";

// Internal form state: dates stay nullable while picking; the submit payload
// (ProjectCreateInput) is the schema-validated, non-nullable shape.
interface EditProjectFormState {
	name: string;
	description: string;
	client_id: string;
	start_date: Date | null;
	deadline_date: Date | null;
}

interface EditProjectModalProps {
	isOpen: boolean;
	project: {
		project_id: string;
		name: string;
		description?: string | null;
		client_id?: string | null;
		start_date?: Date | string | null;
		deadline_date?: Date | string | null;
	} | null; // null = "Add" mode
	onClose: () => void;
	onSubmit: (data: ProjectCreateInput) => void | Promise<void>;
}

const emptyFormData: EditProjectFormState = {
	name: "",
	description: "",
	client_id: "",
	start_date: null,
	deadline_date: null,
};

function parseDate(dateVal: Date | string | null | undefined): Date | null {
	if (!dateVal) return null;
	const d = new Date(dateVal);
	return Number.isNaN(d.getTime()) ? null : d;
}

function areDatesEqual(d1: Date | null, d2: Date | null): boolean {
	if (!d1 && !d2) return true;
	if (!d1 || !d2) return false;
	const t1 = d1.getTime();
	const t2 = d2.getTime();
	if (Number.isNaN(t1) && Number.isNaN(t2)) return true;
	return t1 === t2;
}

function getInitialFormData(
	project: EditProjectModalProps["project"],
): EditProjectFormState {
	if (project) {
		return {
			name: project.name ?? "",
			description: project.description ?? "",
			client_id: project.client_id ?? "",
			start_date: parseDate(project.start_date),
			deadline_date: parseDate(project.deadline_date),
		};
	}
	return emptyFormData;
}

const projectModalSchema = projectCreateSchema.superRefine((data, ctx) => {
	if (data.start_date && data.deadline_date && data.start_date > data.deadline_date) {
		ctx.addIssue({
			code: "custom",
			message: "Start must be before End",
			path: ["start_date"],
		});
		ctx.addIssue({
			code: "custom",
			message: "End must be after Start",
			path: ["deadline_date"],
		});
	}
});

type FieldErrors = Partial<Record<keyof EditProjectFormState, string>>;

export function EditProjectModal({
	isOpen,
	project,
	onClose,
	onSubmit,
}: EditProjectModalProps) {
	// Cache project during render so exit transitions retain Edit mode UI without triggering cascading renders
	const [cachedProject, setCachedProject] = useState(project);
	const [prevProject, setPrevProject] = useState(project);

	if (project !== prevProject) {
		setPrevProject(project);
		if (project !== null) {
			setCachedProject(project);
		}
	}

	const activeProject = isOpen ? project : (project ?? cachedProject);
	const isEditMode = activeProject !== null;

	const initialFormData = useMemo(
		() => getInitialFormData(activeProject),
		[activeProject],
	);

	const [formData, setFormData] = useState<EditProjectFormState>(initialFormData);
	const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
	const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const { data: clients } = useClients();

	// Reset form state when modal opens
	useResetOnOpen(isOpen, () => {
		const init = getInitialFormData(project);
		setFormData(init);
		setFieldErrors({});
		setShowDiscardConfirm(false);
		setIsSubmitting(false);
	});

	// Check if user has made unsaved modifications
	const isDirty = useMemo(() => {
		return (
			formData.name !== initialFormData.name ||
			formData.description !== initialFormData.description ||
			formData.client_id !== initialFormData.client_id ||
			!areDatesEqual(formData.start_date, initialFormData.start_date) ||
			!areDatesEqual(formData.deadline_date, initialFormData.deadline_date)
		);
	}, [formData, initialFormData]);

	const formKey = isEditMode ? activeProject!.project_id : "new";

	const handleClose = () => {
		setFieldErrors({});
		setShowDiscardConfirm(false);
		setIsSubmitting(false);
		onClose();
	};

	// Prevents exiting if unsaved changes exist
	const handleAttemptClose = () => {
		if (isSubmitting) return;
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

	const clearFieldError = (field: keyof EditProjectFormState) => {
		if (fieldErrors[field]) {
			setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
		}
	};

	const handleSubmit = async () => {
		const result = projectModalSchema.safeParse(formData);
		if (!result.success) {
			const mapped = getFieldErrors(result);
			setFieldErrors(mapped);
			return;
		}

		setFieldErrors({});
		setIsSubmitting(true);

		// Trigger Loading Toast
		toast.add({
			title: isEditMode ? "Saving Changes" : "Creating Project",
			description: isEditMode
				? "Please wait while your changes are being saved..."
				: "Please wait while your project is being created...",
			type: "loading",
		});

		try {
			await onSubmit(result.data);
		} catch (err) {
			toast.add({
				title: isEditMode ? "Save Failed" : "Creation Failed",
				description:
					err instanceof Error
						? err.message
						: "An error occurred while processing the project.",
				type: "error",
			});
		} finally {
			setIsSubmitting(false);
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
							{isEditMode ? "Edit Project" : "Create New Project"}
						</DialogTitle>
						<DialogDescription>
							Fill in the details for this project.
						</DialogDescription>
					</DialogHeader>
					<div className="space-y-4" key={formKey}>
						{/* Project Name */}
						<FormInput
							variant="input"
							label="Project Name"
							required
							maxLength={50}
							value={formData.name}
							placeholder="Project Name"
							error={fieldErrors.name}
							onChange={(e) => {
								setFormData({ ...formData, name: e.target.value });
								clearFieldError("name");
							}}
						/>

						{/* Description */}
						<FormInput
							variant="textarea"
							label="Description"
							maxLength={160}
							rows={4}
							value={formData.description}
							placeholder="Project Description"
							error={fieldErrors.description}
							onChange={(e) => {
								setFormData({ ...formData, description: e.target.value });
								clearFieldError("description");
							}}
						/>

						{/* Client Selection (Create Mode Only) */}
						{!isEditMode && (
							<div>
								<div className="flex">
									<Label required>Client</Label>
									{typeof fieldErrors.client_id === "string" && (
										<div className="ml-auto text-xs text-destructive">
											{fieldErrors.client_id}
										</div>
									)}
								</div>
								<Select
									value={formData.client_id}
									onValueChange={(val) => {
										setFormData({ ...formData, client_id: val ?? "" });
										clearFieldError("client_id");
									}}
								>
									<SelectTrigger
										className={`mt-1 w-full ${
											fieldErrors.client_id
												? "border-destructive text-destructive focus:ring-destructive"
												: ""
										}`}
										aria-label="Client"
										aria-invalid={!!fieldErrors.client_id}
									>
										<SelectValue placeholder="Select client...">
											{
												(clients ?? []).find(
													(c) => c.client_id === formData.client_id,
												)?.client_name
											}
										</SelectValue>
									</SelectTrigger>
									<SelectContent>
										{(clients ?? []).map((client) => (
											<SelectItem
												key={client.client_id}
												value={client.client_id}
											>
												{client.client_name}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
						)}

						{/* Dates Section */}
						<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
							<DateTimePicker
								label="Plan Start"
								required
								value={
									formData.start_date
										? new Date(formData.start_date)
										: undefined
								}
								onChange={(date) => {
									setFormData({
										...formData,
										start_date: date ?? null,
									});
									clearFieldError("start_date");
									clearFieldError("deadline_date");
								}}
								placeholder="Pick Planned Start"
								error={fieldErrors.start_date}
							/>

							<DateTimePicker
								label="Plan End"
								required
								value={
									formData.deadline_date
										? new Date(formData.deadline_date)
										: undefined
								}
								onChange={(date) => {
									setFormData({
										...formData,
										deadline_date: date ?? null,
									});
									clearFieldError("start_date");
									clearFieldError("deadline_date");
								}}
								placeholder="Pick Planned End"
								error={fieldErrors.deadline_date}
							/>
						</div>
					</div>
					<DialogFooter>
						<Button
							onClick={handleAttemptClose}
							variant="ghost"
							disabled={isSubmitting}
						>
							Cancel
						</Button>
						<Button onClick={handleSubmit} disabled={isSubmitting}>
							{isSubmitting
								? isEditMode
									? "Saving…"
									: "Creating…"
								: isEditMode
									? "Save Changes"
									: "Create Project"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Discard Unsaved Changes Confirmation Modal */}
			<ConfirmationModal
				isOpen={showDiscardConfirm}
				title="Discard Unsaved Changes?"
				description="You have unsaved information in this project. Are you sure you want to discard your changes?"
				cancelLabel="Keep Editing"
				confirmLabel="Discard Changes"
				variant="destructive"
				onConfirm={handleConfirmDiscard}
				onCancel={() => setShowDiscardConfirm(false)}
			/>
		</>
	);
}