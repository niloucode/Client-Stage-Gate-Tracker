"use client";

import { useState } from "react";
import { useResetOnOpen } from "@/shared/hooks/useResetOnOpen";
import { projectCreateSchema, type ProjectCreateInput } from "@/shared/schemas";
import { getFieldErrors } from "@/shared/lib/zod";
import { useClients } from "@/entities/client";
import { FormInput } from "@/components/ui/forminput";
import { DateTimePicker } from "@/components/ui/datetime-picker";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogDescription,
	DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";

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

type FieldErrors = Partial<Record<keyof EditProjectFormState, string>>;

export function EditProjectModal({
	isOpen,
	project,
	onClose,
	onSubmit,
}: EditProjectModalProps) {
	const isEditMode = project !== null;

	const getInitialFormData = (): EditProjectFormState => {
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
	};

	const [formData, setFormData] =
		useState<EditProjectFormState>(getInitialFormData);
	const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
	const { data: clients } = useClients();

	// Reset the form whenever the modal opens (deferred a frame so the
	// dialog can finish mounting before controlled inputs are reset).
	useResetOnOpen(isOpen, () => {
		setFormData(
			project
				? {
						name: project.name,
						description: project.description ?? "",
						client_id: project.client_id ?? "",
						start_date: project.start_date
							? new Date(project.start_date)
							: null,
						deadline_date: project.deadline_date
							? new Date(project.deadline_date)
							: null,
					}
				: emptyFormData,
		);
		setFieldErrors({});
	});

	const formKey = isEditMode ? project!.name : "new";

	const handleClose = () => {
		setFormData(emptyFormData);
		setFieldErrors({});
		onClose();
	};

	const clearFieldError = (field: keyof EditProjectFormState) => {
		if (fieldErrors[field]) {
			setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
		}
	};

	const handleSubmit = () => {
		const result = projectCreateSchema.safeParse(formData);
		if (!result.success) {
			const mapped = getFieldErrors(result);
			setFieldErrors(mapped);
			return;
		}

		setFieldErrors({});
		// result.data is the schema-validated, non-nullable input shape.
		onSubmit(result.data);
	};

	return (
		<Dialog
			open={isOpen}
			onOpenChange={(open) => {
				if (!open) onClose();
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
						onChange={(e) => setFormData({ ...formData, name: e.target.value })}
						onClearError={() => clearFieldError("name")}
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
						onChange={(e) =>
							setFormData({ ...formData, description: e.target.value })
						}
						onClearError={() => clearFieldError("description")}
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
										<SelectItem key={client.client_id} value={client.client_id}>
											{client.client_name}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
					)}

					{/* Dates Section */}
					<div className="flex gap-4">
						<div className="flex flex-1 flex-col gap-1">
							<Label error={!!fieldErrors.start_date}>Start Date</Label>
							<DateTimePicker
								value={formData.start_date ?? undefined}
								onChange={(date) => {
									setFormData({
										...formData,
										start_date: date ?? null,
									});
									clearFieldError("start_date");
								}}
								placeholder="Pick start date"
							/>
							{fieldErrors.start_date && (
								<p className="text-xs text-destructive">
									{fieldErrors.start_date}
								</p>
							)}
						</div>

						<div className="flex flex-1 flex-col gap-1">
							<Label error={!!fieldErrors.deadline_date}>Deadline Date</Label>
							<DateTimePicker
								value={formData.deadline_date ?? undefined}
								onChange={(date) => {
									setFormData({
										...formData,
										deadline_date: date ?? null,
									});
									clearFieldError("deadline_date");
								}}
								placeholder="Pick deadline date"
							/>
							{fieldErrors.deadline_date && (
								<p className="text-xs text-destructive">
									{fieldErrors.deadline_date}
								</p>
							)}
						</div>
					</div>
				</div>
				<DialogFooter>
					<Button onClick={handleClose} variant="ghost">
						Cancel
					</Button>
					<Button onClick={handleSubmit}>
						{isEditMode ? "Save Changes" : "Create Project"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
