"use client";

import { Ticket, Tag } from "@/entities/types";

import { useState, useRef, useEffect } from "react";
import { CommentParentType, status as status } from "@/lib/generated/prisma";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

import { useAuth } from "@/features/auth";
import { useProfiles } from "@/entities/profile/queries";
import { useTicketComments, useTicketImages } from "@/entities/comment/queries";
import { useCreateComment } from "@/entities/comment/mutations";
import { useUpdateTicket } from "@/entities/ticket/mutations";
import { createClient } from "@/lib/supabase/client";
import { getInitials } from "@/shared/lib/strings";
import ImageLightbox from "@/shared/ui/ImageLightbox";
import TicketHistoryLog from "./TicketHistoryLog";
import { TagBadge } from "@/entities/tag/ui/TagBadge";
import { Calendar, X, Paperclip, Pencil, ChevronDown } from "lucide-react";
import { FormInput } from "@/components/ui/forminput";
import { Input } from "@/components/ui/input";

const STATUS_CONFIG: Record<
	status,
	{ label: string; dotClass: string; textClass: string }
> = {
	PENDING: {
		label: "Pending",
		dotClass: "bg-yellow-500",
		textClass: "text-yellow-600",
	},
	IN_PROGRESS: {
		label: "In Progress",
		dotClass: "bg-brand-500",
		textClass: "text-brand-600",
	},
	FINISHED: {
		label: "Finished",
		dotClass: "bg-green-500",
		textClass: "text-green-600",
	},
};

const STATUSES = [status.PENDING, status.IN_PROGRESS, status.FINISHED];

type EditingField = "tags" | "status" | null;

function formatDateTime(date: Date | string | null | undefined): string {
	if (!date) return "";
	const d = new Date(date);
	if (isNaN(d.getTime())) return "";
	return d.toLocaleString("en-US", {
		month: "short",
		day: "numeric",
		year: "numeric",
		hour: "numeric",
		minute: "2-digit",
		hour12: true,
	});
}

function toInputDateTime(date: Date | string | null | undefined): string {
	if (!date) return "";
	const d = new Date(date);
	if (isNaN(d.getTime())) return "";
	return new Date(d.getTime() - d.getTimezoneOffset() * 60000)
		.toISOString()
		.slice(0, 16);
}

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

	const [selectedTags, setSelectedTags] = useState<string[]>([]);

	const [showAssignDropdown, setShowAssignDropdown] = useState(false);
	const assignDropdownRef = useRef<HTMLDivElement>(null);

	const [showWatcherDropdown, setShowWatcherDropdown] = useState(false);
	const watcherRef = useRef<HTMLDivElement>(null);

	const statusRef = useRef<HTMLDivElement>(null);

	/** API fields */
	const [apiMethod, setApiMethod] = useState<"GET" | "POST" | "PUT" | "DELETE">(
		"GET",
	);
	const [apiRoute, setApiRoute] = useState("");

	/** Comments */
	const [commentText, setCommentText] = useState("");
	const [commentImages, setCommentImages] = useState<File[]>([]);
	const [commentImagePreviews, setCommentImagePreviews] = useState<string[]>(
		[],
	);
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

			if (
				watcherRef.current &&
				!watcherRef.current.contains(target)
			) {
				setShowWatcherDropdown(false);
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
		setShowWatcherDropdown(false);
		setShowAssignDropdown(false);
	}, [isOpen]);

	if (!ticket) return null;

	const availableProfiles = profiles.filter(
		(user) =>
			!ticket.TicketAssigned.some((a) => a.profile_id === user.profile_id),
	);

	const watcher = profiles.find((u) => u.profile_id === ticket.watcher_id);

	function setWatcher(userId: string) {
		setTicket((t) => (t ? { ...t, watcher_id: userId || null } : t));
	}

	function setStatus(val: status) {
		setTicket((t) => {
			if (!t) return t;
			const now = new Date();
			const isStarting =
				(val === status.IN_PROGRESS || val === status.FINISHED) && !t.actual_start_at;
			const isFinishing = val === status.FINISHED;

			return {
				...t,
				status: val,
				actual_start_at: isStarting ? now : t.actual_start_at,
				actual_end_at: isFinishing
					? (t.actual_end_at ?? now)
					: val === status.PENDING
					? null
					: t.actual_end_at,
			};
		});
		setEditing(null);
	}

	function toggleTag(tagId: string) {
		setSelectedTags((prev) =>
			prev.includes(tagId) ? prev.filter((t) => t !== tagId) : [...prev, tagId],
		);
	}

	async function handleSave() {
		if (!ticket) return;
		const updated = await updateTicketMutation.mutateAsync({
			ticket_id: ticket.ticket_id,
			workflow_id: ticket.workflow_id,
			name: ticket.name,
			start_date: ticket.plan_start_at ? new Date(ticket.plan_start_at) : undefined,
			deadline_date: ticket.plan_end_at ? new Date(ticket.plan_end_at) : new Date(),
			status: ticket.status,
			watcher_id: ticket.watcher_id,
			TicketAssigned: ticket.TicketAssigned.map(
				(assignment) => assignment.profile_id,
			),
			tagIds: selectedTags,
			description: ticket.description,
			actual_start_at: ticket.actual_start_at,
			finish_date: ticket.actual_end_at,
			api_route: apiRoute || null,
			api_method: apiMethod || null,
			performed_by: user?.profile_id,
		});
		onUpdate(updated);
		onClose();
	}

	const isApiTagSelected = selectedTags.some(
		(tagId) =>
			tags.find((t) => t.tag_id === tagId)?.name?.toLowerCase() === "api",
	);

	function handleCommentImageChange(e: React.ChangeEvent<HTMLInputElement>) {
		const files = e.target.files;
		if (!files) return;

		const validFiles: File[] = [];
		const validPreviews: string[] = [];

		Array.from(files).forEach((file) => {
			if (file.size > 5 * 1024 * 1024) {
				alert(`Image "${file.name}" must be under 5MB.`);
				return;
			}
			validFiles.push(file);
			validPreviews.push(URL.createObjectURL(file));
		});

		if (validFiles.length > 0) {
			setCommentImages((prev) => [...prev, ...validFiles]);
			setCommentImagePreviews((prev) => [...prev, ...validPreviews]);
		}

		e.target.value = "";
	}

	function removeImage(index: number) {
		URL.revokeObjectURL(commentImagePreviews[index]);
		setCommentImages((prev) => prev.filter((_, i) => i !== index));
		setCommentImagePreviews((prev) => prev.filter((_, i) => i !== index));
	}

	async function handleAddComment() {
		if (!commentText.trim()) {
			if (commentImages.length > 0) {
				setCommentError("Add some text to go with your image.");
			}
			return;
		}
		setCommentError(null);

		try {
			setIsSubmitting(true);
			const supabase = createClient();
			const {
				data: { user },
			} = await supabase.auth.getUser();

			if (!user) {
				throw new Error("You must be logged in to post a comment.");
			}

			const imageUrls: string[] = [];

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
						throw new Error(
							`Failed to upload image ${file.name}: ${error.message}`,
						);
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

	const currentStatusConfig = STATUS_CONFIG[ticket.status] ?? STATUS_CONFIG.PENDING;

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
						{"TICKET " + "..." + ticket.ticket_id.slice(0, 16)}
					</span>
					<Button variant="ghost" size="icon-sm" onClick={onClose}>
						<X className="text-neutral-border hover:text-foreground transition-all duration-300 fade-in" />
					</Button>
				</div>

				{/* Status bar */}
				<div className="flex flex-col gap-3 px-5 py-3.5 border-b border-gray-100 shrink-0 relative">
					<div className="flex items-center justify-between gap-3 max-w-full">
						<div className="inline-flex items-center gap-2 max-w-full min-w-0 flex-1">
							<input
								type="text"
								value={ticket.name}
								maxLength={50}
								onChange={(e) =>
									setTicket((t) => (t ? { ...t, name: e.target.value } : t))
								}
								placeholder="Ticket title..."
								className="text-overflow text-ellipsis text-2xl font-bold text-gray-900 bg-transparent border border-transparent hover:border-gray-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 focus:outline-none rounded-md px-1.5 py-0.5 leading-tight placeholder:text-gray-300 max-w-[calc(100%-2rem)] [field-sizing:content]"
							/>
							<Pencil size={16} className="text-gray-400 shrink-0 pointer-events-none" />
						</div>

						{/* Status Selector */}
						<div className="relative shrink-0" ref={statusRef}>
							<div
								className="flex items-center gap-1 bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1 select-none cursor-pointer"
								onClick={() => setEditing(editing === "status" ? null : "status")}
							>
								<span className={`h-2.5 w-2.5 rounded-full shrink-0 ${currentStatusConfig.dotClass}`} />
								<span className={`text-xs font-semibold ${currentStatusConfig.textClass}`}>
									{currentStatusConfig.label}
								</span>
								<button
									type="button"
									className="text-xs text-brand-600 hover:text-brand-700 font-medium py-0.5 rounded transition-colors ml-1 cursor-pointer"
								>
									<ChevronDown size={12} />
								</button>
							</div>

							{editing === "status" && (
								<div className="absolute right-0 top-full z-50 w-44 bg-neutral-surface border border-gray-200 rounded-xl shadow-lg py-1.5 max-h-48 overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-200 ease-out">
									<div className="text-[11px] font-semibold text-gray-400 px-3 py-1 uppercase tracking-wider">
										Select Status
									</div>
									{STATUSES.map((s) => {
										const config = STATUS_CONFIG[s];
										const isSelected = s === ticket.status;
										return (
											<button
												key={s}
												type="button"
												onClick={() => setStatus(s)}
												className={`w-full flex items-center justify-between px-3 py-1.5 hover:bg-gray-50 transition-all duration-150 text-left cursor-pointer ${
													isSelected ? "bg-gray-50 font-semibold" : ""
												}`}
											>
												<div className="flex items-center gap-2">
													<span
														className={`h-2 w-2 rounded-full ${config.dotClass} transition-all duration-200 ${
															isSelected ? "scale-110" : "scale-100"
														}`}
													/>
													<span className={`text-sm font-medium ${config.textClass}`}>
														{config.label}
													</span>
												</div>
												{isSelected && (
													<span className="text-brand-600 text-xs font-bold animate-in fade-in zoom-in-95 duration-150">
														✓
													</span>
												)}
											</button>
										);
									})}
								</div>
							)}
						</div>
					</div>

					<div className="relative inline-block">
						{/* Selected Tags + Add Button Row */}
						<div className="flex flex-wrap gap-1.5 items-center">
							{selectedTags.map((tag_id) => {
								const tag = tags.find((t) => t.tag_id === tag_id);
								return tag ? (
									<TagBadge
										key={tag_id}
										hover={true}
										className="hover:!bg-neutral-border"
										tag={tag}
										onClick={() => toggleTag(tag.tag_id)}
									/>
								) : null;
							})}
							<button
								type="button"
								onClick={() => setEditing(editing === "tags" ? null : "tags")}
								className="text-xs text-brand-600 hover:text-indigo-700 font-medium px-1.5 py-1 rounded-lg border border-indigo-200 hover:bg-indigo-50 transition-colors cursor-pointer"
							>
								+ Add Tags
							</button>
						</div>

						{/* Floating Context Box Popover */}
						{editing === "tags" && (
							<>
								<div
									className="fixed inset-0 z-10"
									onClick={() => setEditing(null)}
								/>
								<div className="absolute left-0 top-full mt-1.5 z-20 w-64 p-3 bg-white border border-gray-200 rounded-xl shadow-lg flex flex-wrap gap-1.5 max-h-48 overflow-y-auto">
									<div className="w-full text-xs font-semibold text-gray-500 mb-1">
										SELECT TAGS
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
					<div className="px-5 py-4 flex flex-col gap-4 border-b border-gray-100">
						{/* Top metadata: Assigned To + Watcher */}
						<div className="grid grid-cols-2 gap-x-6 gap-y-4">
							{/* Assigned To */}
							<div>
								<Label className="text-xs text-neutral-border font-bold">
									ASSIGNED TO
								</Label>

								<div className="flex flex-wrap items-center gap-1.5 mt-1">
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
													{initials}
													<button
														type="button"
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

									{availableProfiles.length > 0 && (
										<div className="relative" ref={assignDropdownRef}>
											<button
												type="button"
												onClick={() => setShowAssignDropdown((v) => !v)}
												className="flex items-center gap-1 text-xs text-brand-600 hover:bg-indigo-50 font-medium transition-colors border border-indigo-200 rounded-lg px-2 py-1 cursor-pointer"
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
																		: t,
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
							<div>
								<Label className="text-xs text-neutral-border font-bold">
									WATCHER
								</Label>

								<div className="flex flex-wrap items-center gap-1.5 mt-1">
									{watcher ? (
										<div
											title={`${watcher.first_name} ${watcher.last_name}`}
											className="group relative inline-flex items-center justify-center w-7 h-7 rounded-full bg-emerald-500 text-neutral-surface text-[10px] font-bold shrink-0 cursor-default select-none"
										>
											{`${watcher.first_name} ${watcher.last_name}`
												.split(" ")
												.map((n: string) => n[0])
												.join("")}

											<button
												type="button"
												onClick={() => setWatcher("")}
												className="absolute inset-0 rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-xs font-bold cursor-pointer"
												title={`Remove ${watcher.first_name} ${watcher.last_name}`}
											>
												✕
											</button>
										</div>
									) : (
										<span className="text-sm text-gray-400">Unassigned</span>
									)}

									<div className="relative" ref={watcherRef}>
										<button
											type="button"
											onClick={() => setShowWatcherDropdown((v) => !v)}
											className="flex items-center gap-1 text-xs text-brand-600 hover:bg-indigo-50 font-medium transition-colors border border-indigo-200 rounded-lg px-2 py-1 cursor-pointer"
										>
											{watcher ? "Change" : "+ Add"}
										</button>

										{showWatcherDropdown && (
											<div className="absolute left-0 top-full mt-1.5 z-20 w-52 bg-neutral-surface border border-gray-200 rounded-xl shadow-lg py-1.5 max-h-48 overflow-y-auto">
												<div className="text-[11px] font-semibold text-gray-400 px-3 py-1 uppercase tracking-wider">
													Select Watcher
												</div>
												{profiles.map((profile) => (
													<button
														key={profile.profile_id}
														type="button"
														onClick={() => {
															setWatcher(profile.profile_id);
															setShowWatcherDropdown(false);
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
								</div>
							</div>
						</div>

						{/* API Details */}
						{isApiTagSelected && (
							<div className="space-y-2">
								<Label className="text-xs text-neutral-border font-bold">
									API DETAILS
								</Label>
								{apiMethod && apiRoute && (
									<div className="inline-flex items-center gap-1.5 bg-gray-900 rounded-md px-2.5 py-1.5">
										<span className="text-xs font-mono text-green-400 font-bold">
											{apiMethod}
										</span>
										<span className="text-xs font-mono text-indigo-300">
											{apiRoute}
										</span>
									</div>
								)}
								<div className="grid grid-cols-[110px_1fr] gap-3">
									<select
										value={apiMethod}
										onChange={(e) =>
											setApiMethod(
												e.target.value as "GET" | "POST" | "PUT" | "DELETE",
											)
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

						{/* 2x2 Dates Grid Section */}
						<div className="space-y-2 pt-1">
							<Label className="text-xs mb-4 text-neutral-border font-bold tracking-wider uppercase">
								SCHEDULE & TIMELINE DATES
							</Label>
							<div className="grid grid-cols-2 gap-4">
								{/* Row 1, Col 1: Planned Start Date (Editable) */}
								<div className="space-y-1.5">
									<Label htmlFor="plan-start-date" className="text-xs text-gray-700 font-semibold flex items-center gap-1">
										<span>PLANNED START</span>
									</Label>
									<div className="relative flex items-center">
										<input
											id="plan-start-date"
											type="datetime-local"
											value={toInputDateTime(ticket.plan_start_at)}
											onChange={(e) => {
												const val = e.target.value ? new Date(e.target.value) : null;
												if (val) {
													setTicket((t) => (t ? { ...t, plan_start_at: val } : t));
												}
											}}
											className="h-9 w-full rounded-lg border border-gray-200 bg-neutral-surface px-2.5 py-1 text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-colors"
										/>
									</div>
								</div>

								{/* Row 1, Col 2: Planned End Date (Deadline Date) (Editable) */}
								<div className="space-y-1.5">
									<Label htmlFor="plan-end-date" className="text-xs text-gray-700 font-semibold flex items-center gap-1">
										<span>DEADLINE</span>
									</Label>
									<div className="relative flex items-center">
										<input
											id="plan-end-date"
											type="datetime-local"
											value={toInputDateTime(ticket.plan_end_at)}
											onChange={(e) => {
												const val = e.target.value ? new Date(e.target.value) : null;
												if (val) {
													setTicket((t) => (t ? { ...t, plan_end_at: val } : t));
												}
											}}
											className="h-9 w-full rounded-lg border border-gray-200 bg-neutral-surface px-2.5 py-1 text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-colors"
										/>
									</div>
								</div>

								{/* Row 2, Col 1: Actual Start Date */}
								<div className="space-y-1.5">
									<Label className="text-xs text-gray-700 font-semibold flex items-center gap-1">
										<span>ACTUAL START</span>
									</Label>
									{ticket.actual_start_at ? (
										<div className="h-9 w-full rounded-lg border border-gray-200 bg-gray-50/70 px-2.5 py-1 text-xs text-gray-700 flex items-center gap-2 select-none">
											<Calendar size={14} className="text-gray-400 shrink-0" />
											<span>{formatDateTime(ticket.actual_start_at)}</span>
										</div>
									) : (
										<div className="h-9 w-full rounded-lg border border-dashed border-gray-300 bg-gray-50/50 px-2.5 py-1 text-xs text-gray-400 flex items-center gap-2 select-none">
											<Calendar size={14} className="text-gray-300 shrink-0" />
											<span className="italic font-medium">Not started yet</span>
										</div>
									)}
								</div>

								{/* Row 2, Col 2: Actual End Date (Finish Date) */}
								<div className="space-y-1.5">
									<Label className="text-xs text-gray-700 font-semibold flex items-center gap-1">
										<span>FINISH</span>
									</Label>
									{ticket.actual_end_at ? (
										<div className="h-9 w-full rounded-lg border border-gray-200 bg-gray-50/70 px-2.5 py-1 text-xs text-gray-700 flex items-center gap-2 select-none">
											<Calendar size={14} className="text-gray-400 shrink-0" />
											<span>{formatDateTime(ticket.actual_end_at)}</span>
										</div>
									) : (
										<div className="h-9 w-full rounded-lg border border-dashed border-gray-300 bg-gray-50/50 px-2.5 py-1 text-xs text-gray-400 flex items-center gap-2 select-none">
											<Calendar size={14} className="text-gray-300 shrink-0" />
											<span className="italic font-medium">Not finished yet</span>
										</div>
									)}
								</div>
							</div>
						</div>
					</div>

					{/* Description */}
					<div className="px-5 py-4 border-b border-gray-100">
						<Label className="text-md -mb-4 text-neutral-border font-bold tracking-wider uppercase">
							DESCRIPTION
						</Label>
						<FormInput
							variant="textarea"
							label=""
							maxLength={360}
							rows={4}
							value={ticket.description ?? ""}
							placeholder="Add a description..."
							onChange={(e) =>
								setTicket((t) => (t ? { ...t, description: e.target.value } : t))
							}
						/>
					</div>

					{/* Attachments */}
					<div className="px-5 mt-5">
						{ticketImages.length > 0 && (
							<div>
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

					{(activeTab === "comments" || activeTab === "all") && (
						<div className="px-5 pb-5">
							{/* Posted comments */}
							{comments.length > 0 && (
								<div className="space-y-3 mb-4">
									{comments.map((comment) => (
										<div key={comment.comment_id} className="flex gap-2.5">
											<div className="w-7 h-7 rounded-full bg-brand-500 flex items-center justify-center text-[10px] font-bold text-neutral-surface shrink-0 mt-0.5">
												{getInitials(
													comment.Profiles.first_name +
														" " +
														comment.Profiles.last_name,
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
									onChange={(e) => {
										setCommentText(e.target.value);
										setCommentError(null);
									}}
									onKeyDown={(e) => {
										if (e.key === "Enter" && (e.ctrlKey || e.metaKey))
											handleAddComment();
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
										<Paperclip size={16} />
										<input
											ref={commentImageRef}
											type="file"
											accept="image/jpeg,image/png"
											multiple
											onChange={handleCommentImageChange}
											className="sr-only"
										/>
									</label>
									<div className="flex items-center">
										{commentError && (
											<p className="px-3 pb-1 text-xs text-destructive">
												{commentError}
											</p>
										)}
										<button
											type="button"
											onClick={handleAddComment}
											disabled={
												(!commentText.trim() && commentImages.length === 0) ||
												isSubmitting
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