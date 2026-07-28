"use client"

import { useState, useEffect, useRef } from "react"
import { projectCreateSchema } from "@/shared/schemas"
import { Label } from "@/shared/ui/label"
import { Input } from "@/shared/ui/input"
import { clientSelectAll } from "@/entities/client/clientActions"
import { Backdrop } from "@/shared/ui/backdrop"
import { Modal } from "@/shared/ui/modal"
import { Button } from "@/shared/ui/button"

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
	if (!date) return ""
	const d = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
	return d.toISOString().slice(0, 16)
}

export function EditProjectModal({
	isOpen,
	project,
	onClose,
	onSubmit,
}: EditProjectModalProps) {
	const isEditMode = project !== null

	// Derive initial form state from project prop — re-evaluated on each mount via key
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
	const [clientDropdownOpen, setClientDropdownOpen] = useState(false)
	const mountedRef = useRef(true)

	useEffect(() => {
		mountedRef.current = true
		return () => { mountedRef.current = false }
	}, [])

	useEffect(() => {
		clientSelectAll().then((data) => {
			if (mountedRef.current) setClients(data)
	console.log(data)
		}).catch((err) => console.error("Failed to load clients", err))
	}, [])

	// Sync form data when project prop changes (modal opens for a different project)
	// const prevProjectIdRef = useRef(project?.project_id ?? null)
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

	// Reset form when modal opens in Add mode
	useEffect(() => {
		if (isOpen && !project) {
			const id = setTimeout(() => {
				setFormData(emptyFormData)
				setFieldErrors({})
			}, 0)
			return () => clearTimeout(id)
		}
	}, [isOpen, project])

	// Reset form when project or modal state changes — use key on container
	const formKey = isEditMode ? project.project_id : "new"

	if (!isOpen) return null

	const handleClose = () => {
		setFormData(emptyFormData)
		setFieldErrors({})
		onClose()
	}

	const handleSubmit = () => {
		if (isEditMode && !formData.name) {
			setFieldErrors((prev) => ({ ...prev, name: "Project name is required" }))
			return
		}

		if (!isEditMode && !formData.client_id) {
			setFieldErrors((prev) => ({ ...prev, client_id: "Please select a client" }))
			return
		}

		const result = projectCreateSchema.safeParse(formData)
		if (!result.success) {
			const flattened = result.error.flatten().fieldErrors
			const mapped: FieldErrors = {}
			for (const [key, msgs] of Object.entries(flattened)) {
				if (msgs && msgs.length > 0)
					mapped[key as keyof EditProjectFormData] = msgs[0]
			}
			setFieldErrors(mapped)
			return
		}

		setFieldErrors({})
		onSubmit(formData)
	}

	return (
			<Modal 
				isOpen={isOpen}
				onClose={onClose}
				title={isEditMode ? "Edit Project" : "Create New Project"}
				subtitle={"Fill in the details for this project."}
				width="xl"
				footer={<>
					<Button onClick={handleClose} variant="transparency">
						Cancel
					</Button>
					<Button onClick={handleSubmit}>
						{isEditMode ? "Save Changes" : "Create Project"}
					</Button>
				</>}>
					<div key={formKey}>
					<div className="space-y-4 p-6">
					{/* Project Name */}
					<div>
						<div className="flex">
							<Label required error={!!fieldErrors.name}>
								Project Name
							</Label>
							<span className="ml-auto mt-auto text-[10px] text-[#94A3B8]">
								{formData.name.length}/50
							</span>
						</div>
						<Input
							type="text"
							maxLength={50}
							value={formData.name}
							error={fieldErrors.name}
							onChange={(e) => {
								setFormData({ ...formData, name: e.target.value });
								if (fieldErrors.name) setFieldErrors((prev) => ({ ...prev, name: undefined }));
							}}
							placeholder="Project Name"
							className="mt-1"
						/>
					</div>

					{/* Description */}
					<div>
						<div className="flex">
							<Label error={!!fieldErrors.description}>Description</Label>
							<span className="ml-auto mt-auto text-[10px] text-[#94A3B8]">
								{formData.description.length}/160
							</span>
						</div>
						<textarea
							value={formData.description}
							maxLength={160}
							onChange={(e) => {
								setFormData({ ...formData, description: e.target.value });
								if (fieldErrors.description) setFieldErrors((prev) => ({ ...prev, description: undefined }));
							}}
							placeholder="Project Description"
							rows={4}
							className={`w-full mt-1 px-3.5 py-2.5 bg-neutral-surface border rounded-lg text-sm text-[#0F172A] resize-none focus:outline-none focus:ring-2 focus:border-transparent transition-all ${
								fieldErrors.description
									? "border-red-400 focus:ring-red-400"
									: "border-gray-300 focus:ring-brand-500"
							}`}
						/>
					
						<div className="mt-1 h-1">
							{fieldErrors.description && (
								<p className="text-xs text-red-500 ">{fieldErrors.description}</p>
							)}
						</div>
					</div>

					{/* Client Selection (Create Mode Only) */}
					{!isEditMode && (
						<div className="relative">
							<Label required error={!!fieldErrors.client_id}>Client</Label>
							<button
								type="button"
								onClick={() => setClientDropdownOpen(!clientDropdownOpen)}
								className={`cursor-pointer w-full flex items-center justify-between px-3.5 py-2.5 bg-neutral-surface border rounded-lg text-sm text-[#0F172A] focus:outline-none focus:ring-2 focus:border-transparent transition-all mt-1 ${
									fieldErrors.client_id 
										? "border-red-400 focus:ring-red-400" 
										: "border-gray-300 focus:ring-brand-500"
								}`}
							>
								<span className={formData.client_id ? "" : "text-[#94A3B8]"}>
									{formData.client_id
										? clients.find((c) => c.client_id === formData.client_id)?.client_name ?? "Select client..."
										: "Select client..."}
								</span>
								<svg width="12" height="12" viewBox="0 0 12 12" fill="none" className={`transform transition-transform ${clientDropdownOpen ? "rotate-180" : ""}`}>
									<path d="M3 4.5L6 7.5L9 4.5" stroke="#64748B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
								</svg>
							</button>

							{clientDropdownOpen && (
								<div className="absolute z-10 mt-1 w-full bg-neutral-surface border border-gray-200 rounded-lg shadow-lg overflow-hidden max-h-48 overflow-y-auto">
									<div
										onClick={() => {
											setFormData({ ...formData, client_id: null });
											setFieldErrors((prev) => ({ ...prev, client_id: undefined }));
											setClientDropdownOpen(false);
										}}
										className="px-3.5 py-2.5 text-sm cursor-pointer hover:bg-gray-50 text-[#94A3B8]"
									>
										Select client...
									</div>
									{clients.map((c) => (
										<div
											key={c.client_id}
											onClick={() => {
												setFormData({ ...formData, client_id: c.client_id });
												setFieldErrors((prev) => ({ ...prev, client_id: undefined }));
												setClientDropdownOpen(false);
											}}
											className={`px-3.5 py-2.5 text-sm cursor-pointer hover:bg-gray-50 ${
												formData.client_id === c.client_id ? "bg-indigo-50 text-indigo-700 font-medium" : "text-[#0F172A]"
											}`}
										>
											{c.client_name}
										</div>
									))}
								</div>
							)}

							<div className="mt-1 h-1">
								{fieldErrors.client_id && (
									<p className="text-xs text-red-500 ">{fieldErrors.client_id}</p>
								)}
							</div>
						</div>
					)}

					{/* Dates Section */}
					<div className="flex gap-4">
						{/* Start Date */}
						<div className="flex-1">
							<Label error={!!fieldErrors.start_date}>Start Date</Label>
							<Input
								type="datetime-local"
								value={toDateInput(formData.start_date)}
								error={fieldErrors.start_date}
								onChange={(e) => {
									setFormData({
										...formData,
										start_date: e.target.value ? new Date(e.target.value) : null,
									});
									if (fieldErrors.start_date) setFieldErrors((prev) => ({ ...prev, start_date: undefined }));
								}}
								className="mt-1"
							/>
						</div>

						{/* Deadline Date */}
						<div className="flex-1">
							<Label error={!!fieldErrors.deadline_date}>Deadline Date</Label>
							<Input
								type="datetime-local"
								value={toDateInput(formData.deadline_date)}
								error={fieldErrors.deadline_date}
								onChange={(e) => {
									setFormData({
										...formData,
										deadline_date: e.target.value ? new Date(e.target.value) : null,
									});
									if (fieldErrors.deadline_date) setFieldErrors((prev) => ({ ...prev, deadline_date: undefined }));
								}}
								className="mt-1"
							/>
						</div>
					</div>
				</div>
			</div>
			</Modal>
		);
}
