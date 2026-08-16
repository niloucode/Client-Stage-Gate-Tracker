"use client";

import React, { useState } from "react";
import { ChevronDown, Paperclip, Bug } from "lucide-react";

import { createClient } from "@/lib/supabase/client";
import { Ticket, Tag } from "@/entities/types";
import { useProjectMembers } from "@/entities/profile";
import { TagBadge } from "@/entities/tag";
import { ticketCreateSchema, type CreateTicketParams } from "@/shared/schemas";
import { getFieldErrors } from "@/shared/lib/zod";

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
	DropdownMenu,
	DropdownMenuCheckboxItem,
	DropdownMenuContent,
	DropdownMenuRadioGroup,
	DropdownMenuRadioItem,
	DropdownMenuTrigger,
	FormInput,
	Label,
	toast,
} from "@/components/ui";

import { IssueTableModal } from "@/entities/issue";
import type { IssueItem } from "@/entities/issue";

import TicketEditor from "./editor/TicketEditor";

/* -------------------------------------------------------------------------- */
/* TYPES & HELPERS                                                            */
/* -------------------------------------------------------------------------- */

type CreateTicketFormData = Omit<CreateTicketParams, "workflow_id" | "status">;

export interface CreateTicketModalProps {
	isOpen: boolean;
	onClose: () => void;
	onCreateTicket: (data: CreateTicketFormData) => Promise<void>;
	tags: Tag[];
	/** Project scope for the assignee/watcher dropdowns. */
	projectId?: string;
}

export interface TicketModalEditProps {
	ticket: Ticket | null;
	isOpen: boolean;
	onClose: () => void;
	onUpdate: (updated: Ticket) => void;
	tags: Tag[];
	/** All tickets in the workflow for subtask lookup */
	allTickets?: Ticket[];
	/** When true, this modal is being used to view/edit a subtask */
	isSubtaskView?: boolean;
	/** Parent ticket info to display when in subtask view */
	parentTicket?: Ticket | null;
	/** Clients are read-only: the editor hides all edit affordances. */
	readOnly?: boolean;
	/** Project scope for the assignee/watcher dropdowns. */
	projectId?: string;
}

const createTicketModalSchema = ticketCreateSchema.superRefine((data, ctx) => {
	if (
		data.plan_start_at &&
		data.plan_end_at &&
		data.plan_start_at > data.plan_end_at
	) {
		ctx.addIssue({
			code: "custom",
			message: "Start must be before End",
			path: ["plan_start_at"],
		});
		ctx.addIssue({
			code: "custom",
			message: "End must be after Start",
			path: ["plan_end_at"],
		});
	}
});

/** Helper to derive box colors based strictly on issue urgency. 
 * @param issue - The linked issue, or null when unlinked.
 * @returns The style tokens for the linked-issue box.
 */
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

/* -------------------------------------------------------------------------- */
/* 1. TICKET CREATE MODAL (DIALOG)                                            */
/* -------------------------------------------------------------------------- */

/**
 * Create-ticket dialog (dialog shell; see TicketModals for the editor).
 * @returns The result.
 */
export function TicketModalCreate({
	isOpen,
	onClose,
	onCreateTicket,
	tags,
	projectId,
}: CreateTicketModalProps) {
	const [title, setTitle] = useState("");
	const [description, setDescription] = useState("");
	const [startDate, setStartDate] = useState<Date | undefined>(undefined);
	const [deadline, setDeadline] = useState<Date | undefined>(undefined);

	const [selectedTags, setSelectedTags] = useState<string[]>([]);
	const [linkedIssue, setLinkedIssue] = useState<IssueItem | null>(null);
	const [isIssueModalOpen, setIsIssueModalOpen] = useState(false);

	// Only project team members + owners (roleAssignments) are assignable.
	const { data: profiles = [] } = useProjectMembers(projectId);

	const [assignedIds, setAssignedIds] = useState<string[]>([]);
	const [watcherId, setWatcherId] = useState("");

	const [imageFiles, setImageFiles] = useState<File[]>([]);
	const [imagePreviews, setImagePreviews] = useState<string[]>([]);

	const [apiMethod, setApiMethod] = useState<"GET" | "POST" | "PUT" | "DELETE">(
		"GET",
	);
	const [apiRoute, setApiRoute] = useState("");
	const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
	const [isSubmitting, setIsSubmitting] = useState(false);

	// Confirmation modal state when user attempts to close with unsaved changes
	const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);

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
				toast.add({
					title: "File Too Large",
					description: `"${file.name}" must be under 5MB.`,
					type: "error",
				});
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

	// Check if user has entered any form data
	const hasUnsavedChanges = Boolean(
		title.trim() ||
		description.trim() ||
		startDate ||
		deadline ||
		selectedTags.length > 0 ||
		assignedIds.length > 0 ||
		watcherId ||
		linkedIssue ||
		imageFiles.length > 0 ||
		apiRoute.trim(),
	);

	const resetForm = () => {
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
		setFieldErrors({});
	};

	// Prevents exiting if unsaved changes exist
	const handleAttemptClose = () => {
		if (hasUnsavedChanges && !isSubmitting) {
			setShowDiscardConfirm(true);
			return; // <--- BLOCKS EXITING
		}
		resetForm();
		onClose();
	};

	const handleConfirmDiscard = () => {
		setShowDiscardConfirm(false);
		resetForm();
		onClose();
	};

	async function handleSubmit(e: React.SyntheticEvent) {
		e.preventDefault();

		const rawPayload = {
			name: title.trim(),
			description: description.trim() || null,
			watcher_id: watcherId || null,
			tagIds: selectedTags,
			plan_start_at: startDate ?? null,
			plan_end_at: deadline ?? null,
			api_route: isApiTagSelected ? apiRoute.trim() || null : null,
			api_method: isApiTagSelected ? apiMethod : null,
			// 1-to-1 issue link (spec): persisted via createTicket.
			issue_id: linkedIssue?.id ?? null,
		};

		// Validate with Zod schema
		const validation = createTicketModalSchema.safeParse(rawPayload);
		if (!validation.success) {
			const errors = getFieldErrors(validation);
			setFieldErrors(errors);
			return;
		}

		setFieldErrors({});
		setIsSubmitting(true);

		// Loading Toast
		toast.add({
			title: "Creating Ticket",
			description: "Please wait while your ticket is being created...",
			type: "loading",
		});

		const imageUrls: string[] = [];
		const uploadedPaths: string[] = [];
		let uploadError: string | null = null;

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

					if (error) {
						uploadError = `Failed to upload image: ${error.message}`;
						break;
					}

					const {
						data: { publicUrl },
					} = supabase.storage.from("images").getPublicUrl(filePath);

					uploadedPaths.push(filePath);
					imageUrls.push(publicUrl);
				}
			} catch (err) {
				console.error("Image upload failed:", err);
				uploadError =
					err instanceof Error ? err.message : "Failed to upload images.";
			}

			if (uploadError) {
				// All-or-nothing: remove already-uploaded files and abort the
				// ticket creation so no ticket is created without its images.
				if (uploadedPaths.length > 0) {
					const supabase = createClient();
					await supabase.storage.from("images").remove(uploadedPaths);
				}
				toast.add({
					title: "Upload Failed",
					description:
						"Your images could not be uploaded. The ticket was not created.",
					type: "error",
				});
				setIsSubmitting(false);
				return;
			}
		}

		try {
			await onCreateTicket({
				name: validation.data.name,
				plan_start_at: validation.data.plan_start_at ?? null,
				plan_end_at: validation.data.plan_end_at,
				watcher_id: validation.data.watcher_id ?? null,
				TicketAssigned: assignedIds,
				tagIds: validation.data.tagIds ?? [],
				description: validation.data.description ?? null,
				api_route: validation.data.api_route ?? null,
				api_method: validation.data.api_method ?? null,
				image_urls: imageUrls,
				issue_id: validation.data.issue_id ?? null,
			});

			// Success Toast
			toast.add({
				title: "Ticket Created",
				description: `"${validation.data.name}" has been created successfully.`,
				type: "success",
			});

			resetForm();
			onClose();
		} catch (error) {
			console.error("Ticket creation failed:", error);
			toast.add({
				title: "Creation Failed",
				description:
					error instanceof Error
						? error.message
						: "Unable to create ticket. Please try again.",
				type: "error",
			});
		} finally {
			setIsSubmitting(false);
		}
	}

	const clearDateError = () => {
		if (fieldErrors.plan_start_at || fieldErrors.plan_end_at) {
			setFieldErrors((prev) => ({
				...prev,
				plan_start_at: "",
				plan_end_at: "",
			}));
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
							error={fieldErrors.name}
							onChange={(e) => {
								setTitle(e.target.value);
								if (fieldErrors.name)
									setFieldErrors((prev) => ({ ...prev, name: "" }));
							}}
							maxLength={50}
						/>

						{/* Description */}
						<FormInput
							variant="textarea"
							label="Description"
							placeholder="Provide detailed information about this ticket..."
							value={description}
							error={fieldErrors.description}
							onChange={(e) => {
								setDescription(e.target.value);
								if (fieldErrors.description)
									setFieldErrors((prev) => ({ ...prev, description: "" }));
							}}
							rows={4}
							maxLength={360}
						/>

						{/* Assigned to + Watchers row */}
						<div className="grid grid-cols-2 gap-4">
							{/* Assigned To */}
							<div>
								<Label>Assigned To</Label>
								<DropdownMenu>
									<DropdownMenuTrigger className="w-full flex items-center justify-between gap-2 rounded-md border border-gray-200 bg-neutral-surface px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent min-h-9.5 text-left cursor-pointer">
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
											const isChecked = assignedIds.includes(
												profile.profile_id,
											);
											const name = `${profile.first_name} ${profile.last_name}`;
											const initials = name
												.split(" ")
												.map((n) => n[0])
												.join("");
											return (
												<DropdownMenuCheckboxItem
													key={profile.profile_id}
													checked={isChecked}
													onCheckedChange={() =>
														toggleAssigned(profile.profile_id)
													}
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
									<DropdownMenuTrigger className="w-full flex items-center justify-between gap-2 rounded-md border border-gray-200 bg-neutral-surface px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent min-h-9.5 text-left cursor-pointer">
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
								<DropdownMenuTrigger className="w-full flex items-center justify-between gap-2 rounded-md border border-gray-200 bg-neutral-surface px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent min-h-9.5 text-left cursor-pointer">
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
														onClick={() => toggleTag(tag_id)}
													/>
												) : null;
											})
										)}
									</div>
									<ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />
								</DropdownMenuTrigger>

								<DropdownMenuContent className="w-(--anchor-width) max-h-52 overflow-y-auto">
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
						<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
							<DateTimePicker
								label="Planned Start"
								value={startDate}
								onChange={(d) => {
									setStartDate(d);
									clearDateError();
								}}
								placeholder="Pick Planned Start"
								error={fieldErrors.plan_start_at}
							/>
							<DateTimePicker
								label="Plan End"
								required
								value={deadline}
								onChange={(d) => {
									setDeadline(d);
									clearDateError();
								}}
								placeholder="Pick Planned End"
								error={fieldErrors.plan_end_at}
							/>
						</div>

						{/* Linked Issue Box */}
						<div>
							<Label>Linked Issue</Label>
							{(() => {
								const style = getIssueUrgencyStyle(linkedIssue);
								return (
									<div
										onClick={() => setIsIssueModalOpen(true)}
										className={`h-9 w-full rounded-md border px-2.5 py-1 text-xs flex items-center justify-between select-none cursor-pointer transition-colors ${style.box}`}
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
							<label className="flex items-center gap-3 w-full cursor-pointer rounded-md border border-dashed border-gray-300 bg-neutral-surface px-4 py-3.5 text-sm text-gray-500 hover:border-indigo-400 hover:bg-indigo-50/40 transition-colors">
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
											{/* blob: previews are not supported by next/image — plain img is intentional */}
											{/* eslint-disable-next-line @next/next/no-img-element */}
											<img
												src={preview}
												alt={`Preview ${idx + 1}`}
												className="h-20 w-auto rounded-md border border-gray-200 object-cover"
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
							<div className="space-y-3 rounded-md border border-indigo-100 bg-indigo-50/40 px-4 py-3.5">
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
											className="w-full rounded-md border border-gray-200 bg-neutral-surface px-2.5 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
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
										error={fieldErrors.api_route}
										onChange={(e) => {
											setApiRoute(e.target.value);
											if (fieldErrors.api_route)
												setFieldErrors((prev) => ({ ...prev, api_route: "" }));
										}}
									/>
								</div>
							</div>
						)}
					</form>

					<DialogFooter>
						<Button
							onClick={handleAttemptClose}
							variant="ghost"
							disabled={isSubmitting}
						>
							Cancel
						</Button>
						<Button onClick={handleSubmit} disabled={isSubmitting}>
							{isSubmitting ? "Creating..." : "Create Ticket"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			<IssueTableModal
				open={isIssueModalOpen}
				onOpenChange={setIsIssueModalOpen}
				projectId={projectId}
				onSelectIssue={(issue) => setLinkedIssue(issue)}
			/>

			{/* Discard Unsaved Changes Confirmation Modal */}
			<ConfirmationModal
				isOpen={showDiscardConfirm}
				title="Discard Unsaved Ticket?"
				description="You have unsaved information in this ticket. Are you sure you want to discard your changes?"
				cancelLabel="Keep Editing"
				confirmLabel="Discard Changes"
				variant="destructive"
				onConfirm={handleConfirmDiscard}
				onCancel={() => setShowDiscardConfirm(false)}
			/>
		</>
	);
}

/* -------------------------------------------------------------------------- */
/* 2. TICKET EDIT MODAL (SLIDING PANEL DRAWER)                                */
/* -------------------------------------------------------------------------- */

/**
 * Edit-ticket sliding panel; renders the TicketEditor.
 * @returns The result.
 */
export function TicketModalEdit({
	ticket,
	isOpen,
	onClose,
	onUpdate,
	...rest
}: TicketModalEditProps) {
	// Sync props to state during render (React pattern for adjusting state based on props)
	const [prevTicket, setPrevTicket] = useState(ticket);
	const [activeTicket, setActiveTicket] = useState<Ticket | null>(ticket);

	if (ticket && prevTicket !== ticket) {
		setPrevTicket(ticket);
		setActiveTicket(ticket);
	}

	const showModal = Boolean(isOpen && ticket);

	const handleTicketUpdate = (updated: Ticket) => {
		onUpdate(updated);
		toast.add({
			title: "Ticket Saved",
			description: `"${updated.name}" has been updated successfully.`,
			type: "success",
		});
	};

	return (
		<>
			{/* Backdrop */}
			<div
				className={`fixed inset-0 bg-foreground/30 z-40 transition-opacity duration-300 ${
					showModal ? "opacity-100" : "opacity-0 pointer-events-none"
				}`}
				onClick={onClose}
			/>

			{/* Sliding Panel */}
			<div
				className={`fixed top-0 right-0 h-full w-160 max-w-full bg-neutral-surface shadow-2xl z-50 flex flex-col transition-transform duration-300 ease-in-out ${
					showModal ? "translate-x-0" : "translate-x-full"
				}`}
			>
				{activeTicket && (
					<TicketEditor
						key={activeTicket.ticket_id}
						initialTicket={activeTicket}
						onCloseAction={onClose}
						onUpdateAction={handleTicketUpdate}
						{...rest}
					/>
				)}
			</div>
		</>
	);
}

/* -------------------------------------------------------------------------- */
/* 3. UNIFIED TICKET MODAL (DEFAULT EXPORT)                                   */
/* -------------------------------------------------------------------------- */

export type TicketModalProps =
	| ({ mode: "create" } & CreateTicketModalProps)
	| ({ mode: "edit" } & TicketModalEditProps);

/**
 * Dispatches to the create dialog or the edit drawer by mode.
 * @param props
 * @returns The rendered component.
 */
export default function TicketModal(props: TicketModalProps) {
	if (props.mode === "create") {
		return <TicketModalCreate {...props} />;
	}
	return <TicketModalEdit {...props} />;
}
