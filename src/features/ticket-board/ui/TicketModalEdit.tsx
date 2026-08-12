"use client";

import { useState, useRef, useEffect } from "react";
import { Ticket, Tag } from "@/entities/types";
import { CommentParentType, status as StatusEnum } from "@/lib/generated/prisma";
import { ProfileType } from "@/shared/types";

import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { FormInput } from "@/components/ui/forminput";
import { Input } from "@/components/ui/input";
import { TagBadge } from "@/entities/tag/ui/TagBadge";

import { useAuth } from "@/features/auth";
import { useProfiles } from "@/entities/profile/queries";
import { useTicketComments, useTicketImages } from "@/entities/comment/queries";
import { useCreateComment } from "@/entities/comment/mutations";
import { useUpdateTicket } from "@/entities/ticket/mutations";
import { createClient } from "@/lib/supabase/client";

import { getInitials } from "@/shared/lib/strings";
import ImageLightbox from "@/shared/ui/ImageLightbox";
import TicketHistoryLog from "./TicketHistoryLog";

import {
	Calendar,
	X,
	Paperclip,
	Pencil,
	ChevronDown,
	Bug
} from "lucide-react";

// ==========================================
// CONSTANTS & HELPERS
// ==========================================

const STATUS_CONFIG: Record<
	StatusEnum,
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

const STATUSES = [StatusEnum.PENDING, StatusEnum.IN_PROGRESS, StatusEnum.FINISHED];

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

// ==========================================
// MAIN COMPONENT
// ==========================================

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
	const [selectedTags, setSelectedTags] = useState<string[]>([]);

	// API fields
	const [apiMethod, setApiMethod] = useState<"GET" | "POST" | "PUT" | "DELETE">("GET");
	const [apiRoute, setApiRoute] = useState("");

	// Lightbox
	const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);

	// TanStack Queries & Mutations
	const { user } = useAuth();
	const { data: profiles = [] } = useProfiles();
	const { data: comments = [] } = useTicketComments(ticket?.ticket_id);
	const { data: ticketImages = [] } = useTicketImages(ticket?.ticket_id);
	const updateTicketMutation = useUpdateTicket();

	// Sync ticket data when modal opens
	useEffect(() => {
		if (!isOpen) return;
		setTicket(initialTicket);
		setSelectedTags(
			initialTicket?.TicketTags?.map((t: { tag_id: string }) => t.tag_id) ?? []
		);
	}, [isOpen, initialTicket]);

	if (!ticket) return null;

	const isApiTagSelected = selectedTags.some(
		(tagId) => tags.find((t) => t.tag_id === tagId)?.name?.toLowerCase() === "api"
	);

	async function handleSave() {
		if (!ticket) return;
		const updated = await updateTicketMutation.mutateAsync({
			ticket_id: ticket.ticket_id,
			workflow_id: ticket.workflow_id,
			name: ticket.name,
			plan_start_at: ticket.plan_start_at ? new Date(ticket.plan_start_at) : undefined,
			plan_end_at: ticket.plan_end_at ? new Date(ticket.plan_end_at) : new Date(),
			actual_start_at: ticket.actual_start_at,
			actual_end_at: ticket.actual_end_at,
			status: ticket.status,
			watcher_id: ticket.watcher_id,
			TicketAssigned: ticket.TicketAssigned.map((a) => a.profile_id),
			tagIds: selectedTags,
			description: ticket.description,
			api_route: apiRoute || null,
			api_method: apiMethod || null,
			performed_by: user?.profile_id,
		});
		onUpdate(updated);
		onClose();
	}

	return (
		<>
			{/* Backdrop */}
			<div
				className={`fixed inset-0 bg-foreground/30 z-40 transition-opacity duration-300 ${
					isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
				}`}
				onClick={onClose}
			/>

			{/* Modal Panel */}
			<div
				className={`fixed top-0 right-0 h-full w-[40rem] bg-neutral-surface shadow-2xl z-50 flex flex-col transition-transform duration-300 ease-in-out ${
					isOpen ? "translate-x-0" : "translate-x-full"
				}`}
			>
				{/* 1. HEADER */}
				<TicketHeader ticketId={ticket.ticket_id} onClose={onClose} />

				{/* 2. TITLE, STATUS & TAGS */}
				<TicketTitleAndStatus
					ticket={ticket}
					tags={tags}
					selectedTags={selectedTags}
					setTicket={setTicket}
					setSelectedTags={setSelectedTags}
				/>

				{/* SCROLLABLE BODY */}
				<div className="flex-1 overflow-y-auto">
					<div className="px-5 py-4 flex flex-col gap-4 border-b border-gray-100">
						{/* 3. ASSIGNEES & WATCHER */}
						<TicketAssignees
							ticket={ticket}
							profiles={profiles}
							setTicket={setTicket}
						/>

						{/* 4. API DETAILS */}
						{isApiTagSelected && (
							<TicketApiDetails
								apiMethod={apiMethod}
								apiRoute={apiRoute}
								setApiMethod={setApiMethod}
								setApiRoute={setApiRoute}
							/>
						)}

						{/* 5. SCHEDULE DATES */}
						<TicketSchedule ticket={ticket} setTicket={setTicket} />
					</div>

					{/* 6. DESCRIPTION */}
					<TicketDescription ticket={ticket} setTicket={setTicket} />

					<div className="px-5 mt-3">
						<div className="flex justify-between">
							<Label className="text-md text-neutral-border font-bold tracking-wider uppercase">
								SUBTASKS
							</Label>
							<span className="text-sm text-neutral-border/75">1 of 2 complete</span>
						</div>
						<div className="flex flex-col gap-3 max-h-85 overflow-auto select-none">
							{/** Map this function to a subtask thingymajig that lists them all*/}
							<div className="drop-shadow-md rounded-lg p-2 bg-neutral-surface flex flex-col border border-brand-100">
								<span className="font-mono text-sm text-brand-500">LRN-BNN</span>
								<span className="font-semibold text-lg">Lorens Banana Recipe for Rogers</span>
								<div className="flex items-center gap-2 text-sm font-bold text-neutral-border"><Calendar size={12} strokeWidth={3}/><span>Lorens Banana</span></div>
							</div>
						</div>
					</div>

					{/* 7. ATTACHMENTS */}
					<TicketAttachments
						images={ticketImages}
						onImageClick={(src) => setLightboxSrc(src)}
					/>

					{/* 8. ACTIVITY (LOGS & COMMENTS) */}
					<TicketActivitySection
						ticketId={ticket.ticket_id}
						comments={comments}
						currentUser={user}
						onImageClick={(src) => setLightboxSrc(src)}
					/>

					<div className="h-16" />
				</div>

				{/* 9. FOOTER */}
				<TicketFooter onClose={onClose} onSave={handleSave} />
			</div>

			{/* LIGHTBOX */}
			{lightboxSrc && (
				<ImageLightbox src={lightboxSrc} onClose={() => setLightboxSrc(null)} />
			)}
		</>
	);
}

// ==========================================
// SUB-COMPONENTS
// ==========================================

/* --- 1. Header --- */
function TicketHeader({
	ticketId,
	onClose,
}: {
	ticketId: string;
	onClose: () => void;
}) {
	return (
		<div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-gray-100 shrink-0">
			<span className="font-mono text-sm text-brand-500">LRN-BNN</span>
			<Button variant="ghost" size="icon-sm" onClick={onClose}>
				<X className="text-neutral-border hover:text-foreground transition-all duration-300" />
			</Button>
		</div>
	);
}

/* --- 2. Title & Status --- */
function TicketTitleAndStatus({
	ticket,
	tags,
	selectedTags,
	setTicket,
	setSelectedTags,
}: {
	ticket: Ticket;
	tags: Tag[];
	selectedTags: string[];
	setTicket: React.Dispatch<React.SetStateAction<Ticket | null>>;
	setSelectedTags: React.Dispatch<React.SetStateAction<string[]>>;
}) {
	const [editing, setEditing] = useState<"tags" | "status" | null>(null);
	const statusRef = useRef<HTMLDivElement>(null);

	const currentStatusConfig =
		STATUS_CONFIG[ticket.status] ?? STATUS_CONFIG.PENDING;

	useEffect(() => {
		const handleClickOutside = (e: MouseEvent) => {
			if (
				statusRef.current &&
				!statusRef.current.contains(e.target as Node)
			) {
				setEditing((prev) => (prev === "status" ? null : prev));
			}
		};
		document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, []);

	function setStatus(val: StatusEnum) {
		setTicket((t) => {
			if (!t) return t;
			const now = new Date();
			const isStarting =
				(val === StatusEnum.IN_PROGRESS || val === StatusEnum.FINISHED) &&
				!t.actual_start_at;
			const isFinishing = val === StatusEnum.FINISHED;

			return {
				...t,
				status: val,
				actual_start_at: isStarting ? now : t.actual_start_at,
				actual_end_at: isFinishing
					? t.actual_end_at ?? now
					: val === StatusEnum.PENDING
					? null
					: t.actual_end_at,
			};
		});
		setEditing(null);
	}

	function toggleTag(tagId: string) {
		setSelectedTags((prev) =>
			prev.includes(tagId) ? prev.filter((t) => t !== tagId) : [...prev, tagId]
		);
	}

	return (
		<div className="flex flex-col gap-3 px-5 py-3.5 border-b border-gray-100 shrink-0 relative">
			<div className="flex items-center justify-between gap-3 max-w-full">
				{/* Editable Title */}
				<div className="inline-flex items-center gap-2 max-w-full min-w-0 flex-1">
					<input
						type="text"
						value={ticket.name}
						maxLength={50}
						onChange={(e) =>
							setTicket((t) => (t ? { ...t, name: e.target.value } : t))
						}
						placeholder="Ticket title..."
						className="-ml-1 text-ellipsis text-2xl font-bold text-gray-900 bg-transparent border border-transparent
						 hover:border-gray-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 focus:outline-none 
						 rounded-md px-1.5 py-0.5 leading-tight placeholder:text-gray-300 max-w-[calc(100%-2rem)] [field-sizing:content]"
					/>
					<Pencil size={16} className="text-gray-400 shrink-0 pointer-events-none" />
				</div>

				{/* Status Dropdown */}
				<div className="relative shrink-0" ref={statusRef}>
					<div
						className="flex items-center gap-1 bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1 select-none cursor-pointer"
						onClick={() => setEditing(editing === "status" ? null : "status")}
					>
						<span
							className={`h-2.5 w-2.5 rounded-full shrink-0 ${currentStatusConfig.dotClass}`}
						/>
						<span
							className={`text-xs font-semibold ${currentStatusConfig.textClass}`}
						>
							{currentStatusConfig.label}
						</span>
						<ChevronDown size={12} className="text-brand-600 ml-1" />
					</div>

					{editing === "status" && (
						<div className="absolute right-0 top-full z-50 w-44 bg-neutral-surface border border-gray-200 rounded-xl shadow-lg py-1.5 max-h-48 overflow-y-auto mt-1">
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
										className={`w-full flex items-center justify-between px-3 py-1.5 hover:bg-gray-50 text-left ${
											isSelected ? "bg-gray-50 font-semibold" : ""
										}`}
									>
										<div className="flex items-center gap-2">
											<span
												className={`h-2 w-2 rounded-full ${config.dotClass}`}
											/>
											<span className={`text-sm font-medium ${config.textClass}`}>
												{config.label}
											</span>
										</div>
										{isSelected && (
											<span className="text-brand-600 text-xs font-bold">✓</span>
										)}
									</button>
								);
							})}
						</div>
					)}
				</div>
			</div>

			{/* Tags Section */}
			<div className="relative inline-block">
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
						className="text-xs text-brand-600 hover:text-indigo-700 font-medium px-1.5 py-1 rounded-lg border border-indigo-200 hover:bg-indigo-50 transition-colors"
					>
						+ Add Tags
					</button>
				</div>

				{/* Tag Popover */}
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
										className={`text-xs font-medium px-2.5 py-1 rounded-full border transition-all ${
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
	);
}

/* --- 3. Assignees & Watcher --- */
function TicketAssignees({
	ticket,
	profiles,
	setTicket,
}: {
	ticket: Ticket;
	profiles: ProfileType[];
	setTicket: React.Dispatch<React.SetStateAction<Ticket | null>>;
}) {
	const [showAssignDropdown, setShowAssignDropdown] = useState(false);
	const [showWatcherDropdown, setShowWatcherDropdown] = useState(false);

	const assignDropdownRef = useRef<HTMLDivElement>(null);
	const watcherRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const handleClickOutside = (e: MouseEvent) => {
			const target = e.target as Node;
			if (assignDropdownRef.current && !assignDropdownRef.current.contains(target)) {
				setShowAssignDropdown(false);
			}
			if (watcherRef.current && !watcherRef.current.contains(target)) {
				setShowWatcherDropdown(false);
			}
		};
		document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, []);

	const availableProfiles = profiles.filter(
		(u) => !ticket.TicketAssigned.some((a) => a.profile_id === u.profile_id)
	);

	const watcher = profiles.find((u) => u.profile_id === ticket.watcher_id);

	return (
		<div className="grid grid-cols-2 gap-x-6 gap-y-4">
			{/* Assigned To */}
			<div>
				<Label className="text-xs text-neutral-border font-bold">ASSIGNED TO</Label>

				<div className="flex flex-wrap items-center gap-1.5 mt-1">
					{ticket.TicketAssigned && ticket.TicketAssigned.length > 0 ? (
						ticket.TicketAssigned.map((a) => {
							const fullName = `${a.Profile?.first_name ?? "Unknown"} ${
								a.Profile?.last_name ?? "User"
							}`.trim();
							const initials = fullName
								.split(" ")
								.map((n) => n[0])
								.join("");

							return (
								<div
									key={a.profile_id}
									title={fullName}
									className="group relative inline-flex items-center justify-center w-7 h-7 rounded-full bg-brand-500 text-neutral-surface text-[10px] font-bold shrink-0 select-none"
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
																(x) => x.profile_id !== a.profile_id
															),
													  }
													: t
											)
										}
										className="absolute inset-0 rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-xs font-bold"
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
								className="text-xs text-brand-600 hover:bg-indigo-50 font-medium transition-colors border border-indigo-200 rounded-lg px-2 py-1"
							>
								+ Add
							</button>

							{showAssignDropdown && (
								<div className="absolute left-0 top-full mt-1.5 z-20 w-52 bg-neutral-surface border border-gray-200 rounded-xl shadow-lg py-1.5 max-h-48 overflow-y-auto">
									<div className="text-[11px] font-semibold text-gray-400 px-3 py-1 uppercase tracking-wider">
										Select Assignee
									</div>
									{availableProfiles.map((p) => (
										<button
											key={p.profile_id}
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
																		profile_id: p.profile_id,
																		assigned_date: new Date(),
																		Profile: p,
																	},
																],
														  }
														: t
												);
												setShowAssignDropdown(false);
											}}
											className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-gray-50 text-left"
										>
											<div className="w-6 h-6 rounded-full bg-brand-500 text-neutral-surface flex items-center justify-center text-[10px] font-bold shrink-0">
												{`${p.first_name} ${p.last_name}`
													.split(" ")
													.map((n) => n[0])
													.join("")}
											</div>
											<span className="text-sm text-gray-700 font-medium truncate">
												{`${p.first_name} ${p.last_name}`}
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
				<Label className="text-xs text-neutral-border font-bold">WATCHER</Label>

				<div className="flex flex-wrap items-center gap-1.5 mt-1">
					{watcher ? (
						<div
							title={`${watcher.first_name} ${watcher.last_name}`}
							className="group relative inline-flex items-center justify-center w-7 h-7 rounded-full bg-emerald-500 text-neutral-surface text-[10px] font-bold shrink-0 select-none"
						>
							{`${watcher.first_name} ${watcher.last_name}`
								.split(" ")
								.map((n) => n[0])
								.join("")}

							<button
								type="button"
								onClick={() =>
									setTicket((t) => (t ? { ...t, watcher_id: null } : t))
								}
								className="absolute inset-0 rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-xs font-bold"
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
							className="text-xs text-brand-600 hover:bg-indigo-50 font-medium transition-colors border border-indigo-200 rounded-lg px-2 py-1"
						>
							{watcher ? "Change" : "+ Add"}
						</button>

						{showWatcherDropdown && (
							<div className="absolute left-0 top-full mt-1.5 z-20 w-52 bg-neutral-surface border border-gray-200 rounded-xl shadow-lg py-1.5 max-h-48 overflow-y-auto">
								<div className="text-[11px] font-semibold text-gray-400 px-3 py-1 uppercase tracking-wider">
									Select Watcher
								</div>
								{profiles.map((p) => (
									<button
										key={p.profile_id}
										type="button"
										onClick={() => {
											setTicket((t) =>
												t ? { ...t, watcher_id: p.profile_id } : t
											);
											setShowWatcherDropdown(false);
										}}
										className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-gray-50 text-left"
									>
										<div className="w-6 h-6 rounded-full bg-brand-500 text-neutral-surface flex items-center justify-center text-[10px] font-bold shrink-0">
											{`${p.first_name} ${p.last_name}`
												.split(" ")
												.map((n) => n[0])
												.join("")}
										</div>
										<span className="text-sm text-gray-700 font-medium truncate">
											{`${p.first_name} ${p.last_name}`}
										</span>
									</button>
								))}
							</div>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}

/* --- 4. API Details --- */
function TicketApiDetails({
	apiMethod,
	apiRoute,
	setApiMethod,
	setApiRoute,
}: {
	apiMethod: "GET" | "POST" | "PUT" | "DELETE";
	apiRoute: string;
	setApiMethod: (val: "GET" | "POST" | "PUT" | "DELETE") => void;
	setApiRoute: (val: string) => void;
}) {
	return (
		<div className="space-y-2">
			<Label className="text-xs text-neutral-border font-bold">API DETAILS</Label>
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
					className="w-full rounded-lg border border-gray-200 bg-neutral-surface px-2.5 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-500"
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
	);
}

/* --- 5. Schedule Grid --- */
function TicketSchedule({
	ticket,
	setTicket,
}: {
	ticket: Ticket;
	setTicket: React.Dispatch<React.SetStateAction<Ticket | null>>;
}) {
	return (
		<div className="space-y-2 pt-1">
			<Label className="text-xs text-neutral-border font-bold tracking-wider uppercase">
				SCHEDULE & TIMELINE DATES
			</Label>
			<div className="grid grid-cols-2 gap-4">
				{/* Planned Start */}
				<div className="space-y-1.5">
					<Label htmlFor="plan-start-date" className="text-xs text-neutral-border/75">
						PLANNED START
					</Label>
					<input
						id="plan-start-date"
						type="datetime-local"
						value={toInputDateTime(ticket.plan_start_at)}
						onChange={(e) => {
							const val = e.target.value ? new Date(e.target.value) : null;
							if (val) setTicket((t) => (t ? { ...t, plan_start_at: val } : t));
						}}
						className="h-9 w-full rounded-lg border border-gray-200 bg-neutral-surface px-2.5 py-1 text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
					/>
				</div>

				{/* Planned Finish / Deadline */}
				<div className="space-y-1.5">
					<Label htmlFor="plan-end-date" className="text-xs text-neutral-border/75">
						DEADLINE
					</Label>
					<input
						id="plan-end-date"
						type="datetime-local"
						value={toInputDateTime(ticket.plan_end_at)}
						onChange={(e) => {
							const val = e.target.value ? new Date(e.target.value) : null;
							if (val) setTicket((t) => (t ? { ...t, plan_end_at: val } : t));
						}}
						className="h-9 w-full rounded-lg border border-gray-200 bg-neutral-surface px-2.5 py-1 text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
					/>
				</div>

				{/* Actual Start */}
				<div className="space-y-1.5">
					<Label className="text-xs text-neutral-border/75">ACTUAL START</Label>
					{ticket.actual_start_at ? (
						<div className="h-9 w-full rounded-lg border border-gray-200 bg-gray-50/70 px-2.5 py-1 text-xs text-gray-700 flex items-center gap-2 select-none">
							<span>{formatDateTime(ticket.actual_start_at)}</span>
							<Calendar size={14} className="ml-auto text-gray-400 shrink-0" />
						</div>
					) : (
						<div className="h-9 w-full rounded-lg border border-dashed border-gray-300 bg-gray-50/50 px-2.5 py-1 text-xs text-gray-400 flex items-center gap-2 select-none">
							<span className="italic font-medium">Not started yet</span>
							<Calendar size={14} className="ml-auto text-gray-300 shrink-0" />
						</div>
					)}
				</div>

				{/* Actual Finish */}
				<div className="space-y-1.5">
					<Label className="text-xs text-neutral-border/75">FINISH</Label>
					{ticket.actual_end_at ? (
						<div className="h-9 w-full rounded-lg border border-gray-200 bg-gray-50/70 px-2.5 py-1 text-xs text-gray-700 flex items-center gap-2 select-none">
							<span>{formatDateTime(ticket.actual_end_at)}</span>
							<Calendar size={14} className="ml-auto text-gray-400 shrink-0" />
						</div>
					) : (
						<div className="h-9 w-full rounded-lg border border-dashed border-gray-300 bg-gray-50/50 px-2.5 py-1 text-xs text-gray-400 flex items-center gap-2 select-none">
							<span className="italic font-medium">Not finished yet</span>
							<Calendar size={14} className="ml-auto text-gray-300 shrink-0" />
						</div>
					)}
				</div>
			</div>
			<div className="space-y-1.5">
				<Label className="text-xs text-neutral-border/75">LINKED ISSUE</Label>

				{/** Ternary Operation to check if issue there? If here, then: */}
				<div className="h-9 w-full rounded-lg border border-red-200 bg-red-50/70 px-2.5 py-1 text-xs text-gray-700 flex items-center gap-2 select-none">
					<Bug size={14} className=" text-red-400 shrink-0" />
					<span className="font-semibold text-red-500">Linked Issue Title Here</span> 
				</div>
				{/** Ternary Operation to check if issue there? If not, then use this: */}
				{/* <div className="h-9 w-full rounded-lg border border-gray-200 bg-gray-50/70 px-2.5 py-1 text-xs text-gray-700 flex items-center gap-2 select-none">
					<Bug size={14} className=" text-gray-400 shrink-0" />
					<span className="font-semibold text-gray-500">Linked Issue Title Here</span> 
				</div> */}
				{/** Commented out to prevent redundancy */}
			</div>
		</div>
	);
}

/* --- 6. Description --- */
function TicketDescription({
	ticket,
	setTicket,
}: {
	ticket: Ticket;
	setTicket: React.Dispatch<React.SetStateAction<Ticket | null>>;
}) {
	return (
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
	);
}

/* --- 7. Attachments --- */
function TicketAttachments({
	images,
	onImageClick,
}: {
	images: { image_id: string; image_src: string }[];
	onImageClick: (src: string) => void;
}) {
	if (!images || images.length === 0) return null;

	return (
		<div className="px-5 mt-5">
			<p className="text-sm font-semibold text-neutral-border mb-2 uppercase tracking-wider">
				Attachments
			</p>
			<div className="flex flex-wrap gap-2">
				{images.map((img) => (
					<img
						key={img.image_id}
						src={img.image_src}
						alt="Ticket attachment"
						className="h-16 w-auto rounded-lg border border-gray-200 object-cover cursor-pointer hover:opacity-80 transition-opacity"
						onClick={() => onImageClick(img.image_src)}
					/>
				))}
			</div>
		</div>
	);
}

/* --- 8. Activity Log & Comments --- */
function TicketActivitySection({
	ticketId,
	comments,
	currentUser,
	onImageClick,
}: {
	ticketId: string;
	comments: any[];
	currentUser: ProfileType | null;
	onImageClick: (src: string) => void;
}) {
	const [activeTab, setActiveTab] = useState<"all" | "comments" | "history">("all");
	const [commentText, setCommentText] = useState("");
	const [commentImages, setCommentImages] = useState<File[]>([]);
	const [commentImagePreviews, setCommentImagePreviews] = useState<string[]>([]);
	const [commentError, setCommentError] = useState<string | null>(null);
	const [isSubmitting, setIsSubmitting] = useState(false);

	const commentImageRef = useRef<HTMLInputElement>(null);
	const createCommentMutation = useCreateComment();

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

			if (!user) throw new Error("You must be logged in to post a comment.");

			const imageUrls: string[] = [];

			if (commentImages.length > 0) {
				for (const file of commentImages) {
					const fileExt = file.name.split(".").pop();
					const fileName = `${crypto.randomUUID()}.${fileExt}`;
					const filePath = `comments/${fileName}`;

					const { error } = await supabase.storage
						.from("images")
						.upload(filePath, file, { cacheControl: "3600", upsert: false });

					if (error)
						throw new Error(`Failed to upload ${file.name}: ${error.message}`);

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
				parent_id: ticketId,
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
		<div>
			{/* Activity Header Tabs */}
			<div className="px-5 border-b border-gray-200 my-4">
				<Label className="text-md text-neutral-border font-bold tracking-wider uppercase">
					ACTIVITY
				</Label>
				<div className="flex gap-3 text-xs mt-1">
					{(["all", "comments", "history"] as const).map((tab) => (
						<button
							key={tab}
							type="button"
							onClick={() => setActiveTab(tab)}
							className={`relative py-2 font-medium uppercase transition-colors ${
								activeTab === tab
									? "text-brand-600 font-semibold"
									: "text-gray-500 hover:text-gray-700"
							}`}
						>
							{tab}
							{activeTab === tab && (
								<span className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-600 rounded-full" />
							)}
						</button>
					))}
				</div>
			</div>

			{/* History Tab Content */}
			{(activeTab === "history" || activeTab === "all") && (
				<TicketHistoryLog ticketId={ticketId} />
			)}

			{/* Comments Content */}
			{(activeTab === "comments" || activeTab === "all") && (
				<div className="px-5 pb-5">
					{/* Posted Comments */}
					{comments.length > 0 && (
						<div className="space-y-3 mb-4">
							{comments.map((comment) => (
								<div key={comment.comment_id} className="flex gap-2.5">
									<div className="w-7 h-7 rounded-full bg-brand-500 flex items-center justify-center text-[10px] font-bold text-neutral-surface shrink-0 mt-0.5">
										{getInitials(
											`${comment.Profile?.first_name ?? ""} ${
												comment.Profile?.last_name ?? ""
											}`
										)}
									</div>
									<div className="flex-1 min-w-0">
										<div className="bg-neutral-surface border-brand-100 border rounded-lg px-3 py-2.5">
											{comment.images && comment.images.length > 0 && (
												<div className="flex flex-wrap gap-2 mb-2">
													{comment.images.map((img: any) => (
														<img
															key={img.image_id}
															src={img.image_src}
															alt="attachment"
															className="max-h-40 rounded-md object-contain cursor-pointer hover:opacity-80 transition-opacity"
															onClick={() => onImageClick(img.image_src)}
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
											{new Date(comment.creation_date).toLocaleTimeString([], {
												hour: "2-digit",
												minute: "2-digit",
											})}
										</p>
									</div>
								</div>
							))}
						</div>
					)}

					{/* New Comment Input Box */}
					<div className="flex gap-2 w-full">
						<div className="w-7 h-7 rounded-full bg-brand-500 flex items-center justify-center text-[10px] font-bold text-neutral-surface shrink-0 mt-0.5">
							{getInitials(
								`${currentUser?.first_name ?? ""} ${currentUser?.last_name ?? ""}`
							)}
						</div>
						<div className="w-full border border-brand-100 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-brand-500 transition-shadow">
							{commentImagePreviews.length > 0 && (
								<div className="px-3 pt-2.5 flex flex-wrap gap-2">
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
												className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-gray-800 text-white flex items-center justify-center text-[10px] hover:bg-red-600"
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

							<div className="flex items-center justify-between px-3 py-2 border-t border-gray-100 bg-brand-50">
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
								<div className="flex items-center gap-2">
									{commentError && (
										<p className="text-xs text-destructive">{commentError}</p>
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
				</div>
			)}
		</div>
	);
}

/* --- 9. Footer --- */
function TicketFooter({
	onClose,
	onSave,
}: {
	onClose: () => void;
	onSave: () => void;
}) {
	return (
		<div className="fixed bottom-0 right-0 w-[40rem] flex items-center justify-end gap-3 px-5 py-3.5 border-t border-gray-100 shrink-0 bg-neutral-surface z-50">
			<button
				type="button"
				onClick={onClose}
				className="text-sm font-medium text-gray-500 px-4 py-2 rounded-lg hover:bg-gray-100"
			>
				Cancel
			</button>
			<button
				type="button"
				onClick={onSave}
				className="text-sm font-semibold text-neutral-surface bg-brand-600 hover:bg-indigo-700 px-4 py-2 rounded-lg transition-colors"
			>
				Save Changes
			</button>
		</div>
	);
}