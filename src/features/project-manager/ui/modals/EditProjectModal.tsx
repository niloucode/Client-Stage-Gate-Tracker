"use client"

import { useState, useEffect, useRef } from "react"
import { useResetOnOpen } from "@/shared/hooks/useResetOnOpen"
import { projectCreateSchema } from "@/shared/schemas"
import { getFieldErrors } from "@/shared/lib/zod"
import { toDateTimeLocalInput } from "@/shared/lib/scheduling"
import { clientSelectAll } from "@/entities/client/clientActions"
import { SelectOption } from "@/shared/ui/"
import { FormInput } from "@/components/ui/forminput"
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogDescription,
	DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select"

interface EditProjectFormData {
name: string
description: string
client_id: string | null
start_date: Date | null
deadline_date: Date | null
}

interface EditProjectModalProps {
isOpen: boolean
project: {
	project_id: string
	name: string
	description?: string | null
	client_id?: string | null
	start_date?: Date | null
	deadline_date?: Date | null
} | null // null = "Add" mode
onClose: () => void
onSubmit: (data: EditProjectFormData) => void
}

const emptyFormData: EditProjectFormData = {
	name: "",
	description: "",
	client_id: null,
	start_date: null,
	deadline_date: null,
}

type FieldErrors = Partial<Record<keyof EditProjectFormData, string>>

function toDateInput(date: Date | null): string {
	return toDateTimeLocalInput(date)
}

export function EditProjectModal({
	isOpen,
	project,
	onClose,
	onSubmit,
}: EditProjectModalProps) {
	
	// Freeze the "displayed" project while the dialog is open/closing so the
	// exit animation doesn't flash Add-mode when the parent clears `project`
	// at the same time it sets isOpen=false.
	const [displayProject, setDisplayProject] = useState(project)
	useEffect(() => {
	if (isOpen) setDisplayProject(project)
	}, [isOpen, project])

	const isEditMode = displayProject !== null

	const getInitialFormData = (): EditProjectFormData => {
		if (project) {
		return {
			name: project.name,
			description: project.description ?? "",
			client_id: project.client_id ?? null,
			start_date: project.start_date ?? null,
			deadline_date: project.deadline_date ?? null,
		}
		}
		return emptyFormData
	}

	const [formData, setFormData] = useState<EditProjectFormData>(getInitialFormData)
	const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
	const [clients, setClients] = useState<Awaited<ReturnType<typeof clientSelectAll>>>([])
	const mountedRef = useRef(true)

	useEffect(() => {
		mountedRef.current = true
		return () => {
		mountedRef.current = false
		}
	}, [])

	useEffect(() => {
		clientSelectAll()
		.then((data) => {
			if (mountedRef.current) setClients(data)
		})
		.catch((err) => console.error("Failed to load clients", err))
	}, [])

	// Sync form data when project prop changes
	useEffect(() => {
		if (isOpen) {
		setFormData(
			project
			? {
				name: project.name,
				description: project.description ?? "",
				client_id: project.client_id ?? null,
				start_date: project.start_date ?? null,
				deadline_date: project.deadline_date ?? null,
				}
			: emptyFormData
		)
		setFieldErrors({})
		}
	}, [isOpen, project])

	// Reset form state on Add mode open
	useResetOnOpen(isOpen && !project, () => {
		setFormData(emptyFormData)
		setFieldErrors({})
	})

	const formKey = isEditMode ? displayProject!.name : "new"

	const handleClose = () => {
		setFormData(emptyFormData)
		setFieldErrors({})
		onClose()
	}

	const clearFieldError = (field: keyof EditProjectFormData) => {
		if (fieldErrors[field]) {
		setFieldErrors((prev) => ({ ...prev, [field]: undefined }))
		}
	}

	const handleSubmit = () => {
		const result = projectCreateSchema.safeParse(formData)
		if (!result.success) {
		const mapped = getFieldErrors(result)
		setFieldErrors(mapped)
		return
		}

		setFieldErrors({})
		onSubmit(formData)
	}

	// Format options for the client select dropdown. The empty state is
	// handled by the SelectValue placeholder below — never add a null-valued
	// option here (it would crash the SelectItem render loop).
	const clientOptions: SelectOption[] = clients.map((c) => ({
		label: c.client_name,
		value: c.client_id,
	}))

	return (
		<Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose() }}>
		<DialogContent>
			<DialogHeader>
			<DialogTitle>{isEditMode ? "Edit Project" : "Create New Project"}</DialogTitle>
			<DialogDescription>Fill in the details for this project.</DialogDescription>
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
				onChange={(e) => setFormData({ ...formData, description: e.target.value })}
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
					value={formData.client_id ?? undefined}
					onValueChange={(val) => {
						setFormData({ ...formData, client_id: val })
						clearFieldError("client_id")
					}}
					>
					<SelectTrigger className="mt-1 w-full" aria-label="Client">
						<SelectValue placeholder="Select client..." />
					</SelectTrigger>
					<SelectContent>
						{clientOptions.map((opt) => {
						// Defensive: never render an option without a usable value
						if (opt.value === null) return null
						const val = String(opt.value)
						return (
							<SelectItem key={val} value={val}>
							{opt.label}
							</SelectItem>
						)
						})}
					</SelectContent>
					</Select>
				</div>
				)}

				{/* Dates Section */}
				<div className="flex gap-4">
				<FormInput
					variant="datetime-local"
					label="Start Date"
					type="datetime-local"
					value={toDateInput(formData.start_date)}
					error={fieldErrors.start_date}
					containerClassName="flex-1"
					onChange={(e) =>
					setFormData({
						...formData,
						start_date: e.target.value ? new Date(e.target.value) : null,
					})
					}
					onClearError={() => clearFieldError("start_date")}
				/>

				<FormInput
					variant="datetime-local"
					label="Deadline Date"
					type="datetime-local"
					value={toDateInput(formData.deadline_date)}
					error={fieldErrors.deadline_date}
					containerClassName="flex-1"
					onChange={(e) =>
					setFormData({
						...formData,
						deadline_date: e.target.value ? new Date(e.target.value) : null,
					})
					}
					onClearError={() => clearFieldError("deadline_date")}
				/>
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
	)
}