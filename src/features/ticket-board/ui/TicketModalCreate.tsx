"use client";

import React, { useState } from "react";
import { FormInput } from "@/components/ui/forminput";
import { Label } from "@/components/ui/label";
import { Tag } from "@/entities/types";
import { TagBadge } from "@/entities/tag/ui/TagBadge";
import { DateTimePicker } from "@/components/ui/datetime-picker";
import IssueTableModal from "@/features/issue-reporting/ui/IssueTableModal";
import type { IssueItem } from "@/features/issue-reporting/ui/IssueDashboard";

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
	DropdownMenuCheckboxItem,
	DropdownMenuRadioGroup,
	DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { ChevronDown, Paperclip, Bug } from "lucide-react";
import { useProfiles } from "@/entities/profile/queries";
import { createClient } from "@/lib/supabase/client";
import type { CreateTicketParams } from "@/shared/schemas";

/** Helper to derive box colors based strictly on issue urgency */
function getIssueUrgencyStyle(issue: IssueItem | null) {
	if (!issue) {
		return {
			box: "border-dashed border-gray-300 bg-gray-50/50 hover:bg-gray-100/60 text-gray-400",
			icon: "text-gray-400",
			text: "font-normal italic text-gray-400",
			close: "",
		};
	}

	switch (issue.urgency) {
		case "high":
			return {
				box: "border-red-200 bg-red-50/70 hover:bg-red-100/80 text-gray-700",
				icon: "text-red-500",
				text: "font-semibold text-red-600",
				close: "text-red-400 hover:text-red-600",
			};
		case "medium":
			return {
				box: "border-amber-200 bg-amber-50/70 hover:bg-amber-100/80 text-gray-700",
				icon: "text-amber-500",
				text: "font-semibold text-amber-600",
				close: "text-amber-400 hover:text-amber-600",
			};
		case "low":
		default:
			return {
				box: "border-green-200 bg-green-50/70 hover:bg-green-100/80 text-gray-700",
				icon: "text-green-500",
				text: "font-semibold text-green-600",
				close: "text-green-400 hover:text-green-600",
			};
	}
}

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
	const [startDate, setStartDate] = useState<Date | undefined>(undefined);
	const [deadline, setDeadline] = useState<Date | undefined>(undefined);

	const [selectedTags, setSelectedTags] = useState<string[]>([]);
	const [linkedIssue, setLinkedIssue] = useState<IssueItem | null>(null);
	const [isIssueModalOpen, setIsIssueModalOpen] = useState(false);

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
			plan_start_at: startDate ?? null,
			plan_end_at: deadline ?? new Date(),
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
		setStartDate(undefined);
		setDeadline(undefined);
		setWatcherId("");
		setLinkedIssue(null);
		setSelectedTags([]);
		setAssignedIds([]);
		setImageFiles([]);
		setImagePreviews([]);
		setApiMethod("GET");
		setApiRoute("");
		onClose();
	}

	return (
		<>
		<Dialog
			open={isOpen}
			onOpenChange={(open) => {
				if (!open) onClose();
			}}
		>
			<DialogContent className="sm:max-w-2xl max-h-[70vh] flex flex-col overflow-hidden">
				{/* Modal header */}
				<DialogHeader>
					<DialogTitle>New Ticket</DialogTitle>
					<DialogDescription>
						Create a new ticket for the board.
					</DialogDescription>
				</DialogHeader>


				{/* Form */}
				<form
					onSubmit={handleSubmit}
					className="flex-1 overflow-y-auto px-2 space-y-5"
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
						<div>
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
						<div>
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

					{/* Tags */}
					<div>
						<Label>Tags</Label>
						<DropdownMenu>
							<DropdownMenuTrigger className="w-full flex items-center justify-between gap-2 rounded-lg border border-gray-200 bg-neutral-surface px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent min-h-9.5 text-left cursor-pointer">
								<div className="flex flex-wrap gap-1 flex-1">
									{selectedTags.length === 0 ? (
										<span className="text-gray-400">Select tags...</span>
									) : (
										selectedTags.map((tag_id) => {
											const tag = tags.find((t) => t.tag_id === tag_id);
											return tag ? (
												<TagBadge
													key={tag_id}
													tag={tag}
													onClick={() => {
														toggleTag(tag_id);
													}}
												/>
											) : null;
										})
									)}
								</div>
								<ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />
							</DropdownMenuTrigger>

							<DropdownMenuContent className="w-[var(--anchor-width)] max-h-52 overflow-y-auto">
								{tags.map((tag) => {
									const isChecked = selectedTags.includes(tag.tag_id);
									return (
										<DropdownMenuCheckboxItem
											key={tag.tag_id}
											checked={isChecked}
											onCheckedChange={() => toggleTag(tag.tag_id)}
											className="cursor-pointer"
										>
											<TagBadge tag={tag} />
										</DropdownMenuCheckboxItem>
									);
								})}
							</DropdownMenuContent>
						</DropdownMenu>
					</div>

					{/* Start Date + Deadline row */}
					<div className="grid grid-cols-2 gap-4">
						<div className="space-y-1.5">
							<Label>
								Planned Start
							</Label>
							<DateTimePicker
								value={startDate}
								onChange={setStartDate}
								placeholder="Pick planned start date"
							/>
						</div>
						<div className="space-y-1.5">
							<Label>
								Deadline
							</Label>
							<DateTimePicker
								value={deadline}
								onChange={setDeadline}
								placeholder="Pick deadline"
							/>
						</div>
					</div>

					{/* Linked Issue Box */}
					<div>
						<Label >Linked Issue</Label>
						{(() => {
							const style = getIssueUrgencyStyle(linkedIssue);
							return (
								<div
									onClick={() => setIsIssueModalOpen(true)}
									className={`h-9 w-full rounded-lg border px-2.5 py-1 text-xs flex items-center justify-between select-none cursor-pointer transition-colors ${style.box}`}
								>
									<div className="flex items-center gap-2 min-w-0 flex-1 pr-1">
										<Bug size={14} className={`shrink-0 ${style.icon}`} />
										<span className={`truncate ${style.text}`}>
											{linkedIssue ? linkedIssue.name : "Link an issue..."}
										</span>
									</div>

									{linkedIssue && (
										<button
											type="button"
											onClick={(e) => {
												e.stopPropagation();
												setLinkedIssue(null);
											}}
											className={`text-xs font-bold px-1 shrink-0 ${style.close}`}
											title="Unlink Issue"
										>
											✕
										</button>
									)}
								</div>
							);
						})()}
					</div>

					{/* Image Attachment */}
					<div>
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
		
		{/* Issue Table Modal */}
		<IssueTableModal
			open={isIssueModalOpen}
			onOpenChange={setIsIssueModalOpen}
			onSelectIssue={(issue) => setLinkedIssue(issue)}
		/>
		</>
	);
}