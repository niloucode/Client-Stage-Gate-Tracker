"use client";

import { useState, useMemo } from "react";
import { z } from "zod";
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
		start_date?: Date | null;
		deadline_date?: Date | null;
	} | null; // null = "Add" mode
	onClose: () => void;
	onSubmit: (data: ProjectCreateInput) => void;
}

const emptyFormData: EditProjectFormState = {
	name: "",
	description: "",
	client_id: "",
	start_date: null,
	deadline_date: null,
};

const projectModalSchema = projectCreateSchema.superRefine((data, ctx) => {
	if (data.start_date && data.deadline_date && data.start_date > data.deadline_date) {
		const message = "Start must be before End";
		ctx.addIssue({
			code: z.ZodIssueCode.custom,
			message,
			path: ["start_date"],
		});
		ctx.addIssue({
			code: z.ZodIssueCode.custom,
			message,
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
	const isEditMode = project !== null;

	const initialFormData = useMemo((): EditProjectFormState => {
		if (project) {
			return {
				name: project.name,
				description: project.description ?? "",
				client_id: project.client_id ?? "",
				start_date: project.start_date ? new Date(project.start_date) : null,
				deadline_date: project.deadline_date
					? new Date(project.deadline_date)
					: null,
			};
		}
		return emptyFormData;
	}, [project]);

	const [formData, setFormData] = useState<EditProjectFormState>(initialFormData);
	const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
	const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);
	const { data: clients } = useClients();

	// Reset form when modal opens
	useResetOnOpen(isOpen, () => {
		setFormData(initialFormData);
		setFieldErrors({});
		setShowDiscardConfirm(false);
	});

	// Check if user has made unsaved modifications
	const isDirty = useMemo(() => {
		return (
			formData.name !== initialFormData.name ||
			formData.description !== initialFormData.description ||
			formData.client_id !== initialFormData.client_id ||
			formData.start_date?.getTime() !== initialFormData.start_date?.getTime() ||
			formData.deadline_date?.getTime() !== initialFormData.deadline_date?.getTime()
		);
	}, [formData, initialFormData]);

	const formKey = isEditMode ? project!.name : "new";

	const handleClose = () => {
		setFormData(emptyFormData);
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

	const clearFieldError = (field: keyof EditProjectFormState) => {
		if (fieldErrors[field]) {
			setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
		}
	};

	const handleSubmit = () => {
		const result = projectModalSchema.safeParse(formData);
		if (!result.success) {
			const mapped = getFieldErrors(result);
			setFieldErrors(mapped);
			return;
		}

		setFieldErrors({});
		onSubmit(result.data);
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
						<Button onClick={handleAttemptClose} variant="ghost">
							Cancel
						</Button>
						<Button onClick={handleSubmit}>
							{isEditMode ? "Save Changes" : "Create Project"}
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