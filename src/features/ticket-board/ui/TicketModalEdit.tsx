"use client";

import { useState, useEffect } from "react";
import { Ticket, Tag } from "@/entities/types";
import { CommentParentType, status as StatusEnum } from "@/lib/generated/prisma";
import { ProfileType } from "@/shared/types";

import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { FormInput } from "@/components/ui/forminput";
import { Input } from "@/components/ui/input";
import { DateTimePicker } from "@/components/ui/datetime-picker";
import { TagBadge } from "@/entities/tag/ui/TagBadge";

import {
	DropdownMenu,
	DropdownMenuTrigger,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuCheckboxItem,
	DropdownMenuRadioGroup,
	DropdownMenuRadioItem,
	DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";

import { useAuth } from "@/features/auth";
import { useProfiles } from "@/entities/profile/queries";
import { useTicketComments, useTicketImages } from "@/entities/comment/queries";
import { useCreateComment } from "@/entities/comment/mutations";
import { useUpdateTicket } from "@/entities/ticket/mutations";
import { createClient } from "@/lib/supabase/client";

import { getInitials } from "@/shared/lib/strings";
import ImageLightbox from "@/shared/ui/ImageLightbox";
import TicketHistoryLog from "./TicketHistoryLog";

// Issue Reporting Imports
import IssueTableModal from "@/features/issue-reporting/ui/IssueTableModal";
import type { IssueItem } from "@/features/issue-reporting/ui/IssueDashboard";

import { Calendar, X, Paperclip, Pencil, ChevronDown, Bug, Plus } from "lucide-react";

// ==========================================
// CONSTANTS & HELPERS
// ==========================================

const STATUS_CONFIG: Record<StatusEnum, { label: string; dotClass: string; textClass: string }> = {
	PENDING: { label: "Pending", dotClass: "bg-yellow-500", textClass: "text-yellow-600" },
	IN_PROGRESS: { label: "In Progress", dotClass: "bg-brand-500", textClass: "text-brand-600" },
	FINISHED: { label: "Finished", dotClass: "bg-green-500", textClass: "text-green-600" },
};

const STATUSES = [StatusEnum.PENDING, StatusEnum.IN_PROGRESS, StatusEnum.FINISHED];

function UserAvatar({ name, color = "bg-brand-500", size = "w-7 h-7 text-[10px]" }: { name: string; color?: string; size?: string }) {
	return (
		<div className={`${size} ${color} rounded-full text-neutral-surface font-bold flex items-center justify-center shrink-0 select-none`}>
			{getInitials(name)}
		</div>
	);
}

// Helper to derive dynamic colors based on status & urgency
function getLinkedIssueStyle(issue: IssueItem | null) {
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
        box: "border-orange-200 bg-orange-50/70 hover:bg-orange-100/80 text-gray-700",
        icon: "text-orange-500",
        text: "font-semibold text-orange-600",
        close: "text-orange-400 hover:text-orange-600",
      };

    case "low":
      return {
        box: "border-yellow-200 bg-yellow-50/70 hover:bg-yellow-100/80 text-gray-700",
        icon: "text-yellow-500",
        text: "font-semibold text-yellow-600",
        close: "text-yellow-500 hover:text-yellow-700",
      };

    default:
      return {
        box: "border-gray-200 bg-gray-50/70 hover:bg-gray-100/80 text-gray-700",
        icon: "text-gray-500",
        text: "font-semibold text-gray-700",
        close: "text-gray-400 hover:text-gray-600",
      };
  }
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
	const [apiMethod, setApiMethod] = useState<"GET" | "POST" | "PUT" | "DELETE">("GET");
	const [apiRoute, setApiRoute] = useState("");
	const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);

	const { user } = useAuth();
	const { data: profiles = [] } = useProfiles();
	const { data: comments = [] } = useTicketComments(ticket?.ticket_id);
	const { data: ticketImages = [] } = useTicketImages(ticket?.ticket_id);
	const updateTicketMutation = useUpdateTicket();

	useEffect(() => {
		if (!isOpen) return;
		setTicket(initialTicket);
		setSelectedTags(initialTicket?.TicketTags?.map((t: { tag_id: string }) => t.tag_id) ?? []);
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
				className={`fixed inset-0 bg-foreground/30 z-40 transition-opacity duration-300 ${isOpen ? "opacity-100" : "opacity-0 pointer-events-none"}`}
				onClick={onClose}
			/>

			{/* Modal Panel */}
			<div
				className={`fixed top-0 right-0 h-full w-[40rem] bg-neutral-surface shadow-2xl z-50 flex flex-col transition-transform duration-300 ease-in-out ${isOpen ? "translate-x-0" : "translate-x-full"}`}
			>
				{/* 1. Header */}
				<div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-gray-100 shrink-0">
					<span className="font-mono text-sm text-brand-500">LRN-BNN</span>
					<Button variant="ghost" size="icon-sm" onClick={onClose}>
						<X className="text-neutral-border hover:text-foreground transition-all duration-300" />
					</Button>
				</div>

				{/* 2. Title, Status & Tags */}
				<TicketTitleAndStatus ticket={ticket} tags={tags} selectedTags={selectedTags} setTicket={setTicket} setSelectedTags={setSelectedTags} />

				{/* SCROLLABLE BODY */}
				<div className="flex-1 overflow-y-auto [scrollbar-gutter:stable]">
					<div className="px-5 py-4 flex flex-col gap-4 border-b border-gray-100">
						{/* 3. Assignees & Watchers */}
						<TicketAssignees ticket={ticket} profiles={profiles} setTicket={setTicket} />

						{/* 4. API Details */}
						{isApiTagSelected && <TicketApiDetails apiMethod={apiMethod} apiRoute={apiRoute} setApiMethod={setApiMethod} setApiRoute={setApiRoute} />}

						{/* 5. Schedule Dates & Linked Issue */}
						<TicketSchedule ticket={ticket} setTicket={setTicket} />
					</div>

					{/* 6. Description */}
					<div className="px-5 py-4 border-b border-gray-100">
						<Label className="text-md -mb-4 text-neutral-border font-bold tracking-wider uppercase">DESCRIPTION</Label>
						<FormInput
							variant="textarea"
							label=""
							maxLength={360}
							rows={4}
							value={ticket.description ?? ""}
							placeholder="Add a description..."
							onChange={(e) => setTicket((t) => (t ? { ...t, description: e.target.value } : t))}
						/>
					</div>

					{/* Subtasks */}
					<div className="px-5 mt-3">
						<div className="flex justify-between">
							<Label className="text-md text-neutral-border font-bold tracking-wider uppercase">SUBTASKS</Label>
							<span className="text-sm text-neutral-border/75">1 of 2 complete</span>
						</div>
						<div className="flex flex-col gap-3 max-h-85 overflow-auto select-none mt-2">
							<div className="drop-shadow-md rounded-lg p-2 bg-neutral-surface flex flex-col border border-brand-100">
								<span className="font-mono text-sm text-brand-500">LRN-BNN</span>
								<span className="font-semibold text-lg">Lorens Banana Recipe for Rogers</span>
								<div className="flex items-center gap-2 text-sm font-bold text-neutral-border">
									<Calendar size={12} strokeWidth={3} />
									<span>Lorens Banana</span>
								</div>
							</div>
						</div>
					</div>

					{/* Attachments */}
					{ticketImages.length > 0 && (
						<div className="px-5 mt-5">
							<p className="text-sm font-semibold text-neutral-border mb-2 uppercase tracking-wider">Attachments</p>
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

					{/* Activity (Logs & Comments) */}
					<TicketActivitySection ticketId={ticket.ticket_id} comments={comments} currentUser={user} onImageClick={setLightboxSrc} />
					<div className="h-16" />
				</div>

				{/* Footer */}
				<div className="fixed bottom-0 right-0 w-[40rem] flex items-center justify-end gap-3 px-5 py-3.5 border-t border-gray-100 shrink-0 bg-neutral-surface z-50">
					<button type="button" onClick={onClose} className="text-sm font-medium text-gray-500 px-4 py-2 rounded-lg hover:bg-gray-100">
						Cancel
					</button>
					<button type="button" onClick={handleSave} className="text-sm font-semibold text-neutral-surface bg-brand-600 hover:bg-indigo-700 px-4 py-2 rounded-lg transition-colors">
						Save Changes
					</button>
				</div>
			</div>

			{/* Lightbox */}
			{lightboxSrc && <ImageLightbox src={lightboxSrc} onClose={() => setLightboxSrc(null)} />}
		</>
	);
}

// ==========================================
// SUB-COMPONENTS
// ==========================================

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
	const currentStatusConfig = STATUS_CONFIG[ticket.status] ?? STATUS_CONFIG.PENDING;

	function setStatus(val: StatusEnum) {
		setTicket((t) => {
			if (!t) return t;
			const now = new Date();
			return {
				...t,
				status: val,
				actual_start_at: (val === StatusEnum.IN_PROGRESS || val === StatusEnum.FINISHED) && !t.actual_start_at ? now : t.actual_start_at,
				actual_end_at: val === StatusEnum.FINISHED ? (t.actual_end_at ?? now) : val === StatusEnum.PENDING ? null : t.actual_end_at,
			};
		});
	}

	const toggleTag = (tagId: string) =>
		setSelectedTags((prev) => (prev.includes(tagId) ? prev.filter((t) => t !== tagId) : [...prev, tagId]));

	return (
		<div className="flex flex-col gap-3 px-5 py-3.5 border-b border-gray-100 shrink-0 relative">
			<div className="flex items-center justify-between gap-3 max-w-full">
				<div className="inline-flex items-center gap-2 max-w-full min-w-0 flex-1">
					<input
						type="text"
						value={ticket.name}
						maxLength={50}
						onChange={(e) => setTicket((t) => (t ? { ...t, name: e.target.value } : t))}
						placeholder="Ticket title..."
						className="-ml-1 text-ellipsis text-2xl font-bold text-gray-900 bg-transparent border border-transparent hover:border-gray-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 focus:outline-none rounded-md px-1.5 py-0.5 leading-tight placeholder:text-gray-300 max-w-[calc(100%-2rem)] [field-sizing:content]"
					/>
					<Pencil size={16} className="text-gray-400 shrink-0 pointer-events-none" />
				</div>

				{/* Status Dropdown Modal */}
				<DropdownMenu>
					<DropdownMenuTrigger className="flex items-center gap-1 bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1 select-none cursor-pointer focus:outline-none shrink-0">
						<span className={`h-2.5 w-2.5 rounded-full shrink-0 ${currentStatusConfig.dotClass}`} />
						<span className={`text-xs font-semibold ${currentStatusConfig.textClass}`}>{currentStatusConfig.label}</span>
						<ChevronDown size={12} className="text-brand-600 ml-1" />
					</DropdownMenuTrigger>
					<DropdownMenuContent className="w-44" align="end">
						<DropdownMenuGroup>
							<DropdownMenuLabel className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-2 py-1">
								Select Status
							</DropdownMenuLabel>
							<DropdownMenuRadioGroup value={ticket.status} onValueChange={(val) => setStatus(val as StatusEnum)}>
								{STATUSES.map((s) => {
									const config = STATUS_CONFIG[s];
									return (
										<DropdownMenuRadioItem key={s} value={s} className="cursor-pointer">
											<span className="flex items-center gap-2">
												<span className={`h-2 w-2 rounded-full ${config.dotClass}`} />
												<span className={`text-sm font-medium ${config.textClass}`}>{config.label}</span>
											</span>
										</DropdownMenuRadioItem>
									);
								})}
							</DropdownMenuRadioGroup>
						</DropdownMenuGroup>
					</DropdownMenuContent>
				</DropdownMenu>
			</div>

			{/* Tags Section with Dropdown Modal (Add Tags aligned to the far right) */}
			<div className="flex items-center justify-between gap-2 w-full">
				<div className="flex flex-wrap gap-1.5 items-center flex-1">
					{selectedTags.map((tag_id) => {
						const tag = tags.find((t) => t.tag_id === tag_id);
						return tag ? <TagBadge key={tag_id} hover className="hover:!bg-neutral-border" tag={tag} onClick={() => toggleTag(tag.tag_id)} /> : null;
					})}
				</div>

				<DropdownMenu>
					<DropdownMenuTrigger className="text-xs text-brand-600 hover:text-indigo-700 font-medium px-2 py-1 rounded-lg border border-indigo-200 hover:bg-indigo-50 transition-colors focus:outline-none shrink-0 ml-auto">
						+ Add Tags
					</DropdownMenuTrigger>
					<DropdownMenuContent className="w-64 max-h-52 overflow-y-auto" align="end">
						<DropdownMenuGroup>
							<DropdownMenuLabel className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-2 py-1">
								SELECT TAGS
							</DropdownMenuLabel>
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
						</DropdownMenuGroup>
					</DropdownMenuContent>
				</DropdownMenu>
			</div>
		</div>
	);
}

function TicketAssignees({
	ticket,
	profiles,
	setTicket,
}: {
	ticket: Ticket;
	profiles: ProfileType[];
	setTicket: React.Dispatch<React.SetStateAction<Ticket | null>>;
}) {
	const availableProfiles = profiles.filter((u) => !ticket.TicketAssigned.some((a) => a.profile_id === u.profile_id));
	const watcher = profiles.find((u) => u.profile_id === ticket.watcher_id);
	const hasAssignees = (ticket.TicketAssigned?.length ?? 0) > 0;

	return (
		<div className="grid grid-cols-2 gap-x-6 gap-y-4 items-start">
			{/* Assigned To Dropdown Modal */}
			<div>
				<div className="flex items-center gap-2 mb-1.5 h-8">
					<Label className="my-auto text-xs text-neutral-border font-bold">ASSIGNED TO</Label>
					{availableProfiles.length > 0 && (
						<DropdownMenu>
							<DropdownMenuTrigger className="text-2xs text-brand-600 hover:bg-indigo-50 font-medium transition-colors border border-indigo-200 rounded px-1.5 focus:outline-none inline-flex items-center justify-center gap-1 leading-none">
								<Plus className="w-3 h-3 stroke-[2.5]" /><span>Add</span>
							</DropdownMenuTrigger>
							<DropdownMenuContent className="w-52 max-h-52 overflow-y-auto" align="start">
								<DropdownMenuGroup>
									<DropdownMenuLabel className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-2 py-1">
										Select Assignee
									</DropdownMenuLabel>
									{availableProfiles.map((p) => (
										<DropdownMenuItem
											key={p.profile_id}
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
											}}
											className="cursor-pointer"
										>
											<span className="flex items-center gap-2 truncate">
												<UserAvatar name={`${p.first_name} ${p.last_name}`} size="w-6 h-6 text-[10px]" />
												<span className="text-sm text-gray-700 font-medium truncate">{`${p.first_name} ${p.last_name}`}</span>
											</span>
										</DropdownMenuItem>
									))}
								</DropdownMenuGroup>
							</DropdownMenuContent>
						</DropdownMenu>
					)}
				</div>

				<div className="flex flex-wrap items-center gap-1.5">
					{hasAssignees ? (
						ticket.TicketAssigned.map((a) => {
							const fullName = `${a.Profile?.first_name ?? "Unknown"} ${a.Profile?.last_name ?? "User"}`.trim();
							return (
								<div key={a.profile_id} title={fullName} className="group relative inline-flex items-center justify-center shrink-0">
									<UserAvatar name={fullName} />
									<button
										type="button"
										onClick={() => setTicket((t) => (t ? { ...t, TicketAssigned: t.TicketAssigned.filter((x) => x.profile_id !== a.profile_id) } : t))}
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
				</div>
			</div>

			{/* Watcher Dropdown Modal */}
			<div>
				<div className="flex items-center gap-2 mb-1.5 h-8">
					<Label className="my-auto text-xs text-neutral-border font-bold">WATCHER</Label>
					<DropdownMenu>
						<DropdownMenuTrigger className="text-2xs text-brand-600 hover:bg-indigo-50 font-medium transition-colors border border-indigo-200 rounded px-1.5 py-0.5 focus:outline-none inline-flex items-center justify-center gap-1 leading-none">
							<Plus className="w-3 h-3 stroke-[2.5]" />
							<span>Assign</span>
						</DropdownMenuTrigger>
						<DropdownMenuContent className="w-52 max-h-52 overflow-y-auto" align="start">
							<DropdownMenuGroup>
								<DropdownMenuLabel className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-2 py-1">
									Select Watcher
								</DropdownMenuLabel>
								<DropdownMenuItem
									onClick={() => setTicket((t) => (t ? { ...t, watcher_id: null } : t))}
									className="cursor-pointer text-xs text-gray-400"
								>
									None
								</DropdownMenuItem>
								{profiles.map((p) => (
									<DropdownMenuItem
										key={p.profile_id}
										onClick={() => setTicket((t) => (t ? { ...t, watcher_id: p.profile_id } : t))}
										className="cursor-pointer"
									>
										<span className="flex items-center gap-2 truncate">
											<UserAvatar name={`${p.first_name} ${p.last_name}`} size="w-6 h-6 text-[10px]" color="bg-emerald-500" />
											<span className="text-sm text-gray-700 font-medium truncate">{`${p.first_name} ${p.last_name}`}</span>
										</span>
									</DropdownMenuItem>
								))}
							</DropdownMenuGroup>
						</DropdownMenuContent>
					</DropdownMenu>
				</div>

				<div className="flex flex-wrap items-center gap-1.5 h-8 ">
					{watcher ? (
						<div title={`${watcher.first_name} ${watcher.last_name}`} className="group relative inline-flex items-center justify-center shrink-0 gap-2">
							<UserAvatar name={`${watcher.first_name} ${watcher.last_name}`} color="bg-emerald-500" />
							<button
								type="button"
								onClick={() => setTicket((t) => (t ? { ...t, watcher_id: null } : t))}
								className="absolute inset-0 rounded-full bg-black/30 p-3 text-white opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-xs font-bold"
								title={`Remove ${watcher.first_name} ${watcher.last_name}`}
							>
								✕
							</button>
							<span className="text-sm text-neutral-border">{`${watcher.first_name} ${watcher.last_name}`}</span>
						</div>
					) : (
						<span className="text-sm text-gray-400">Unassigned</span>
					)}
				</div>
			</div>
		</div>
	);
}

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
					<span className="text-xs font-mono text-green-400 font-bold">{apiMethod}</span>
					<span className="text-xs font-mono text-indigo-300">{apiRoute}</span>
				</div>
			)}
			<div className="grid grid-cols-[110px_1fr] gap-3">
				<select
					value={apiMethod}
					onChange={(e) => setApiMethod(e.target.value as "GET" | "POST" | "PUT" | "DELETE")}
					className="w-full rounded-lg border border-gray-200 bg-neutral-surface px-2.5 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-500"
				>
					{["GET", "POST", "PUT", "DELETE"].map((m) => (
						<option key={m}>{m}</option>
					))}
				</select>
				<Input placeholder="/api/v1/resource" value={apiRoute} onChange={(e) => setApiRoute(e.target.value)} />
			</div>
		</div>
	);
}

function TicketSchedule({
	ticket,
	setTicket,
}: {
	ticket: Ticket;
	setTicket: React.Dispatch<React.SetStateAction<Ticket | null>>;
}) {
	const [isIssueModalOpen, setIsIssueModalOpen] = useState(false);
	const [linkedIssue, setLinkedIssue] = useState<IssueItem | null>(null);

	const handleSelectIssue = (issue: IssueItem) => {
		setLinkedIssue(issue);
		setTicket((t) => (t ? { ...t, issue_id: issue.id } : t));
	};

	return (
		<div className="space-y-2 pt-1">
			<Label className="text-xs text-neutral-border font-bold tracking-wider uppercase">SCHEDULE & TIMELINE DATES</Label>
			<div className="grid grid-cols-2 gap-4">
				{/* Planned Start */}
				<div>
					<Label className="text-xs text-neutral-border/75">PLANNED START</Label>
					<DateTimePicker
						value={ticket.plan_start_at ? new Date(ticket.plan_start_at) : undefined}
						onChange={(date) =>
							setTicket((t) => (t ? { ...t, plan_start_at: date ?? t.plan_start_at } : t))
						}
						placeholder="Pick planned start date"
						className="h-9 text-xs"
					/>
				</div>

				{/* Deadline */}
				<div>
					<Label className="text-xs text-neutral-border/75">DEADLINE</Label>
					<DateTimePicker
						value={ticket.plan_end_at ? new Date(ticket.plan_end_at) : undefined}
						onChange={(date) =>
							setTicket((t) => (t ? { ...t, plan_end_at: date ?? t.plan_end_at } : t))
						}
						placeholder="Pick deadline"
						className="h-9 text-xs"
					/>
				</div>

				{/* Actual Start (Disabled) */}
				<div>
					<Label className="text-xs text-neutral-border/75">ACTUAL START</Label>
					<DateTimePicker
						value={ticket.actual_start_at ? new Date(ticket.actual_start_at) : undefined}
						disabled
						placeholder="Not started yet"
						className="h-9 text-xs"
					/>
				</div>

				{/* Finish / Actual End (Disabled) */}
				<div>
					<Label className="text-xs text-neutral-border/75">FINISH</Label>
					<DateTimePicker
						value={ticket.actual_end_at ? new Date(ticket.actual_end_at) : undefined}
						disabled
						placeholder="Not finished yet"
						className="h-9 text-xs"
					/>
				</div>
			</div>

			{/* Linked Issue Box */}
			<div>
				<Label className="text-xs text-neutral-border/75">LINKED ISSUE</Label>
				{(() => {
					const style = getLinkedIssueStyle(linkedIssue);
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
										setTicket((t) => (t ? { ...t, issue_id: null } : t));
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

			{/* Issue Table Modal */}
			<IssueTableModal
				open={isIssueModalOpen}
				onOpenChange={setIsIssueModalOpen}
				onSelectIssue={handleSelectIssue}
			/>
		</div>
	);
}

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
			if (commentImages.length > 0) setCommentError("Add some text to go with your image.");
			return;
		}
		setCommentError(null);

		try {
			setIsSubmitting(true);
			const supabase = createClient();
			const { data: { user } } = await supabase.auth.getUser();
			if (!user) throw new Error("You must be logged in to post a comment.");

			const imageUrls: string[] = [];
			for (const file of commentImages) {
				const fileExt = file.name.split(".").pop();
				const fileName = `${crypto.randomUUID()}.${fileExt}`;
				const filePath = `comments/${fileName}`;

				const { error } = await supabase.storage.from("images").upload(filePath, file, { cacheControl: "3600", upsert: false });
				if (error) throw new Error(`Failed to upload ${file.name}: ${error.message}`);

				const { data: { publicUrl } } = supabase.storage.from("images").getPublicUrl(filePath);
				imageUrls.push(publicUrl);
			}

			await createCommentMutation.mutateAsync({
				profile_id: user.id,
				description: commentText,
				parent_type: CommentParentType.TICKET_COMMENT,
				parent_id: ticketId,
				imageUrls,
			});

			setCommentText("");
			setCommentImages([]);
			setCommentImagePreviews([]);
		} catch (error) {
			console.error("Error adding comment:", error);
		} finally {
			setIsSubmitting(false);
		}
	}

	return (
		<div>
			<div className="px-5 border-b border-gray-200 my-4">
				<Label className="text-md text-neutral-border font-bold tracking-wider uppercase">ACTIVITY</Label>
				<div className="flex gap-3 text-xs mt-1">
					{(["all", "comments", "history"] as const).map((tab) => (
						<button
							key={tab}
							type="button"
							onClick={() => setActiveTab(tab)}
							className={`relative py-2 font-medium uppercase transition-colors ${activeTab === tab ? "text-brand-600 font-semibold" : "text-gray-500 hover:text-gray-700"}`}
						>
							{tab}
							{activeTab === tab && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-600 rounded-full" />}
						</button>
					))}
				</div>
			</div>

			{(activeTab === "history" || activeTab === "all") && <TicketHistoryLog ticketId={ticketId} />}

			{(activeTab === "comments" || activeTab === "all") && (
				<div className="px-5 pb-5">
					{comments.length > 0 && (
						<div className="space-y-3 mb-4">
							{comments.map((comment) => (
								<div key={comment.comment_id} className="flex gap-2.5">
									<UserAvatar name={`${comment.Profile?.first_name ?? ""} ${comment.Profile?.last_name ?? ""}`} />
									<div className="flex-1 min-w-0">
										<div className="bg-neutral-surface border-brand-100 border rounded-lg px-3 py-2.5">
											{comment.images?.length > 0 && (
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
											{comment.description && <p className="text-sm text-gray-700 leading-relaxed">{comment.description}</p>}
										</div>
										<p className="text-xs text-gray-400 mt-1">{new Date(comment.creation_date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</p>
									</div>
								</div>
							))}
						</div>
					)}

					<div className="flex gap-2 w-full">
						<UserAvatar name={`${currentUser?.first_name ?? ""} ${currentUser?.last_name ?? ""}`} />
						<div className="w-full border border-brand-100 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-brand-500 transition-shadow">
							{commentImagePreviews.length > 0 && (
								<div className="px-3 pt-2.5 flex flex-wrap gap-2">
									{commentImagePreviews.map((preview, idx) => (
										<div key={idx} className="relative inline-block">
											<img src={preview} alt={`Preview ${idx + 1}`} className="h-16 w-auto rounded-md border border-gray-200 object-cover" />
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
									if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) handleAddComment();
								}}
								placeholder="Add a comment... (Ctrl+Enter to post)"
								rows={2}
								className="w-full px-3 py-2.5 text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none resize-none bg-transparent"
							/>

							<div className="flex items-center justify-between px-3 py-2 border-t border-gray-100 bg-brand-50">
								<label className="cursor-pointer text-gray-400 hover:text-brand-500 transition-colors" title="Attach images (jpg, png · Max 5MB)">
									<Paperclip size={16} />
									<input type="file" accept="image/jpeg,image/png" multiple onChange={handleCommentImageChange} className="sr-only" />
								</label>
								<div className="flex items-center gap-2">
									{commentError && <p className="text-xs text-destructive">{commentError}</p>}
									<button
										type="button"
										onClick={handleAddComment}
										disabled={(!commentText.trim() && commentImages.length === 0) || isSubmitting}
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