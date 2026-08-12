"use client";

import { useState } from "react";
import { FormInput } from "@/components/ui/forminput";
import { Label } from "@/components/ui/label";
import { Tag } from "@/entities/types";

import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogDescription,
	DialogFooter,
} from "@/components/ui/dialog";
import {
	DropdownMenu,
	DropdownMenuTrigger,
	DropdownMenuContent,
	DropdownMenuSeparator,
	DropdownMenuCheckboxItem,
	DropdownMenuRadioGroup,
	DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { ChevronDown, Paperclip } from "lucide-react";
import { useProfiles } from "@/entities/profile/queries";
import { createClient } from "@/lib/supabase/client";
import type { CreateTicketParams } from "@/shared/schemas";

// Sample bugs list for linking issues to tickets
const SAMPLE_BUGS = [
	{ id: "iss-1", name: "Authentication Token Expiration Bug" },
	{ id: "iss-2", name: "Client Dropdown Not Populating" },
	{ id: "iss-5", name: "Broken Navigation Links in Footer" },
	{ id: "iss-6", name: "Database Timeout on Analytics Load" },
];

/** Fields the modal collects — everything except workflow_id and status (added by TicketBoard). */
type CreateTicketFormData = Omit<CreateTicketParams, "workflow_id" | "status">;

interface CreateTicketModalProps {
	isOpen: boolean;
	onClose: () => void;
	onCreateTicket: (data: CreateTicketFormData) => Promise<void>;
	tags: Tag[];
}

export default function TicketModalCreate({
	isOpen,
	onClose,
	onCreateTicket,
	tags,
}: CreateTicketModalProps) {
	const [title, setTitle] = useState("");
	const [description, setDescription] = useState("");
	const [startDate, setStartDate] = useState("");
	const [deadline, setDeadline] = useState("");

	const [selectedTags, setSelectedTags] = useState<string[]>([]);
	const [selectedBugId, setSelectedBugId] = useState("");

	const { data: profiles = [] } = useProfiles();

	const [assignedIds, setAssignedIds] = useState<string[]>([]);
	const [watcherId, setWatcherId] = useState("");

	const [imageFiles, setImageFiles] = useState<File[]>([]);
	const [imagePreviews, setImagePreviews] = useState<string[]>([]);

	const [apiMethod, setApiMethod] = useState<"GET" | "POST" | "PUT" | "DELETE">(
		"GET",
	);
	const [apiRoute, setApiRoute] = useState("");

	function toggleTag(tagId: string) {
		setSelectedTags((prev) =>
			prev.includes(tagId) ? prev.filter((t) => t !== tagId) : [...prev, tagId],
		);
	}

	function toggleAssigned(profileId: string) {
		setAssignedIds((prev) =>
			prev.includes(profileId)
				? prev.filter((id) => id !== profileId)
				: [...prev, profileId],
		);
	}

	const isApiTagSelected = selectedTags.some(
		(tagId) =>
			tags.find((t) => t.tag_id === tagId)?.name?.toLowerCase() === "api",
	);

	function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
		const files = e.target.files;
		if (!files || files.length === 0) return;
		const newFiles: File[] = [];
		const newPreviews: string[] = [];
		for (const file of Array.from(files)) {
			if (file.size > 5 * 1024 * 1024) {
				alert(`Image "${file.name}" must be under 5MB.`);
				continue;
			}
			newFiles.push(file);
			newPreviews.push(URL.createObjectURL(file));
		}
		if (newFiles.length > 0) {
			setImageFiles((prev) => [...prev, ...newFiles]);
			setImagePreviews((prev) => [...prev, ...newPreviews]);
		}
		e.target.value = "";
	}

	function removeCreateImage(index: number) {
		URL.revokeObjectURL(imagePreviews[index]);
		setImageFiles((prev) => prev.filter((_, i) => i !== index));
		setImagePreviews((prev) => prev.filter((_, i) => i !== index));
	}

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		if (!title.trim()) return;

		const imageUrls: string[] = [];

		if (imageFiles.length > 0) {
			try {
				const supabase = createClient();
				for (const file of imageFiles) {
					const fileExt = file.name.split(".").pop();
					const fileName = `${crypto.randomUUID()}.${fileExt}`;
					const filePath = `tickets/${fileName}`;

					const { error } = await supabase.storage
						.from("images")
						.upload(filePath, file, {
							cacheControl: "3600",
							upsert: false,
						});

					if (error)
						throw new Error(`Failed to upload image: ${error.message}`);

					const {
						data: { publicUrl },
					} = supabase.storage.from("images").getPublicUrl(filePath);

					imageUrls.push(publicUrl);
				}
			} catch (err) {
				console.error("Image upload failed:", err);
			}
		}

		onCreateTicket({
			name: title.trim(),
			plan_start_at: startDate ? new Date(startDate) : null,
			plan_end_at: deadline ? new Date(deadline) : new Date(),
			watcher_id: watcherId || null,
			TicketAssigned: assignedIds,
			tagIds: selectedTags,
			description: description.trim() || null,
			api_route: apiRoute || null,
			api_method: apiMethod || null,
			image_urls: imageUrls,
		});

		setTitle("");
		setDescription("");
		setStartDate("");
		setDeadline("");
		setWatcherId("");
		setSelectedBugId("");
		setSelectedTags([]);
		setAssignedIds([]);
		setImageFiles([]);
		setImagePreviews([]);
		setApiMethod("GET");
		setApiRoute("");
		onClose();
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
	};

	return (
		<Dialog
			open={isOpen}
			onOpenChange={(open) => {
				if (!open) onClose();
			}}
		>
			<DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
				{/* Modal header */}
				<DialogHeader>
					<DialogTitle>New Ticket</DialogTitle>
					<DialogDescription>
						Create a new ticket for the board.
					</DialogDescription>
				</DialogHeader>

				<div className="h-px bg-gray-100 shrink-0" />

				{/* Form */}
				<form
					onSubmit={handleSubmit}
					className="flex-1 overflow-y-auto px-1 space-y-5"
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
						<div className="space-y-1.5">
							<Label>Assigned To</Label>
							<DropdownMenu>
								<DropdownMenuTrigger className="w-full flex items-center justify-between gap-2 rounded-lg border border-gray-200 bg-neutral-surface px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent min-h-9.5 text-left cursor-pointer">
									<div className="flex flex-wrap gap-1 flex-1">
										{assignedIds.length === 0 ? (
											<span className="text-gray-400">Assign to...</span>
										) : (
											assignedIds.map((profileId) => {
												const profile = profiles.find(
													(p) => p.profile_id === profileId,
												);
												return (
													<span
														key={profileId}
														className="inline-flex items-center gap-1 rounded bg-indigo-50 text-indigo-700 px-1.5 py-0.5 text-xs font-medium"
													>
														{profile?.first_name + " " + profile?.last_name}
														<span
															className="cursor-pointer opacity-60 hover:opacity-100 text-sm leading-none"
															onClick={(e) => {
																e.stopPropagation();
																e.preventDefault();
																toggleAssigned(profileId);
															}}
														>
															×
														</span>
													</span>
												);
											})
										)}
									</div>
									<ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />
								</DropdownMenuTrigger>

								<DropdownMenuContent className="w-64 max-h-52 overflow-y-auto">
									<DropdownMenuSeparator />
									{profiles.map((profile) => {
										const isChecked = assignedIds.includes(profile.profile_id);
										const name = `${profile.first_name} ${profile.last_name}`;
										const initials = name
											.split(" ")
											.map((n) => n[0])
											.join("");
										return (
											<DropdownMenuCheckboxItem
												key={profile.profile_id}
												checked={isChecked}
												onCheckedChange={() => toggleAssigned(profile.profile_id)}
												className="cursor-pointer"
											>
												<span className="flex items-center gap-2">
													<span className="w-6 h-6 rounded-full bg-brand-500 flex items-center justify-center text-[10px] font-bold text-neutral-surface shrink-0">
														{initials}
													</span>
													<span className="truncate">{name}</span>
												</span>
											</DropdownMenuCheckboxItem>
										);
									})}
								</DropdownMenuContent>
							</DropdownMenu>
						</div>

						{/* Watcher */}
						<div className="space-y-1.5">
							<Label>Watcher</Label>
							<DropdownMenu>
								<DropdownMenuTrigger className="w-full flex items-center justify-between gap-2 rounded-lg border border-gray-200 bg-neutral-surface px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent min-h-9.5 text-left cursor-pointer">
									<span className="text-gray-400 truncate">
										{watcherId
											? (() => {
													const p = profiles.find(
														(x) => x.profile_id === watcherId,
													);
													return p
														? `${p.first_name} ${p.last_name}`
														: "Add watchers...";
											  })()
											: "Add watchers..."}
									</span>
									<ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />
								</DropdownMenuTrigger>

								<DropdownMenuContent className="w-64 max-h-52 overflow-y-auto">
									<DropdownMenuSeparator />
									<DropdownMenuRadioGroup
										value={watcherId}
										onValueChange={setWatcherId}
									>
										<DropdownMenuRadioItem
											value=""
											className="cursor-pointer text-gray-400"
										>
											None
										</DropdownMenuRadioItem>
										{profiles.map((profile) => {
											const name = `${profile.first_name} ${profile.last_name}`;
											const initials = name
												.split(" ")
												.map((n) => n[0])
												.join("");
											return (
												<DropdownMenuRadioItem
													key={profile.profile_id}
													value={profile.profile_id}
													className="cursor-pointer"
												>
													<span className="flex items-center gap-2">
														<span className="w-6 h-6 rounded-full bg-brand-500 flex items-center justify-center text-[10px] font-bold text-neutral-surface shrink-0">
															{initials}
														</span>
														<span className="truncate">{name}</span>
													</span>
												</DropdownMenuRadioItem>
											);
										})}
									</DropdownMenuRadioGroup>
								</DropdownMenuContent>
							</DropdownMenu>
						</div>
					</div>

					{/* Tags + Bugs Row */}
					<div className="grid grid-cols-2 gap-4">
						{/* Tags */}
						<div className="space-y-1.5">
							<Label>Tags</Label>
							<DropdownMenu>
								<DropdownMenuTrigger className="w-full flex items-center justify-between gap-2 rounded-lg border border-gray-200 bg-neutral-surface px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent min-h-9.5 text-left cursor-pointer">
									<div className="flex flex-wrap gap-1 flex-1">
										{selectedTags.length === 0 ? (
											<span className="text-gray-400">Select tags...</span>
										) : (
											selectedTags.map((tag_id) => {
												const tag = tags.find((t) => t.tag_id === tag_id);
												const colorClass =
													colorClasses[
														tag?.color as keyof typeof colorClasses
													] ?? colorClasses.indigo;
												return (
													<span
														key={tag_id}
														className={`${colorClass} inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-xs font-medium`}
													>
														{tag?.name}
														<span
															className="cursor-pointer opacity-60 hover:opacity-100 text-sm leading-none"
															onClick={(e) => {
																e.stopPropagation();
																e.preventDefault();
																toggleTag(tag_id);
															}}
														>
															×
														</span>
													</span>
												);
											})
										)}
									</div>
									<ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />
								</DropdownMenuTrigger>

								<DropdownMenuContent className="w-64 max-h-52 overflow-y-auto">
									<DropdownMenuSeparator />
									{tags.map((tag) => {
										const isChecked = selectedTags.includes(tag.tag_id);
										const colorClass =
											colorClasses[tag.color as keyof typeof colorClasses] ??
											colorClasses.indigo;
										return (
											<DropdownMenuCheckboxItem
												key={tag.tag_id}
												checked={isChecked}
												onCheckedChange={() => toggleTag(tag.tag_id)}
												className="cursor-pointer"
											>
												<span
													className={`inline-flex items-center rounded px-1.5 py-0.5 text-xs font-medium ${colorClass}`}
												>
													{tag.name}
												</span>
											</DropdownMenuCheckboxItem>
										);
									})}
								</DropdownMenuContent>
							</DropdownMenu>
						</div>

						{/* Bugs */}
						<div className="space-y-1.5">
							<Label>Bugs</Label>
							<DropdownMenu>
								<DropdownMenuTrigger className="w-full flex items-center justify-between gap-2 rounded-lg border border-gray-200 bg-neutral-surface px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent min-h-9.5 text-left cursor-pointer">
									<span className="text-gray-400 truncate">
										{selectedBugId
											? SAMPLE_BUGS.find((b) => b.id === selectedBugId)?.name
											: "Link a bug..."}
									</span>
									<ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />
								</DropdownMenuTrigger>

								<DropdownMenuContent className="w-64 max-h-52 overflow-y-auto">
									<DropdownMenuSeparator />
									<DropdownMenuRadioGroup
										value={selectedBugId}
										onValueChange={setSelectedBugId}
									>
										<DropdownMenuRadioItem
											value=""
											className="cursor-pointer text-gray-400"
										>
											None
										</DropdownMenuRadioItem>
										{SAMPLE_BUGS.map((bug) => (
											<DropdownMenuRadioItem
												key={bug.id}
												value={bug.id}
												className="cursor-pointer"
											>
												<span className="truncate">{bug.name}</span>
											</DropdownMenuRadioItem>
										))}
									</DropdownMenuRadioGroup>
								</DropdownMenuContent>
							</DropdownMenu>
						</div>
					</div>

					{/* Start Date + Deadline row */}
					<div className="grid grid-cols-2 gap-4">
						<FormInput
							variant="datetime-local"
							type="datetime-local"
							label="Planned Start"
							value={startDate}
							onChange={(e) => setStartDate(e.target.value)}
							containerClassName="flex-1"
						/>
						<FormInput
							variant="datetime-local"
							type="datetime-local"
							label="Deadline"
							value={deadline}
							onChange={(e) => setDeadline(e.target.value)}
							containerClassName="flex-1"
						/>
					</div>

					{/* Image Attachment */}
					<div className="space-y-2">
						<div className="flex items-center justify-between">
							<Label>Attachment</Label>
							<span className="text-xs text-gray-400 font-normal">
								(jpg, png · Max 5MB)
							</span>
						</div>
						<label className="flex items-center gap-3 w-full cursor-pointer rounded-lg border border-dashed border-gray-300 bg-neutral-surface px-4 py-3.5 text-sm text-gray-500 hover:border-indigo-400 hover:bg-indigo-50/40 transition-colors">
							<Paperclip size={16} className="shrink-0 text-gray-400" />
							<span>
								{imageFiles.length > 0
									? `${imageFiles.length} file(s) selected`
									: "Click to attach images..."}
							</span>
							<input
								type="file"
								accept="image/jpeg,image/png"
								onChange={handleImageChange}
								className="sr-only"
							/>
						</label>
						{imagePreviews.length > 0 && (
							<div className="flex flex-wrap gap-3 pt-1">
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
											setApiMethod(
												e.target.value as "GET" | "POST" | "PUT" | "DELETE",
											)
										}
										className="w-full rounded-lg border border-gray-200 bg-neutral-surface px-2.5 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
									>
										{["GET", "POST", "PUT", "DELETE"].map((m) => (
											<option key={m}>{m}</option>
										))}
									</select>
								</div>
								<FormInput
									label="API Route"
									placeholder="/api/v1/resource"
									value={apiRoute}
									onChange={(e) => setApiRoute(e.target.value)}
								/>
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
	);
}