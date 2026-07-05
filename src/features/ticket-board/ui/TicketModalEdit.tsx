"use client";

import { Ticket, Tag } from "@/entities/types";

import { useState, useRef, useEffect } from "react";
import { CommentParentType, status as status } from "@/lib/generated/prisma";
import { Input } from "@/shared/ui/input";

import { useProfiles } from "@/entities/profile/queries";
import { useTicketComments, useTicketImages } from "@/entities/comment/queries";
import { useCreateComment } from "@/entities/comment/mutations";
import { useUpdateTicket } from "@/entities/ticket/mutations";
import { createClient } from "@/lib/supabase/client";
import { getInitials } from "@/shared/lib/strings";
import ImageLightbox from "@/shared/ui/ImageLightbox";
import TicketHistoryLog from "./TicketHistoryLog";


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
	const titleRef = useRef<HTMLInputElement>(null);
	const descRef = useRef<HTMLTextAreaElement>(null);

	const [selectedTags, setSelectedTags] = useState<string[]>([]);

	const [showAssignDropdown, setShowAssignDropdown] = useState(false);
	const assignDropdownRef = useRef<HTMLDivElement>(null);

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

	// ── TanStack Query ──────────────────────────────────────────────────────

	const { data: profiles = [] } = useProfiles();
	const { data: comments = [] } = useTicketComments(ticket?.ticket_id);
	const { data: ticketImages = [] } = useTicketImages(ticket?.ticket_id);
	const createCommentMutation = useCreateComment();
	const updateTicketMutation = useUpdateTicket();
	const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);

	// Click-outside listener
	useEffect(() => {
		const handler = (e: MouseEvent) => {
			if (
				assignDropdownRef.current &&
				!assignDropdownRef.current.contains(e.target as Node)
			) {
				setShowAssignDropdown(false);
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
				ticket!.deadline_date
					? new Date(ticket!.deadline_date).toISOString().slice(0, 16)
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
						deadline_date: deadlineDraft ? new Date(deadlineDraft) : t.deadline_date,
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
			deadline_date: ticket.deadline_date,
			status: ticket.status, // Renamed locally to avoid conflict with the 'status' type name
			watcher_id: ticket.watcher_id,
			TicketAssigned: ticket.TicketAssigned.map(
				(assignment) => assignment.profile_id,
			),
			tagIds: selectedTags, // Clean string array from frontend tag selector
			description: ticket.description,
			end_date: ticket.end_date,
			api_route: apiRoute || null,
			api_method: apiMethod || null,
		});
		onUpdate(updated as unknown as Ticket);
		onClose();
	}

	const watcher = profiles.find((u) => u.profile_id === ticket.watcher_id);
	const isOverdue =
		ticket.deadline_date && new Date(ticket.deadline_date) < new Date();
	const deadlineDisplay = ticket.deadline_date
		? new Date(ticket.deadline_date).toLocaleDateString()
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
				className={`fixed inset-0 bg-black/30 z-40 transition-opacity duration-300 ${isOpen ? "opacity-100" : "opacity-0 pointer-events-none"}`}
				onClick={onClose}
			/>

			<div
				className={`fixed top-0 right-0 h-full w-[520px] bg-white shadow-2xl z-50 flex flex-col transition-transform duration-300 ease-in-out ${isOpen ? "translate-x-0" : "translate-x-full"}`}
			>
				{/* Header */}
				<div className="flex items-start gap-3 px-5 py-4 border-b border-gray-100 shrink-0">
					<span className="text-xs font-semibold text-indigo-600 shrink-0">
						{ticket.ticket_id.slice(0, 8)}
					</span>
					{editing === "title" ? (
					<>
						<input
							ref={titleRef}
							value={titleDraft}
							maxLength={50}
							onChange={(e) => setTitleDraft(e.target.value)}
							onBlur={commitTitle}
							onKeyDown={(e) => {
								if (e.key === "Enter") {
									commitTitle();
								}
								if (e.key === "Escape") {
									setEditing(null);
								}
							}}
							className="flex-1 min-w-0 text-sm font-semibold text-gray-900 border border-indigo-300 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-500 break-all"
						/>
					<p className="text-xs text-gray-400 text-right mt-0.5">{titleDraft.length}/50</p>
					</>
					) : (
					<div className="flex items-start gap-1.5 flex-1 min-w-0 overflow-hidden cursor-pointer" onClick={() => startEdit("title")}>
						<h2 className="text-sm font-semibold text-gray-900 break-all hover:text-indigo-700 transition-colors">
							{ticket.name}
						</h2>
						<svg className="w-3 h-3 text-gray-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
							<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
							<path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
						</svg>
					</div>
					)}
					<button
						onClick={onClose}
						className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded"
					>
						✕
					</button>
				</div>

				{/* Status bar */}
				<div className="flex items-center gap-3 px-5 py-3.5 border-b border-gray-100 shrink-0 relative">
					<div className="relative">
						<button
							onClick={() => setEditing(editing === "status" ? null : "status")}
							className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-3.5 py-2 rounded-lg transition-colors"
						>
							{statusLabel(ticket.status)}
							<span>▾</span>
						</button>
						{editing === "status" && (
							<div className="absolute z-50 mt-1 min-w-[160px] bg-white border border-gray-200 rounded-lg shadow-lg py-1 max-h-48 overflow-y-auto">
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
				</div>

				{/* Scrollable content */}
				<div className="flex-1 overflow-y-auto">
					<div className="px-5 py-4 grid grid-cols-2 gap-x-6 gap-y-4 border-b border-gray-100">
						{/* Assigned To */}
						<div>
							<p className="text-xs text-gray-400 font-medium mb-1.5">Assigned To</p>
							{ticket.TicketAssigned && ticket.TicketAssigned.length > 0 ? (
								<div className="flex flex-col gap-1.5">
									{ticket.TicketAssigned.map((a) => (
										<div key={a.profile_id} className="flex items-center gap-2 group">
											<div className="w-7 h-7 rounded-full bg-indigo-500 flex items-center justify-center text-[10px] font-bold text-white shrink-0">
												{`${a.Profiles?.first_name ?? "U"} ${a.Profiles?.last_name ?? ""}`
													.trim()
													.split(" ")
													.map((n: string) => n[0])
													.join("")}
											</div>
											<span className="text-sm text-gray-700 font-medium flex-1">{`${a.Profiles?.first_name ?? "Unknown"} ${a.Profiles?.last_name ?? "User"}`}</span>
											<button
												onClick={() =>
													setTicket((t) =>
														t
															? {
																	...t,
																	TicketAssigned: t.TicketAssigned.filter(
																		(x) => x.profile_id !== a.profile_id,
																	),
																}
															: t,
													)
												}
												className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-all text-sm leading-none"
											>
												✕
											</button>
										</div>
									))}
								</div>
							) : (
								<span className="text-sm text-gray-400">Unassigned</span>
							)}

							{/* Add Assignee */}
							{availableProfiles.length > 0 && (
								<div className="relative mt-2" ref={assignDropdownRef}>
									<button
										onClick={() => setShowAssignDropdown((v) => !v)}
										className="flex items-center gap-1 text-xs text-indigo-600 hover:bg-indigo-50 font-medium transition-colors border border-indigo-200 rounded-lg px-2.5 py-1"
									>
										+ Add Assignee
									</button>

									{showAssignDropdown && (
										<div className="absolute z-10 mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg py-1 max-h-48 overflow-y-auto">
											{availableProfiles.map((profile) => (
												<button
													key={profile.profile_id}
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
																: t,
														);
														setShowAssignDropdown(false);
													}}
													className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-gray-50 transition-colors"
												>
													<div className="w-6 h-6 rounded-full bg-indigo-500 flex items-center justify-center text-[10px] font-bold text-white shrink-0">
														{`${profile.first_name} ${profile.last_name}`
															.split(" ")
															.map((n: string) => n[0])
															.join("")}
													</div>
													<span className="text-sm text-gray-700">{`${profile.first_name} ${profile.last_name}`}</span>
												</button>
											))}
										</div>
									)}
								</div>
							)}
						</div>

						{/* Watcher */}
						<div className="relative">
							<p className="text-xs text-gray-400 font-medium mb-1.5">Watcher</p>
							<div
								className="cursor-pointer"
								onClick={() => setEditing(editing === "watcher" ? null : "watcher")}
							>
								{watcher ? (
									<div className="flex items-center gap-2">
										<div className="w-7 h-7 rounded-full bg-emerald-500 flex items-center justify-center text-[10px] font-bold text-white">
											{`${watcher.first_name} ${watcher.last_name}`
												.split(" ")
												.map((n: string) => n[0])
												.join("")}
										</div>
										<span className="text-sm text-gray-700 font-medium">{`${watcher.first_name} ${watcher.last_name}`}</span>
									</div>
								) : (
									<span className="text-sm text-indigo-500 font-medium">Unassigned</span>
								)}
							</div>
							{editing === "watcher" && (
								<div className="absolute z-50 mt-1 min-w-[160px] bg-white border border-gray-200 rounded-lg shadow-lg py-1 max-h-48 overflow-y-auto">
									<button
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
											<div className="w-6 h-6 rounded-full bg-indigo-500 flex items-center justify-center text-[10px] font-bold text-white shrink-0">
												{`${u.first_name} ${u.last_name}`.split(" ").map((n) => n[0]).join("")}
											</div>
											{`${u.first_name} ${u.last_name}`}
										</button>
									))}
								</div>
							)}
						</div>

						{/* Creation Date */}
					<div>
						<p className="text-xs text-gray-400 font-medium mb-1.5">Creation Date</p>
						<p className="text-sm text-gray-700">
							{ticket.creation_date
								? new Date(ticket.creation_date).toLocaleString()
								: "—"}
						</p>
					</div>

					{/* End Date */}
					<div>
						<p className="text-xs text-gray-400 font-medium mb-1.5">End Date</p>
						<p className="text-sm text-gray-700">
							{ticket.end_date
								? new Date(ticket.end_date).toLocaleString()
								: "—"}
						</p>
					</div>

					{/* Deadline */}
					<div>
						<p className="text-xs text-gray-400 font-medium mb-1.5">Deadline</p>
						<input
							type="datetime-local"
							value={deadlineDraft || (ticket.deadline_date ? new Date(ticket.deadline_date).toISOString().slice(0, 16) : "")}
							onChange={(e) => { setDeadlineDraft(e.target.value); commitDeadline(); }}
							className="text-sm text-gray-900 border border-gray-200 rounded-md px-2 py-1 w-full focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
						/>
					</div>

						{/* Attachments */}
					{ticketImages.length > 0 && (
						<div>
							<p className="text-xs text-gray-400 font-medium mb-1.5">Attachments</p>
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

					{/* Tags */}
					<div className="col-span-2">
						<p className="text-xs text-gray-400 font-medium mb-1.5">Tags</p>
							<div className="flex flex-wrap gap-1.5 items-center">
								{selectedTags.map((tag_id) => {
									const tag = tags.find((t) => t.tag_id === tag_id);
									return (
										<span
											key={tag_id}
											style={{ color: tag?.color ?? "" }} // Handles #FFFFFF perfectly
											className={
												"inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-xs font-medium"
											}
										>
											{tag?.name}
											<span
												className="cursor-pointer opacity-60 hover:opacity-100"
												onClick={() => toggleTag(tag_id)}
											>
												×
											</span>
										</span>
									);
								})}
								<button
									onClick={() => setEditing(editing === "tags" ? null : "tags")}
									className="text-xs text-indigo-600 hover:text-indigo-700 font-medium px-1.5 py-0.5 rounded border border-indigo-200 hover:bg-indigo-50"
								>
									+ Add
								</button>
							</div>
							{editing === "tags" && (
								<div className="mt-2 flex flex-wrap gap-1.5">
									{tags.map((tag) => {
										const active = selectedTags.includes(tag.tag_id);
										return (
											<button
												key={tag.tag_id}
												onClick={() => toggleTag(tag.tag_id)}
												style={{ color: tag?.color ?? "" }} // Handles #FFFFFF perfectly
												className={`text-xs font-medium px-2.5 py-1 rounded-full border transition-all ${active ? "ring-1 ring-current" : "opacity-50"}`}
											>
												{active ? "✓ " : "+ "}
												{tag.name}
											</button>
										);
									})}
								</div>
							)}
						</div>

						{/* API Details — visible only when the "API" tag is applied */}
						{isApiTagSelected && (
							<div className="col-span-2 space-y-2">
								<p className="text-xs text-gray-400 font-medium">API Details</p>
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
										className="w-full rounded-lg border border-gray-200 bg-white px-2.5 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
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
					</div>

					{/* Description */}
					<div className="px-5 py-4 border-b border-gray-100">
						<div className="flex items-center justify-between mb-2">
							<h3 className="text-sm font-semibold text-gray-900">Description</h3>
							{editing !== "description" && (
								<button
									onClick={() => startEdit("description")}
									className="text-xs text-indigo-600 font-medium hover:text-indigo-700"
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
									className="w-full text-sm text-gray-600 border border-indigo-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none break-words"
								/>
								<div className="flex gap-2">
									<button
										onClick={commitDesc}
										className="text-xs font-medium bg-indigo-600 text-white px-3 py-1.5 rounded-md hover:bg-indigo-700"
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
								className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap break-words cursor-pointer hover:text-gray-800"
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

            {/* Subtasks */}
            {/*{ticket.subtasks && ticket.subtasks.length > 0 && (*/}
            {/*    <div className="px-5 py-4 border-b border-gray-100">*/}
            {/*      <h3 className="text-sm font-semibold text-gray-900 mb-3">*/}
            {/*        Subtasks ({completedSubtasks}/{totalSubtasks})*/}
            {/*      </h3>*/}
            {/*      <div className="space-y-2">*/}
            {/*        {ticket.subtasks.map((subtask) => (*/}
            {/*            <div key={subtask.id} className="flex items-center gap-3 group">*/}
            {/*              <div*/}
            {/*                  className={`w-4 h-4 rounded flex items-center justify-center shrink-0 border transition-colors ${*/}
            {/*                      subtask.completed*/}
            {/*                          ? 'bg-indigo-600 border-indigo-600'*/}
            {/*                          : 'border-gray-300 group-hover:border-gray-400'*/}
            {/*                  }`}*/}
            {/*              >*/}
            {/*                {subtask.completed && <CheckIcon className="text-white" />}*/}
            {/*              </div>*/}
            {/*              <span*/}
            {/*                  className={`text-sm flex-1 ${*/}
            {/*                      subtask.completed ? 'line-through text-gray-400' : 'text-gray-700'*/}
            {/*                  }`}*/}
            {/*              >*/}
            {/*              {subtask.title}*/}
            {/*            </span>*/}
            {/*              {subtask.assignee ? (*/}
            {/*                  <div*/}
            {/*                      className={`w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold text-white shrink-0 ${subtask.assignee.bgColor}`}*/}
            {/*                      title={subtask.assignee.name}*/}
            {/*                  >*/}
            {/*                    {subtask.assignee.initials}*/}
            {/*                  </div>*/}
            {/*              ) : (*/}
            {/*                  <div className="w-6 h-6 rounded-full border-2 border-dashed border-gray-200 shrink-0" />*/}
            {/*              )}*/}
            {/*            </div>*/}
            {/*        ))}*/}
            {/*      </div>*/}
            {/*    </div>*/}
            {/*)}*/}

            {/* Activity / history log */}
            <TicketHistoryLog ticketId={ticket.ticket_id} />

					<div className="h-4" />

					{/* Comments */}
					<div className="px-5 pb-5">
						<h3 className="text-sm font-semibold text-gray-900 mb-3">Comments</h3>

						{/* Posted comments */}
						{comments.length > 0 && (
							<div className="space-y-3 mb-4">
								{comments.map((comment) => (
									<div key={comment.comment_id} className="flex gap-2.5">
										<div className="w-7 h-7 rounded-full bg-indigo-500 flex items-center justify-center text-[10px] font-bold text-white shrink-0 mt-0.5">
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
						<div className="border border-gray-200 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-transparent transition-shadow">
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
												className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-gray-700 text-white flex items-center justify-center text-[10px] leading-none hover:bg-red-600 transition-colors"
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
						{commentError && (
							<p className="px-3 pb-1 text-xs text-red-500">{commentError}</p>
						)}
							<div className="flex items-center justify-between px-3 py-2 border-t border-gray-100 bg-gray-50/50">
								<label
									className="cursor-pointer text-gray-400 hover:text-indigo-500 transition-colors"
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
								<button
									type="button"
									onClick={handleAddComment}
									disabled={
										(!commentText.trim() && commentImages.length === 0) || isSubmitting
									}
									className="text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed px-3 py-1.5 rounded-md transition-colors"
								>
									{isSubmitting ? "Posting..." : "Comment"}
								</button>
							</div>
						</div>
					</div>
				</div>

				{/* Footer save button */}
				<div className="flex items-center justify-end gap-3 px-5 py-3.5 border-t border-gray-100 shrink-0 bg-white">
					<button
						onClick={onClose}
						className="text-sm font-medium text-gray-500 px-4 py-2 rounded-lg hover:bg-gray-100"
					>
						Cancel
					</button>
					<button
						onClick={handleSave}
						className="text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded-lg transition-colors"
					>
						Save Changes
					</button>
				</div>
			</div>
		{lightboxSrc && (
				<ImageLightbox src={lightboxSrc} onClose={() => setLightboxSrc(null)} />
			)}
		</>
	);
}
