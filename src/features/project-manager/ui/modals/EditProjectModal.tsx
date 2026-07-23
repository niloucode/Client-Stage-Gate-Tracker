"use client";

import { useState, useEffect, useRef } from "react";
import { projectCreateSchema } from "@/shared/schemas";
import { Label } from "@/shared/ui/label";
import { clientSelectAll } from "@/entities/client/clientActions";

interface EditProjectFormData {
	name: string;
	description: string;
	client_id: string | null;
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
	onSubmit: (data: EditProjectFormData) => void;
}

const emptyFormData: EditProjectFormData = {
	name: "",
	description: "",
	client_id: null,
	start_date: null,
	deadline_date: null,
};

type FieldErrors = Partial<Record<keyof EditProjectFormData, string>>;

function toDateInput(date: Date | null): string {
	if (!date) return "";
	const d = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
	return d.toISOString().slice(0, 16);
}

export function EditProjectModal({
	isOpen,
	project,
	onClose,
	onSubmit,
}: EditProjectModalProps) {
	const isEditMode = project !== null;

	// Derive initial form state from project prop — re-evaluated on each mount via key
	const getInitialFormData = (): EditProjectFormData => {
		if (project) {
			return {
				name: project.name,
				description: project.description ?? "",
				client_id: project.client_id ?? null,
				start_date: project.start_date ?? null,
				deadline_date: project.deadline_date ?? null,
			};
		}
		return emptyFormData;
	};

	const [formData, setFormData] = useState<EditProjectFormData>(getInitialFormData);
	const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
	const [clients, setClients] = useState<Awaited<ReturnType<typeof clientSelectAll>>>([]);
	const [clientDropdownOpen, setClientDropdownOpen] = useState(false);
	const mountedRef = useRef(true);

	useEffect(() => {
		mountedRef.current = true;
		return () => { mountedRef.current = false; };
	}, []);

	useEffect(() => {
		clientSelectAll().then((data) => {
			if (mountedRef.current) setClients(data);
	console.log(data)
		}).catch((err) => console.error("Failed to load clients", err));
	}, []);

	// Sync form data when project prop changes (modal opens for a different project)
	const prevProjectIdRef = useRef(project?.project_id ?? null);
	useEffect(() => {
		const currentId = project?.project_id ?? null;
		if (currentId !== prevProjectIdRef.current) {
			const initial = getInitialFormData();
			const id = setTimeout(() => {
				setFormData(initial);
				setFieldErrors({});
			}, 0);
			prevProjectIdRef.current = currentId;
			return () => clearTimeout(id);
		}
	}, [project]); // eslint-disable-line react-hooks/exhaustive-deps

	// Reset form when modal opens in Add mode
	useEffect(() => {
		if (isOpen && !project) {
			const id = setTimeout(() => {
				setFormData(emptyFormData);
				setFieldErrors({});
			}, 0);
			return () => clearTimeout(id);
		}
	}, [isOpen, project]);

	// Reset form when project or modal state changes — use key on container
	const formKey = isEditMode ? project.project_id : "new";

	if (!isOpen) return null;

	const handleClose = () => {
		setFormData(emptyFormData);
		setFieldErrors({});
		onClose();
	};

	const handleSubmit = () => {
		// Client is required in Create mode
		if (!isEditMode && !formData.client_id) {
			setFieldErrors((prev) => ({ ...prev, client_id: "Please select a client" }));
			return;
		}
		const result = projectCreateSchema.safeParse(formData);
		if (!result.success) {
			const flattened = result.error.flatten().fieldErrors;
			const mapped: FieldErrors = {};
			for (const [key, msgs] of Object.entries(flattened)) {
				if (msgs && msgs.length > 0)
					mapped[key as keyof EditProjectFormData] = msgs[0];
			}
			setFieldErrors(mapped);
			return;
		}
		setFieldErrors({});
		onSubmit(formData);
	};

	return (
		<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" key={formKey}>
			<div className="bg-[#FAF8FF] rounded-xl shadow-xl w-full max-w-lg relative">
				<div className="h-[4em] bg-white rounded-t-xl border-b-1 p-6 flex border-[#C7C4D8]">
					<h2 className="mt-auto mb-auto text-l font text-[#0F172A]">
						{isEditMode ? "Edit Project" : "Create New Project"}
					</h2>

					<button
						onClick={handleClose}
						className="ml-auto text-[#94A3B8] hover:text-[#475569] transition-colors"
					>
						<svg width="20" height="20" viewBox="0 0 20 20" fill="none">
							<path
								d="M15 5L5 15M5 5L15 15"
								stroke="currentColor"
								strokeWidth="2"
								strokeLinecap="round"
							/>
						</svg>
					</button>

				</div>
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
						<input
							type="text"
							maxLength={50}
							value={formData.name}
							onChange={(e) =>
								setFormData({ ...formData, name: e.target.value })
							}
							placeholder="Project Name"
							className={`w-full mt-1 px-3 py-2 bg-white border rounded-lg text-sm text-[#0F172A] focus:outline-none focus:border-[#4F46E5] focus:ring-1 focus:ring-[#4F46E5] transition-all ${
								fieldErrors.name
									? "border-red-400 focus:ring-red-400"
									: "border-[#CBD5E1]"
							}`}
						/>
						<div className="flex justify-between h-[10px] mt-1">
							{fieldErrors.name ? (
								<p className="text-xs text-red-500">{fieldErrors.name}</p>
							) : (
								<span />
							)}
						</div>
					</div>

					{/* Description */}
					<div>
						<div className="flex">
							<Label>Description</Label>
							<span className="ml-auto mt-auto text-[10px] text-[#94A3B8]">
								{formData.description.length}/160
							</span>
						</div>
						<textarea
							value={formData.description}
							maxLength={160}
							onChange={(e) =>
								setFormData({ ...formData, description: e.target.value })
							}
							placeholder="Project Description"
							rows={4}
							className="w-full mt-1 px-3 py-2 bg-white border border-[#CBD5E1] rounded-lg text-sm text-[#0F172A] resize-none focus:outline-none focus:border-[#4F46E5] focus:ring-1 focus:ring-[#4F46E5] transition-all"
						/>
					</div>

					{/* Client - only show in Create mode */}
					{!isEditMode && (
						<div className="relative">
							<Label required error={!!fieldErrors.client_id}>Client</Label>
							<button
								type="button"
								onClick={() => setClientDropdownOpen(!clientDropdownOpen)}
								className={`w-full flex items-center justify-between px-3 py-2 bg-white border rounded-lg text-sm text-[#0F172A] focus:outline-none focus:border-[#4F46E5] focus:ring-1 focus:ring-[#4F46E5] transition-all mt-1.5 ${
									fieldErrors.client_id ? "border-red-400 focus:ring-red-400" : "border-[#CBD5E1]"
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
								<div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden max-h-48 overflow-y-auto">
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

							{fieldErrors.client_id && (
								<p className="text-xs text-red-500 mt-1">{fieldErrors.client_id}</p>
							)}
						</div>
					)}
					<div className="flex">
						{/* Start Date */}
						<div>
							<Label>Start Date</Label>
							<input
								type="datetime-local"
								value={toDateInput(formData.start_date)}
								onChange={(e) =>
									setFormData({
										...formData,
										start_date: e.target.value
											? new Date(e.target.value + ":00")
											: null,
									})
								}
								className="px-3 py-2 bg-white border border-[#CBD5E1] rounded-lg text-sm text-[#0F172A] 
								focus:outline-none focus:border-[#4F46E5] focus:ring-1 focus:ring-[#4F46E5] transition-all"
							/>
						</div>

						{/* Deadline Date */}
						<div className="ml-auto">
							<Label>Deadline Date</Label>
							<input
								type="datetime-local"
								value={toDateInput(formData.deadline_date)}
								onChange={(e) =>
									setFormData({
										...formData,
										deadline_date: e.target.value
											? new Date(e.target.value + ":00")
											: null,
									})
								}
								className="w-full px-3 py-2 bg-white border border-[#CBD5E1] rounded-lg text-sm text-[#0F172A]
								focus:outline-none focus:border-[#4F46E5] focus:ring-1 focus:ring-[#4F46E5] transition-all"
							/>
						</div>
					</div>
				</div>

				<div className="h-[4em] p-3 border-[#C7C4D8] flex rounded-b-xl justify-end gap-3 bg-[#F2F3FF] border-t-1">
					<button
						onClick={handleClose}
						className="px-4 py-2 text-sm font-semibold text-[#64748B] hover:text-[#0F172A] transition-colors"
					>
						Cancel
					</button>
					<button
						onClick={handleSubmit}
						className="px-4 py-2 bg-[#4F46E5] text-white text-sm font-semibold rounded-lg hover:bg-[#4338CA] transition-all shadow-sm"
					>
						{isEditMode ? "Save Changes" : "Create Project"}
					</button>
				</div>
			</div>
		</div>
	);
}
