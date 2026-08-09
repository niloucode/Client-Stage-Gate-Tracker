"use client"

import { useState, useRef, useEffect } from "react"
import { FormInput } from "@/shared/ui"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tag } from "@/entities/types"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ChevronDown, Check, Paperclip } from "lucide-react"
import { useProfiles } from "@/entities/profile/queries"
import { createClient } from "@/lib/supabase/client"
import type { CreateTicketParams } from "@/shared/schemas"

// ── Types ─────────────────────────────────────────────────────────────────────

/** Fields the modal collects — everything except workflow_id and status (added by TicketBoard). */
type CreateTicketFormData = Omit<CreateTicketParams, "workflow_id" | "status">

interface CreateTicketModalProps {
	isOpen: boolean
	onClose: () => void
	onCreateTicket: (data: CreateTicketFormData) => Promise<void>
	tags: Tag[]
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function TicketModalCreate({
	isOpen,
	onClose,
	onCreateTicket,
	tags,
}: CreateTicketModalProps) {
	const [title, setTitle] = useState("")
	const [description, setDescription] = useState("")
	const [deadline, setDeadline] = useState("")
	const today = new Date().toISOString().split("T")[0]

	const [selectedTags, setSelectedTags] = useState<string[]>([])
	const [tagsOpen, setTagsOpen] = useState(false)
	const tagsRef = useRef<HTMLDivElement>(null)

	const { data: profiles = [] } = useProfiles()

	const [assignedOpen, setAssignedOpen] = useState(false)
	const [assignedIds, setAssignedIds] = useState<string[]>([])
	const [watcherId, setWatcherId] = useState("")
	const [watcherOpen, setWatcherOpen] = useState(false)
	const assignedRef = useRef<HTMLDivElement>(null)
	const watcherRef = useRef<HTMLDivElement>(null)

	const [imageFiles, setImageFiles] = useState<File[]>([])
	const [imagePreviews, setImagePreviews] = useState<string[]>([])

	const [apiMethod, setApiMethod] = useState<"GET" | "POST" | "PUT" | "DELETE">(
		"GET",
	)
	const [apiRoute, setApiRoute] = useState("")

	useEffect(() => {
		function handleClickOutside(e: MouseEvent) {
			if (tagsRef.current && !tagsRef.current.contains(e.target as Node)) {
				setTagsOpen(false)
			}
			if (assignedRef.current && !assignedRef.current.contains(e.target as Node)) {
				setAssignedOpen(false)
			}
			if (watcherRef.current && !watcherRef.current.contains(e.target as Node)) {
				setWatcherOpen(false)
			}
		}
		document.addEventListener("mousedown", handleClickOutside)
		return () => document.removeEventListener("mousedown", handleClickOutside)
	}, [])

	function toggleTag(tagId: string) {
		setSelectedTags((prev) =>
			prev.includes(tagId) ? prev.filter((t) => t !== tagId) : [...prev, tagId],
		)
	}

	function toggleAssigned(profileId: string) {
		setAssignedIds((prev) =>
			prev.includes(profileId)
				? prev.filter((id) => id !== profileId)
				: [...prev, profileId],
		)
	}

	const isApiTagSelected = selectedTags.some(
		(tagId) =>
			tags.find((t) => t.tag_id === tagId)?.name?.toLowerCase() === "api",
	)

	function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
		const files = e.target.files
		if (!files || files.length === 0) return
		const newFiles: File[] = []
		const newPreviews: string[] = []
		for (const file of Array.from(files)) {
			if (file.size > 5 * 1024 * 1024) {
				alert(`Image "${file.name}" must be under 5MB.`)
				continue
			}
			newFiles.push(file)
			newPreviews.push(URL.createObjectURL(file))
		}
		if (newFiles.length > 0) {
			setImageFiles((prev) => [...prev, ...newFiles])
			setImagePreviews((prev) => [...prev, ...newPreviews])
		}
		e.target.value = ""
	}

	function removeCreateImage(index: number) {
		URL.revokeObjectURL(imagePreviews[index])
		setImageFiles((prev) => prev.filter((_, i) => i !== index))
		setImagePreviews((prev) => prev.filter((_, i) => i !== index))
	}

		async function handleSubmit(e: React.FormEvent) {
		e.preventDefault()
		if (!title.trim()) return

		const imageUrls: string[] = []

		// Upload images to Supabase
		if (imageFiles.length > 0) {
			try {
				const supabase = createClient()
				for (const file of imageFiles) {
					const fileExt = file.name.split(".").pop()
					const fileName = `${crypto.randomUUID()}.${fileExt}`
					const filePath = `tickets/${fileName}`

					const { error } = await supabase.storage
						.from("images")
						.upload(filePath, file, {
							cacheControl: "3600",
							upsert: false,
						})

					if (error) throw new Error(`Failed to upload image: ${error.message}`)

					const {
						data: { publicUrl },
					} = supabase.storage.from("images").getPublicUrl(filePath)

					imageUrls.push(publicUrl)
				}
			} catch (err) {
				console.error("Image upload failed:", err)
			}
		}

		onCreateTicket({
			name: title.trim(),
			deadline_date: deadline ? new Date(deadline) : new Date(),
			watcher_id: watcherId || null,
			TicketAssigned: assignedIds,
			tagIds: selectedTags,
			description: description.trim() || null,
			api_route: apiRoute || null,
			api_method: apiMethod || null,
			image_urls: imageUrls,
		})

		setTitle("")
		setDescription("")
		setDeadline("")
		setWatcherId("")
		setSelectedTags([])
		setAssignedIds([])
		setImageFiles([])
		setImagePreviews([])
		setApiMethod("GET")
		setApiRoute("")
		onClose()
	}


	const colorClasses = {
		indigo: "bg-indigo-50 text-indigo-700",
		red: "bg-red-50 text-red-700",
		green: "bg-green-50 text-green-700",
		blue: "bg-blue-50 text-blue-700",
		yellow: "bg-yellow-50 text-yellow-700",
		purple: "bg-purple-50 text-purple-700",
		pink: "bg-pink-50 text-pink-700",
		gray: "bg-gray-50 text-gray-700",
	}

	return (
		<Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose() }}>
			<DialogContent className="sm:max-w-2xl">
				{/* Modal header */}
				<DialogHeader>
					<DialogTitle>New Ticket</DialogTitle>
					<DialogDescription>Create a new ticket for the board.</DialogDescription>
				</DialogHeader>

				<div className="h-px bg-gray-100 shrink-0" />

				{/* Form */}
				<form
					onSubmit={handleSubmit}
					className="flex-1 overflow-y-auto px-6 py-5 space-y-5"
				>
					{/* Ticket Name */}
					<FormInput
					label="Ticket Name"
					required
					placeholder="e.g., Update Landing Page Hero"
					value={title}
					onChange={(e) => setTitle(e.target.value)}
					maxLength={50}
					/>

					{/* Description */}
					<FormInput
					variant="textarea"
					label="Description"
					placeholder="Provide detailed information about this ticket..."
					value={description}
					onChange={(e) => setDescription(e.target.value)}
					rows={4}
					maxLength={160}
					/>

					{/* Assigned to + Watchers row */}
					<div className="grid grid-cols-2 gap-4">
						{/* Assigned To */}
						<div className="space-y-1.5" ref={assignedRef}>
							<Label>Assigned To</Label>
							<div className="relative">
								<button
									type="button"
									onClick={() => setAssignedOpen((o) => !o)}
									className="w-full flex items-center justify-between gap-2 rounded-lg border border-gray-200 bg-neutral-surface px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent min-h-9.5"
								>
									<div className="flex flex-wrap gap-1 flex-1">
										{assignedIds.length === 0 ? (
											<span className="text-gray-400">Assign to...</span>
										) : (
											assignedIds.map((profileId) => {
												const profile = profiles.find((p) => p.profile_id === profileId)
												return (
													<span
														key={profileId}
														className="inline-flex items-center gap-1 rounded bg-indigo-50 text-indigo-700 px-1.5 py-0.5 text-xs font-medium"
													>
														{profile?.first_name + " " + profile?.last_name}
														<span
															className="cursor-pointer opacity-60 hover:opacity-100 text-sm leading-none"
															onClick={() => toggleAssigned(profileId)}
														>
															×
														</span>
													</span>
												)
											})
										)}
									</div>
									<ChevronDown />
								</button>

								{assignedOpen && (
									<div className="absolute z-10 mt-1 w-full bg-neutral-surface border border-gray-200 rounded-lg shadow-lg overflow-hidden max-h-48 overflow-y-auto">
										{profiles.map((profile) => (
											<div
												key={profile.profile_id}
												onClick={() => toggleAssigned(profile.profile_id)}
												className="flex items-center gap-2.5 px-3.5 py-2.5 text-sm cursor-pointer hover:bg-gray-50 text-gray-700"
											>
												<div
													className={`w-4 h-4 rounded flex items-center justify-center border transition-colors shrink-0 ${
														assignedIds.includes(profile.profile_id)
															? "bg-brand-600 border-brand-600"
															: "border-gray-300"
													}`}
												>
													{assignedIds.includes(profile.profile_id) && (
														<Check size={10} strokeWidth={2} className="text-neutral-surface" />
													)}
												</div>
												<div className="w-6 h-6 rounded-full bg-brand-500 flex items-center justify-center text-[10px] font-bold text-neutral-surface shrink-0">
													{(profile.first_name + " " + profile.last_name).split(" ").map((n) => n[0]).join("")}
												</div>
												{profile?.first_name + " " + profile?.last_name}
											</div>
										))}
									</div>
								)}
							</div>
						</div>

						{/* Watcher */}
						<div className="space-y-1.5" ref={watcherRef}>
							<Label>Watcher</Label>
							<div className="relative">
								<button
									type="button"
									onClick={() => setWatcherOpen((o) => !o)}
									className="w-full flex items-center justify-between gap-2 rounded-lg border border-gray-200 bg-neutral-surface px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent min-h-9.5"
								>
									<span className="text-gray-400">
										{watcherId
											? profiles.find((p) => p.profile_id === watcherId)?.first_name + " " + profiles.find((p) => p.profile_id === watcherId)?.last_name
											: "Add watchers..."}
									</span>
									<ChevronDown />
								</button>
								{watcherOpen && (
									<div className="absolute z-10 mt-1 w-full bg-neutral-surface border border-gray-200 rounded-lg shadow-lg overflow-hidden max-h-48 overflow-y-auto">
										<div
											onClick={() => { setWatcherId("") 
												setWatcherOpen(false) }}
											className="flex items-center gap-2.5 px-3.5 py-2.5 text-sm cursor-pointer hover:bg-gray-50 text-gray-700"
										>
											<span className="text-gray-400">None</span>
										</div>
										{profiles.map((profile) => (
											<div
												key={profile.profile_id}
												onClick={() => { setWatcherId(profile.profile_id) 
													setWatcherOpen(false) }}
												className="flex items-center gap-2.5 px-3.5 py-2.5 text-sm cursor-pointer hover:bg-gray-50 text-gray-700"
											>
												<div className="w-6 h-6 rounded-full bg-brand-500 flex items-center justify-center text-[10px] font-bold text-neutral-surface shrink-0">
													{(profile.first_name + " " + profile.last_name)
														.split(" ")
														.map((n) => n[0])
														.join("")}
												</div>
												{profile?.first_name + " " + profile?.last_name}
											</div>
										))}
									</div>
								)}
							</div>
						</div>
					</div>

					{/* Tags + Deadline row */}
					<div className="grid grid-cols-2 gap-4">
						{/* Tags */}
						<div className="space-y-1.5" ref={tagsRef}>
							<Label>Tags</Label>
							<div className="relative">
								<button
									type="button"
									onClick={() => setTagsOpen((o) => !o)}
									className="w-full flex items-center overflow-x-hidden justify-between gap-2 rounded-lg border border-gray-200 bg-neutral-surface px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent min-h-9.5"
								>
									<div className="flex flex-wrap gap-1 flex-1">
										{selectedTags.length === 0 ? (
											<span className="text-gray-400">Select tags...</span>
										) : (
											selectedTags.map((tag_id) => {
												const tag = tags.find((t) => t.tag_id === tag_id)
												return (
													<span
														key={tag_id}
														className={
															(colorClasses[tag?.color as keyof typeof colorClasses] ??
																colorClasses.indigo) +
															" inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-xs font-medium"
														}
													>
														{tag?.name}
														<span
															className="cursor-pointer opacity-60 hover:opacity-100 text-sm leading-none"
															onClick={() => toggleTag(tag_id)}
														>
															×
														</span>
													</span>
												)
											})
										)}
									</div>
									<ChevronDown />
								</button>

								{tagsOpen && (
									<div className="absolute z-10 mt-1 w-full bg-neutral-surface border border-gray-200 rounded-lg shadow-lg overflow-hidden max-h-48 overflow-y-auto">
										{tags.map((tag) => (
											<div
												key={tag.tag_id}
												onClick={() => toggleTag(tag.tag_id)}
												className="flex items-center gap-2.5 px-3.5 py-2.5 text-sm cursor-pointer hover:bg-gray-50 text-gray-700"
											>
												<div
													className={`w-4 h-4 rounded flex items-center justify-center border transition-colors shrink-0 ${
														selectedTags.includes(tag.tag_id)
															? "bg-brand-600 border-brand-600"
															: "border-gray-300"
													}`}
												>
													{selectedTags.includes(tag.tag_id) && (
														<Check size={10} strokeWidth={2} className="text-neutral-surface" />
													)}
												</div>
												{tag.name}
											</div>
										))}
									</div>
								)}
							</div>
						</div>

						{/* Deadline */}
						<div className="space-y-1.5">
							<Label>Deadline</Label>
							<Input
								type="datetime-local"
								value={deadline}
								onChange={(e) => setDeadline(e.target.value)}
								min={today}
								className="text-gray-500"
							/>
						</div>
					</div>

					{/* Image Attachment */}
					<div className="space-y-1.5">
						<Label>
							Attachment{" "}
							<span className="text-xs text-gray-400 font-normal">
								(jpg, png · Max 5MB)
							</span>
						</Label>
						<label className="flex items-center gap-2.5 w-full cursor-pointer rounded-lg border border-dashed border-gray-300 bg-gray-50 px-3.5 py-2.5 text-sm text-gray-500 hover:border-indigo-400 hover:bg-indigo-50/40 transition-colors">
							<Paperclip size={15} />
							<span>{imageFiles.length > 0 ? `${imageFiles.length} file(s) selected` : "Click to attach images..."}</span>
							<input
								type="file"
								accept="image/jpeg,image/png"
								onChange={handleImageChange}
								className="sr-only"
							/>
						</label>
						{imagePreviews.length > 0 && (
							<div className="flex flex-wrap gap-2 mt-1">
								{imagePreviews.map((preview, idx) => (
									<div key={idx} className="relative inline-block">
										<img
											src={preview}
											alt={`Preview ${idx + 1}`}
											className="h-20 w-auto rounded-lg border border-gray-200 object-cover"
										/>
										<button
											type="button"
											onClick={() => removeCreateImage(idx)}
											className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-gray-700 text-neutral-surface flex items-center justify-center text-[10px] leading-none hover:bg-red-600 transition-colors"
										>
											×
										</button>
									</div>
								))}
							</div>
						)}
					</div>

					{/* API Details — shown only when the "API" tag is applied */}
					{isApiTagSelected && (
						<div className="space-y-3 rounded-lg border border-indigo-100 bg-indigo-50/40 px-4 py-3.5">
							<p className="text-xs font-semibold text-brand-600 uppercase tracking-wide">
								API Details
							</p>
							<div className="grid grid-cols-[110px_1fr] gap-3 items-end">
								<div className="space-y-1.5">
									<Label>Method</Label>
									<select
										value={apiMethod}
										onChange={(e) =>
											setApiMethod(e.target.value as "GET" | "POST" | "PUT" | "DELETE")
										}
										className="w-full rounded-lg border border-gray-200 bg-neutral-surface px-2.5 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
									>
										{["GET", "POST", "PUT", "DELETE"].map((m) => (
											<option key={m}>{m}</option>
										))}
									</select>
								</div>
								<div className="space-y-1.5">
									<Label>API Route</Label>
									<Input
										placeholder="/api/v1/resource"
										value={apiRoute}
										onChange={(e) => setApiRoute(e.target.value)}
									/>
								</div>
							</div>
						</div>
					)}
				</form>

				{/* Footer */}
				<DialogFooter>
					<Button onClick={onClose} variant="ghost">
						Cancel
					</Button>
					<Button onClick={handleSubmit} disabled={!title.trim()}>
						Create Ticket
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	)
}
