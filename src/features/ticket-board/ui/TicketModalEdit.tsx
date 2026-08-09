"use client";

import { Ticket, Tag } from "@/entities/types";

import { useState, useRef, useEffect } from "react";
import { CommentParentType, status as status } from "@/lib/generated/prisma";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { SquarePen } from "lucide-react"

import { useAuth } from "@/features/auth";
import { useProfiles } from "@/entities/profile/queries";
import { useTicketComments, useTicketImages } from "@/entities/comment/queries";
import { useCreateComment } from "@/entities/comment/mutations";
import { useUpdateTicket } from "@/entities/ticket/mutations";
import { createClient } from "@/lib/supabase/client";
import { getInitials } from "@/shared/lib/strings";
import ImageLightbox from "@/shared/ui/ImageLightbox";
import TicketHistoryLog from "./TicketHistoryLog";
import { TagBadge } from "@/entities/tag/ui/TagBadge"
import { Calendar, X} from "lucide-react"


function statusLabel(status: status) {
	const map: Record<status, string> = {
		PENDING: "Pending",
		IN_PROGRESS: "In Progress",
		FINISHED: "Finished",
	};
	return map[status];
}

const STATUSES = [status.PENDING, status.IN_PROGRESS, status.FINISHED];

type EditingField =
	| "title"
	| "assignee"
	| "watcher"
	| "deadline"
	| "tags"
	| "description"
	| "status"
	| null;

export default function TicketModalEdit({
	ticket: initialTicket,
	isOpen,
	onClose,
	onUpdate,
	tags,
}: {
	ticket: Ticket | null;
	isOpen: boolean;
	onClose: () => void;
	onUpdate: (updated: Ticket) => void;
	tags: Tag[];
}) {
	const [ticket, setTicket] = useState<Ticket | null>(initialTicket);
	const [editing, setEditing] = useState<EditingField>(null);
	const [titleDraft, setTitleDraft] = useState("");
	const [descDraft, setDescDraft] = useState("");
	const [deadlineDraft, setDeadlineDraft] = useState("");
	const titleRef = useRef<HTMLTextAreaElement>(null);
	const descRef = useRef<HTMLTextAreaElement>(null);

	const [selectedTags, setSelectedTags] = useState<string[]>([]);

	const [showAssignDropdown, setShowAssignDropdown] = useState(false);
	const assignDropdownRef = useRef<HTMLDivElement>(null);
	const watcherRef = useRef<HTMLDivElement>(null);
 	const statusRef = useRef<HTMLDivElement>(null);

	/** API fields — new backend columns needed: api_method, api_route on Tickets table */
	const [apiMethod, setApiMethod] = useState<"GET" | "POST" | "PUT" | "DELETE">(
		"GET",
	);
	const [apiRoute, setApiRoute] = useState("");

	/** Comments */
	const [commentText, setCommentText] = useState("");
	const [commentImages, setCommentImages] = useState<File[]>([]);
	const [commentImagePreviews, setCommentImagePreviews] = useState<string[]>([]);
	const [commentError, setCommentError] = useState<string | null>(null);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const commentImageRef = useRef<HTMLInputElement>(null);
	const [activeTab, setActiveTab] = useState<"all" | "comments" | "history">("all");
	// ── TanStack Query ──────────────────────────────────────────────────────

	const { user } = useAuth();
	const { data: profiles = [] } = useProfiles();
	const { data: comments = [] } = useTicketComments(ticket?.ticket_id);
	const { data: ticketImages = [] } = useTicketImages(ticket?.ticket_id);
	const createCommentMutation = useCreateComment();
	const updateTicketMutation = useUpdateTicket();
	const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);

	// Click-outside listener
	useEffect(() => {
		const handler = (e: MouseEvent) => {
			const target = e.target as Node;
			if (
				assignDropdownRef.current &&
				!assignDropdownRef.current.contains(target)
			) {
				setShowAssignDropdown(false);
			}
			if (watcherRef.current && !watcherRef.current.contains(target)) {
				setEditing((prev) => (prev === "watcher" ? null : prev));
			}

			if (statusRef.current && !statusRef.current.contains(target)) {
				setEditing((prev) => (prev === "status" ? null : prev));
			}
		};

		document.addEventListener("mousedown", handler);
		return () => document.removeEventListener("mousedown", handler);
	}, []);

	// Sync ticket data when modal opens or ticket changes
	useEffect(() => {
		if (!isOpen) return;
		// eslint-disable-next-line react-hooks/set-state-in-effect
		setTicket(initialTicket);
		setEditing(null);
		setSelectedTags(
			initialTicket?.TicketTags?.map((t: { tag_id: string }) => t.tag_id) ?? [],
		);
	}, [isOpen, initialTicket]);

	// Clear comment draft when modal closes
	useEffect(() => {
		if (isOpen) return;
		setCommentText("");
		setCommentImages([]);
		setCommentImagePreviews([]);
		setCommentError(null);
	}, [isOpen]);

	// Focus inputs when entering editing modes
	useEffect(() => {
		if (editing === "title") {
			titleRef.current?.focus();
		} else if (editing === "description") {
			descRef.current?.focus();
		}
	}, [editing]);

	if (!ticket) return null;

	const availableProfiles = profiles.filter(
		(user) =>
			!ticket.TicketAssigned.some((a) => a.profile_id === user.profile_id),
	);

	function startEdit(field: EditingField) {
		setEditing(field);
		if (field === "title") setTitleDraft(ticket!.name);
		if (field === "description") setDescDraft(ticket!.description ?? "");
		if (field === "deadline")
			setDeadlineDraft(
				ticket!.plan_end_at
					? new Date(ticket!.plan_end_at).toISOString().slice(0, 16)
					: "",
			);
	}

	function commitTitle() {
		if (titleDraft.trim())
			setTicket((t) => (t ? { ...t, name: titleDraft.trim() } : t));
		setEditing(null);
	}

	function commitDesc() {
		setTicket((t) => (t ? { ...t, description: descDraft } : t));
		setEditing(null);
	}

	function commitDeadline() {
		setTicket((t) =>
			t
				? {
						...t,
						deadline_date: deadlineDraft ? new Date(deadlineDraft) : t.plan_end_at,
					}
				: t,
		);
		setEditing(null);
	}

	function setWatcher(userId: string) {
		setTicket((t) => (t ? { ...t, watcher_id: userId || null } : t));
	}

	function setStatus(val: status) {
		setTicket((t) => (t ? { ...t, status: val } : t));
		setEditing(null);
	}

	function toggleTag(tagId: string) {
		setSelectedTags((prev) =>
			prev.includes(tagId) ? prev.filter((t) => t !== tagId) : [...prev, tagId],
		);
	}

	async function handleSave() {
		if (!ticket) return;
		// Persist status updates to database through your server action
		const updated = await updateTicketMutation.mutateAsync({
			ticket_id: ticket.ticket_id,
			workflow_id: ticket.workflow_id,
			name: ticket.name,
			deadline_date: ticket.plan_end_at ?? undefined,
			status: ticket.status,
			watcher_id: ticket.watcher_id,
			TicketAssigned: ticket.TicketAssigned.map(
				(assignment) => assignment.profile_id,
			),
			tagIds: selectedTags,
			description: ticket.description,
			finish_date: ticket.actual_end_at,
			api_route: apiRoute || null,
			api_method: apiMethod || null,
			performed_by: user?.profile_id,
		});
		onUpdate(updated);
		onClose();
	}

	const watcher = profiles.find((u) => u.profile_id === ticket.watcher_id);
	const isOverdue =
		ticket.plan_end_at && new Date(ticket.plan_end_at) < new Date();
	const deadlineDisplay = ticket.plan_end_at
		? new Date(ticket.plan_end_at).toLocaleDateString()
		: null;

	const isApiTagSelected = selectedTags.some(
		(tagId) =>
			tags.find((t) => t.tag_id === tagId)?.name?.toLowerCase() === "api",
	);

	function handleCommentImageChange(e: React.ChangeEvent<HTMLInputElement>) {
		const files = e.target.files;
		if (!files) return;

		const validFiles: File[] = [];
		const validPreviews: string[] = [];

		// Iterate through all selected files
		Array.from(files).forEach((file) => {
			if (file.size > 5 * 1024 * 1024) {
				alert(`Image "${file.name}" must be under 5MB.`);
				return;
			}
			validFiles.push(file);
			validPreviews.push(URL.createObjectURL(file));
		});

		// Append new files to existing state
		if (validFiles.length > 0) {
			setCommentImages((prev) => [...prev, ...validFiles]);
			setCommentImagePreviews((prev) => [...prev, ...validPreviews]);
		}

		// Clear the input value so the same file can be re-selected if deleted
		e.target.value = "";
	}

	function removeImage(index: number) {
		// Revoke the Object URL to free up memory
		URL.revokeObjectURL(commentImagePreviews[index]);

		// Filter out the image at the specified index
		setCommentImages((prev) => prev.filter((_, i) => i !== index));
		setCommentImagePreviews((prev) => prev.filter((_, i) => i !== index));
	}

	async function handleAddComment() {
		// Require text — images alone aren't enough
		if (!commentText.trim()) {
			if (commentImages.length > 0) {
				setCommentError("Add some text to go with your image.");
			}
			return;
		}
		setCommentError(null);

		try {
			setIsSubmitting(true);

			// 1. Initialize Supabase out here so it's available for BOTH auth and storage loops
			const supabase = createClient();

			// 2. Fetch the user right away at the top level of the try block
			const {
				data: { user },
			} = await supabase.auth.getUser();

			// Safety check: ensure they didn't get logged out mid-session
			if (!user) {
				throw new Error("You must be logged in to post a comment.");
			}

			const imageUrls: string[] = [];

			// 3. Upload images to storage (now safely separated from the auth logic)
			if (commentImages.length > 0) {
				for (const file of commentImages) {
					const fileExt = file.name.split(".").pop();
					const fileName = `${crypto.randomUUID()}.${fileExt}`;
					const filePath = `comments/${fileName}`;

					const { error } = await supabase.storage
						.from("images")
						.upload(filePath, file, {
							cacheControl: "3600",
							upsert: false,
						});

					if (error) {
						throw new Error(`Failed to upload image ${file.name}: ${error.message}`);
					}

					const {
						data: { publicUrl },
					} = supabase.storage.from("images").getPublicUrl(filePath);

					imageUrls.push(publicUrl);
				}
			}

			await createCommentMutation.mutateAsync({
				profile_id: user.id,
				description: commentText,
				parent_type: CommentParentType.TICKET_COMMENT,
				parent_id: ticket?.ticket_id ?? "",
				imageUrls: imageUrls,
			});

			setCommentText("");
			setCommentImages([]);
			setCommentImagePreviews([]);
			setCommentError(null);
			if (commentImageRef.current) commentImageRef.current.value = "";
		} catch (error) {
			console.error("Error adding comment:", error);
		} finally {
			setIsSubmitting(false);
		}
	}

	return (
		<>
			<div
				className={`fixed inset-0 bg-foreground/30 z-40 transition-opacity duration-300 ${isOpen ? "opacity-100" : "opacity-0 pointer-events-none"}`}
				onClick={onClose}
			/>

			<div
				className={`fixed top-0 right-0 h-full w-[40rem] bg-neutral-surface shadow-2xl z-50 flex flex-col transition-transform duration-300 ease-in-out ${isOpen ? "translate-x-0" : "translate-x-full"}`}
			>
				{/* Header */}
				<div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-gray-100 shrink-0">
					<span className="text-xs font-semibold text-brand-600 shrink-0">
						{"TICKET " + "..."+ticket.ticket_id.slice(0, 16)}
					</span>
					<Button variant="ghost" size="icon-sm"
						onClick={onClose}
					>
						<X className="text-neutral-border hover:text-foreground transition-all duration-300 fade-in"/>
					</Button>
				</div>

				{/* Status bar */}
				<div className="flex flex-col text-2xl h-[7rem] gap-3 px-5 py-3.5 border-b border-gray-100 shrink-0 relative">
					<>{editing === "title" ? (
						<div className="flex-1 min-w-0 flex items-center gap-2">
							<div className="relative flex-1 min-w-0">
								<Textarea
									ref={titleRef}
									value={titleDraft}
									maxLength={50}
									rows={2}
									onChange={(e) => setTitleDraft(e.target.value)}
									onBlur={commitTitle}
									onKeyDown={(e) => {
									if (e.key === "Enter" && !e.shiftKey) {
										e.preventDefault();
										commitTitle();
									}
									if (e.key === "Escape") {
										setEditing(null);
									}
									}}
									className="flex-1 text-2xl min-w-0 font-bold text-gray-900 border border-brand-300 rounded-md px-1 py-0.5 pr-14 focus:outline-none focus:ring-2 focus:ring-brand-500 break-all resize-none leading-tight bg-transparent"
								/>
								<span className="absolute bottom-1 right-2 text-[10px] text-muted-foreground pointer-events-none">
									{titleDraft.length}/50
								</span>
							</div>
						</div>
					) : (
						<div
						className="hover:text-brand-500 transition-colors flex items-center gap-1.5 flex-1 min-w-0 overflow-hidden cursor-pointer"
						onClick={() => startEdit("title")}
						>
						<h2 className="font-bold break-all leading-tight line-clamp-2">
							{ticket.name}
						</h2>
						<SquarePen size={12} className="ml-6 shrink-0" />
						</div>
					)}</>

					<div className="relative inline-block">
						{/* Selected Tags + Add Button Row */}
						<div className="flex flex-wrap gap-1.5 items-center">
							{selectedTags.map((tag_id) => {
							const tag = tags.find((t) => t.tag_id === tag_id);
							return tag ? <TagBadge key={tag_id} hover={true} className="hover:!bg-neutral-border " tag={tag} onClick={() => toggleTag(tag.tag_id)}/> : null;
							})}
							<button
							type="button"
							onClick={() => setEditing(editing === "tags" ? null : "tags")}
							className="text-xs text-brand-600 hover:text-indigo-700 font-medium px-1.5 py-0.5 rounded border border-indigo-200 hover:bg-indigo-50 transition-colors"
							>
							+ Add
							</button>
						</div>

						{/* Floating Context Box Popover */}
						{editing === "tags" && (
							<>
							{/* Backdrop to close the context box when clicking outside */}
							<div
								className="fixed inset-0 z-10"
								onClick={() => setEditing(null)}
							/>

							{/* Popover Menu */}
							<div className="absolute left-0 top-full mt-1.5 z-20 w-64 p-3 bg-white border border-gray-200 rounded-xl shadow-lg flex flex-wrap gap-1.5 max-h-48 overflow-y-auto">
								<div className="w-full text-xs font-semibold text-gray-500 mb-1">
								Select Tags
								</div>
								{tags.map((tag) => {
								const active = selectedTags.includes(tag.tag_id);
								return (
									<button
									key={tag.tag_id}
									type="button"
									onClick={() => toggleTag(tag.tag_id)}
									style={{ color: tag?.color ?? "" }}
									className={`text-xs font-medium px-2.5 py-1 rounded-full border transition-all cursor-pointer ${
										active
										? "ring-1 ring-current bg-gray-50 font-semibold"
										: "opacity-60 hover:opacity-100"
									}`}
									>
									{active ? "✓ " : "+ "}
									{tag.name}
									</button>
								);
								})}
							</div>
							</>
						)}
						</div>
					</div>

				{/* Scrollable content */}
				<div className="flex-1 overflow-y-auto">
					<div className="px-5 py-4 grid grid-cols-2 gap-x-6 gap-y-4 border-b border-gray-100">
						{/* Assigned To */}
						<div>
							<Label className="text-xs text-neutral-border font-bold">ASSIGNED TO</Label>

							<div className="flex flex-wrap items-center gap-1.5">
								{/* Assigned Members Badges */}
								{ticket.TicketAssigned && ticket.TicketAssigned.length > 0 ? (
								ticket.TicketAssigned.map((a) => {
									const firstName = a.Profiles?.first_name ?? "Unknown";
									const lastName = a.Profiles?.last_name ?? "User";
									const fullName = `${firstName} ${lastName}`.trim();
									const initials = fullName
									.split(" ")
									.map((n: string) => n[0])
									.join("");

									return (
									<div
										key={a.profile_id}
										title={fullName}
										className="group relative inline-flex items-center justify-center w-7 h-7 rounded-full bg-brand-500 text-neutral-surface text-[10px] font-bold shrink-0 cursor-default select-none"
									>
										{/* Initials */}
										{initials}

										{/* Hover Remove Button Overlay */}
										<button
										type="button"
										onClick={() =>
											setTicket((t) =>
											t
												? {
													...t,
													TicketAssigned: t.TicketAssigned.filter(
													(x) => x.profile_id !== a.profile_id
													),
												}
												: t
											)
										}
										className="absolute inset-0 rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-xs font-bold cursor-pointer"
										title={`Remove ${fullName}`}
										>
										✕
										</button>
									</div>
									);
								})
								) : (
								<span className="text-sm text-gray-400">Unassigned</span>
								)}

								{/* Add Assignee Dropdown Button */}
								{availableProfiles.length > 0 && (
								<div className="relative" ref={assignDropdownRef}>
									<button
									type="button"
									onClick={() => setShowAssignDropdown((v) => !v)}
									className="flex items-center gap-1 text-xs text-brand-600 hover:bg-indigo-50 font-medium transition-colors border border-indigo-200 rounded-lg px-2 py-1"
									>
									+ Add
									</button>

									{showAssignDropdown && (
									<div className="absolute left-0 top-full mt-1.5 z-20 w-52 bg-neutral-surface border border-gray-200 rounded-xl shadow-lg py-1.5 max-h-48 overflow-y-auto">
										<div className="text-[11px] font-semibold text-gray-400 px-3 py-1 uppercase tracking-wider">
										Select Assignee
										</div>
										{availableProfiles.map((profile) => (
										<button
											key={profile.profile_id}
											type="button"
											onClick={() => {
											setTicket((t) =>
												t
												? {
													...t,
													TicketAssigned: [
														...t.TicketAssigned,
														{
														ticket_id: t.ticket_id,
														profile_id: profile.profile_id,
														assigned_date: new Date(),
														Profiles: profile,
														},
													],
													}
												: t
											);
											setShowAssignDropdown(false);
											}}
											className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-gray-50 transition-colors text-left cursor-pointer"
										>
											<div className="w-6 h-6 rounded-full bg-brand-500 text-neutral-surface flex items-center justify-center text-[10px] font-bold shrink-0">
											{`${profile.first_name} ${profile.last_name}`
												.split(" ")
												.map((n: string) => n[0])
												.join("")}
											</div>
											<span className="text-sm text-gray-700 font-medium truncate">
											{`${profile.first_name} ${profile.last_name}`}
											</span>
										</button>
										))}
									</div>
									)}
								</div>
								)}
							</div>
							</div>
						{/* Watcher */}
						<div className="relative">
							<Label className="text-xs text-neutral-border font-bold">WATCHER</Label>
							<div
								ref={watcherRef}
								className="cursor-pointer"
								onClick={() => setEditing(editing === "watcher" ? null : "watcher")}
							>
								{watcher ? (
									<div className="flex items-center gap-2">
										<div className="w-7 h-7 rounded-full bg-emerald-500 flex items-center justify-center text-[10px] font-bold text-neutral-surface">
											{`${watcher.first_name} ${watcher.last_name}`
												.split(" ")
												.map((n: string) => n[0])
												.join("")}
										</div>
										<span className="text-sm text-gray-700 font-medium">{`${watcher.first_name} ${watcher.last_name}`}</span>
									</div>
								) : (
									<span className="text-sm text-brand-500 font-medium">Unassigned</span>
								)}
							</div>
							{editing === "watcher" && (
								<div className="absolute z-50 mt-1 min-w-[160px] bg-neutral-surface border border-gray-200 rounded-lg shadow-lg py-1 max-h-48 overflow-y-auto">
									<div className="text-[11px] font-semibold text-gray-400 px-3 py-1 uppercase tracking-wider">
										Select Watcher
										</div><button
										onClick={() => {
											setWatcher("");
											setEditing(null);
										}}
										className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
									>
										None
									</button>
									{profiles.map((u) => (
										<button
											key={u.profile_id}
											onClick={() => {
												setWatcher(u.profile_id);
												setEditing(null);
											}}
											className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
										>
											<div className="w-6 h-6 rounded-full bg-brand-500 flex items-center justify-center text-[10px] font-bold text-neutral-surface shrink-0">
												{`${u.first_name} ${u.last_name}`.split(" ").map((n) => n[0]).join("")}
											</div>
											{`${u.first_name} ${u.last_name}`}
										</button>
									))}
								</div>
							)}
						</div>

					{/* Deadline */}
					<div>
						<Label className="text-xs text-neutral-border font-bold">DEADLINE</Label>
						
						{editing === "deadline" ? (
							<input
							type="datetime-local"
							autoFocus
							value={
								deadlineDraft ||
								(ticket.plan_end_at
								? new Date(ticket.plan_end_at).toISOString().slice(0, 16)
								: "")
							}
							onChange={(e) => setDeadlineDraft(e.target.value)}
							onBlur={() => {
								commitDeadline();
								setEditing(null);
							}}
							onKeyDown={(e) => {
								if (e.key === "Enter") {
								commitDeadline();
								setEditing(null);
								}
								if (e.key === "Escape") setEditing(null);
							}}
							className="h-[2rem] text-xs text-gray-900 border border-gray-200 rounded-md px-2 py-1 mb-1.5 w-full focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
							/>
						) : (
							<div
							onClick={() => setEditing("deadline")}
							className="h-[2rem] text-xs gap-2 py-1 mb-1.5 border border-transparent hover:border-gray-200 rounded-md cursor-pointer hover:bg-gray-50 transition-all flex items-center"
							>
							<Calendar size={12}/>
							{ticket.plan_end_at ? (
								new Date(ticket.plan_end_at).toLocaleDateString("en-US", {
								month: "long",
								day: "numeric",
								year: "numeric",
								// Uncomment lines below if you also want to show time:
								// hour: "numeric",
								// minute: "2-digit",
								})
							) : (
								<span className="text-neutral-border">No deadline set</span>
							)}
							</div>
						)}
					</div>
					
					<div className="relative" ref={statusRef}>
						<Label className="text-xs text-neutral-border font-bold">STATUS</Label>
						<div className="flex items-center">
							<div className="h-1 w-1 mr-2 bg-brand-600">
							</div>
							<button
								onClick={() => setEditing(editing === "status" ? null : "status")}
								className="flex items-center gap-2 text-brand-600 text-sm font-medium rounded-lg transition-colors"
							>
								{statusLabel(ticket.status)}
							</button>
						</div>
						{editing === "status" && (
							<div className="absolute z-50 mt-1 min-w-[160px] bg-neutral-surface border border-gray-200 rounded-lg shadow-lg py-1 max-h-48 overflow-y-auto">
								{STATUSES.map((s) => (
									<button
										key={s}
										onClick={() => setStatus(s)}
										className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
									>
										{statusLabel(s)}
									</button>
								))}
							</div>
						)}
					</div>

					{/* API Details — visible only when the "API" tag is applied */}
						{isApiTagSelected && (
							<div className="col-span-2 space-y-2">
						<Label className="text-xs text-neutral-border font-bold">API DETAILS</Label>
								{/* TODO: save apiMethod and apiRoute fields to ticket record on backend */}
								{apiMethod && apiRoute && (
									<div className="inline-flex items-center gap-1.5 bg-gray-900 rounded-md px-2.5 py-1.5">
										<span className="text-xs font-mono text-green-400 font-bold">
											{apiMethod}
										</span>
										<span className="text-xs font-mono text-indigo-300">{apiRoute}</span>
									</div>
								)}
								<div className="grid grid-cols-[110px_1fr] gap-3">
									<select
										value={apiMethod}
										onChange={(e) =>
											setApiMethod(e.target.value as "GET" | "POST" | "PUT" | "DELETE")
										}
										className="w-full mb-2 rounded-lg border border-gray-200 bg-neutral-surface px-2.5 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
									>
										{["GET", "POST", "PUT", "DELETE"].map((m) => (
											<option key={m}>{m}</option>
										))}
									</select>
									<Input
										placeholder="/api/v1/resource"
										value={apiRoute}
										onChange={(e) => setApiRoute(e.target.value)}
									/>
								</div>
							</div>
						)}

						{/* Start Date */}
					<div>
						<Label className="text-xs text-neutral-border font-bold">START DATE</Label>
						<p className="text-sm text-gray-700">
							{ticket.plan_start_at
								? new Date(ticket.plan_start_at).toLocaleString()
								: "—"}
						</p>
					</div>

					{/* Finish Date */}
					<div>
						<Label className="text-xs text-neutral-border font-bold">FINISH DATE</Label>
						<p className="text-sm text-gray-700">
							{ticket.actual_end_at
								? new Date(ticket.actual_end_at).toLocaleString()
								: "—"}
						</p>
					</div>

					</div>			
					{/* Description */}
					<div className="px-5 py-4 border-b border-gray-100">
						<div className="flex items-center justify-between mb-2">
							<h3 className="text-xl font-semibold">Description</h3>
							{editing !== "description" && (
								<button
									onClick={() => startEdit("description")}
									className="text-xs text-brand-600 font-medium hover:text-indigo-700"
								>
									Edit
								</button>
							)}
						</div>
						{editing === "description" ? (
							<div className="space-y-2">
								<textarea
									ref={descRef}
									value={descDraft}
									onChange={(e) => setDescDraft(e.target.value)}
									rows={5}
									className="w-full text-sm border border-indigo-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none break-words"
								/>
								<div className="flex gap-2">
									<button
										onClick={commitDesc}
										className="text-xs font-medium bg-brand-600 text-neutral-surface px-3 py-1.5 rounded-md hover:bg-indigo-700"
									>
										Save
									</button>
									<button
										onClick={() => setEditing(null)}
										className="text-xs font-medium text-gray-500 px-3 py-1.5 rounded-md hover:bg-gray-100"
									>
										Cancel
									</button>
								</div>
							</div>
						) : (
							<p
								className="text-sm text-neutral-border leading-relaxed neutral-surfacespace-pre-wrap break-words cursor-pointer hover:text-gray-800"
								onClick={() => startEdit("description")}
							>
								{ticket.description || (
									<span className="text-gray-400 italic">
										No description yet. Click to add one.
									</span>
								)}
							</p>
						)}
					</div>
					<div className=" px-5 mt-5">
						{/* Attachments */}
					{ticketImages.length > 0 && (
						<div >
							<p className="text-lg font-medium mb-1.5">Attachments</p>
							<div className="flex flex-wrap gap-2">
								{ticketImages.map((img) => (
									<img
										key={img.image_id}
										src={img.image_src}
										alt="Ticket attachment"
										className="h-16 w-auto rounded-lg border border-gray-200 object-cover cursor-pointer hover:opacity-80 transition-opacity"
										onClick={() => setLightboxSrc(img.image_src)}
									/>
								))}
							</div>
						</div>
					)}					
	</div>
	{/* Activity Header Navigation */}
	<div className="px-5 border-b border-gray-200 my-4">
	<span className="text-lg font-semibold">Activity</span>
	<div className="flex items-center gap-4">
		<div className="flex gap-3 text-xs">
		<button
			type="button"
			onClick={() => setActiveTab("all")}
			className={`relative py-2 font-medium transition-colors ${
			activeTab === "all"
				? "text-brand-600 font-semibold"
				: "text-gray-500 hover:text-gray-700"
			}`}
		>
			All
			{activeTab === "all" && (
			<span className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-600 rounded-full" />
			)}
		</button>

		<button
			type="button"
			onClick={() => setActiveTab("comments")}
			className={`relative py-2 font-medium transition-colors ${
			activeTab === "comments"
				? "text-brand-600 font-semibold"
				: "text-gray-500 hover:text-gray-700"
			}`}
		>
			Comments
			{activeTab === "comments" && (
			<span className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-600 rounded-full" />
			)}
		</button>

		<button
			type="button"
			onClick={() => setActiveTab("history")}
			className={`relative py-2 font-medium transition-colors ${
			activeTab === "history"
				? "text-brand-600 font-semibold"
				: "text-gray-500 hover:text-gray-700"
			}`}
		>
			History
			{activeTab === "history" && (
			<span className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-600 rounded-full" />
			)}
		</button>
		
		</div>
	</div>
	</div>			
	{(activeTab === "history" || activeTab === "all") && (
		<TicketHistoryLog ticketId={ticket.ticket_id} />
	)}

	{(activeTab === "comments" || activeTab === "all")&& (
		<div className="px-5 pb-5">
		{/* Posted comments */}
		{comments.length > 0 && (
			<div className="space-y-3 mb-4">
				{comments.map((comment) => (
					<div key={comment.comment_id} className="flex gap-2.5">
						<div className="w-7 h-7 rounded-full bg-brand-500 flex items-center justify-center text-[10px] font-bold text-neutral-surface shrink-0 mt-0.5">
							{getInitials(
								comment.Profiles.first_name + " " + comment.Profiles.last_name,
							)}
						</div>
						<div className="flex-1 min-w-0">
							<div className="bg-gray-50 rounded-lg px-3 py-2.5">
								{comment.images && comment.images.length > 0 && (
									<div className="flex flex-wrap gap-2 mb-2">
										{comment.images.map((img) => (
											<img
												key={img.image_id}
												src={img.image_src}
												alt="attachment"
												className="max-h-40 rounded-md object-contain cursor-pointer hover:opacity-80 transition-opacity"
													onClick={() => setLightboxSrc(img.image_src)}
											/>
										))}
									</div>
								)}
								{comment.description && (
									<p className="text-sm text-gray-700 leading-relaxed">
										{comment.description}
									</p>
								)}
							</div>
							<p className="text-xs text-gray-400 mt-1">
								{comment.creation_date.toLocaleTimeString([], {
									hour: "2-digit",
									minute: "2-digit",
								})}
							</p>
						</div>
					</div>
				))}
			</div>
		)}

		{/* Comment input */}
		<div className="border border-gray-200 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-brand-500 focus-within:border-transparent transition-shadow">
			{/* 1. NEW MULTIPLE PREVIEWS BLOCK GOES HERE (Right above the textarea) */}
			{commentImagePreviews.length > 0 && (
				<div className="px-3 pt-2.5 pb-0 flex flex-wrap gap-2">
					{commentImagePreviews.map((preview, idx) => (
						<div key={idx} className="relative inline-block">
							<img
								src={preview}
								alt={`Preview ${idx + 1}`}
								className="h-16 w-auto rounded-md border border-gray-200 object-cover"
							/>
							<button
								type="button"
								onClick={() => removeImage(idx)}
								className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-gray-700 text-neutral-surface flex items-center justify-center text-[10px] leading-none hover:bg-red-600 transition-colors"
							>
								×
							</button>
						</div>
					))}
				</div>
			)}

			<textarea
				value={commentText}
				onChange={(e) => { setCommentText(e.target.value); setCommentError(null); }}
				onKeyDown={(e) => {
					if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) handleAddComment();
				}}
				placeholder="Add a comment... (Ctrl+Enter to post)"
				rows={2}
				className="w-full px-3 py-2.5 text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none resize-none bg-transparent"
			/>
			<div className="flex items-center justify-between px-3 py-2 border-t border-gray-100 bg-gray-50/50">
				<label
					className="cursor-pointer text-gray-400 hover:text-brand-500 transition-colors"
					title="Attach images (jpg, png · Max 5MB)"
				>
					<svg
						width="16"
						height="16"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						strokeWidth={2}
						strokeLinecap="round"
						strokeLinejoin="round"
					>
						<path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
					</svg>

					{/* 2. THE MULTIPLE ATTRIBUTE GOES HERE */}
					<input
						ref={commentImageRef}
						type="file"
						accept="image/jpeg,image/png"
						multiple // <-- ADDED THIS
						onChange={handleCommentImageChange}
						className="sr-only"
					/>
					
				</label>
				<div className="flex items-center">
					{true && (
						<p className="px-3 pb-1 text-xs text-destructive">{commentError}</p>
					)}
					<button
						type="button"
						onClick={handleAddComment}
						disabled={
							(!commentText.trim() && commentImages.length === 0) || isSubmitting
						}
						className="text-xs font-semibold text-neutral-surface bg-brand-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed px-3 py-1.5 rounded-md transition-colors"
					>
						{isSubmitting ? "Posting..." : "Comment"}
					</button>
				</div>
			</div>
		</div>
	</div>
	)}	
		<div className="h-[4rem]"></div>

		{/* Footer save button */}
		<div className="fixed bottom-0 left-0 w-full flex items-center justify-end gap-3 px-5 py-3.5 border-t border-gray-100 shrink-0 bg-neutral-surface">
			<button
				onClick={onClose}
				className="text-sm font-medium text-gray-500 px-4 py-2 rounded-lg hover:bg-gray-100"
			>
				Cancel
			</button>
			<button
				onClick={handleSave}
				className="text-sm font-semibold text-neutral-surface bg-brand-600 hover:bg-indigo-700 px-4 py-2 rounded-lg transition-colors"
			>
				Save Changes
			</button>
		</div>
	</div>
	</div>
		{lightboxSrc && (
				<ImageLightbox src={lightboxSrc} onClose={() => setLightboxSrc(null)} />
			)}
		</>
	);
}
