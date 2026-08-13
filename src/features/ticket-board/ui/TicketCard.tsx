"use client";

import { useState } from "react";
import { useDraggable } from "@dnd-kit/core";

import { type Ticket } from "@/entities/types";
import { Calendar, ChevronDown, X } from "lucide-react";
import { status } from "@/lib/generated/prisma";
import { getInitials } from "@/shared/lib/strings";
import { cn } from "@/lib/utils";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
	AlertDialog,
	AlertDialogContent,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogCancel,
	AlertDialogAction,
} from "@/components/ui/alert-dialog";

/**
 * Generates 3 dummy subtasks for UI demonstration when subTickets is not provided.
 */
function getDummySubtasks(parentTicket: Ticket): Ticket[] {
	if (parentTicket.subTickets && parentTicket.subTickets.length > 0) {
		return parentTicket.subTickets as Ticket[];
	}

	const baseDate = parentTicket.plan_start_at
		? new Date(parentTicket.plan_start_at)
		: new Date();
	const endDate = parentTicket.plan_end_at
		? new Date(parentTicket.plan_end_at)
		: new Date(Date.now() + 86400000 * 3);

	return [
		{
			ticket_id: `${parentTicket.ticket_id}-sub-1`,
			assignment_date: baseDate,
			actual_end_at: new Date(),
			plan_end_at: endDate,
			name: `${parentTicket.name} — Subtask 1: Spec & Design`,
			description: "Requirements gathering and initial technical specification.",
			status: status.FINISHED,
			workflow_id: parentTicket.workflow_id,
			is_deleted: false,
			deleted_at: null,
			watcher_id: parentTicket.watcher_id,
			api_route: null,
			api_method: null,
			plan_start_at: baseDate,
			actual_start_at: baseDate,
			parent_id: parentTicket.ticket_id,
			issue_id: null,
			TicketTags: parentTicket.TicketTags ?? [],
			TicketAssigned: parentTicket.TicketAssigned ?? [],
			Profile: parentTicket.Profile ?? null,
		},
		{
			ticket_id: `${parentTicket.ticket_id}-sub-2`,
			assignment_date: baseDate,
			actual_end_at: null,
			plan_end_at: endDate,
			name: `${parentTicket.name} — Subtask 2: Implementation`,
			description: "Core logic development and component integration.",
			status: status.IN_PROGRESS,
			workflow_id: parentTicket.workflow_id,
			is_deleted: false,
			deleted_at: null,
			watcher_id: parentTicket.watcher_id,
			api_route: null,
			api_method: null,
			plan_start_at: baseDate,
			actual_start_at: new Date(),
			parent_id: parentTicket.ticket_id,
			issue_id: null,
			TicketTags: parentTicket.TicketTags ?? [],
			TicketAssigned: parentTicket.TicketAssigned ?? [],
			Profile: parentTicket.Profile ?? null,
		},
		{
			ticket_id: `${parentTicket.ticket_id}-sub-3`,
			assignment_date: baseDate,
			actual_end_at: null,
			plan_end_at: endDate,
			name: `${parentTicket.name} — Subtask 3: Testing & Review`,
			description: "Unit testing, peer review, and staging verification.",
			status: status.PENDING,
			workflow_id: parentTicket.workflow_id,
			is_deleted: false,
			deleted_at: null,
			watcher_id: parentTicket.watcher_id,
			api_route: null,
			api_method: null,
			plan_start_at: baseDate,
			actual_start_at: null,
			parent_id: parentTicket.ticket_id,
			issue_id: null,
			TicketTags: parentTicket.TicketTags ?? [],
			TicketAssigned: parentTicket.TicketAssigned ?? [],
			Profile: parentTicket.Profile ?? null,
		},
	];
}

/**
 * Renders the internal visual contents, layout, and contextual menus of a single ticket or subtask.
 */
export function TicketCardContent({
	ticket,
	onSelect,
	onEdit,
	onDelete,
	isSubtask = false,
}: {
	ticket: Ticket;
	onSelect: (ticket: Ticket) => void;
	onEdit: (ticket: Ticket) => void;
	onDelete: (ticketId: string) => void;
	isSubtask?: boolean;
}) {
	const [isExpanded, setIsExpanded] = useState(false);
	const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

	const subtasks = isSubtask ? [] : getDummySubtasks(ticket);

	const today = new Date();
	today.setHours(0, 0, 0, 0);

	const startDate = ticket.plan_start_at ? new Date(ticket.plan_start_at) : null;
	const endDate = ticket.plan_end_at ? new Date(ticket.plan_end_at) : null;
	const actualEndDate = ticket.actual_end_at ? new Date(ticket.actual_end_at) : null;

	const isCompleted =
		ticket.status === status.FINISHED ||
		ticket.actual_end_at != null;

	// In-progress or unfinished tickets whose deadline has passed are overdue
	const isOverdue = endDate && !isCompleted ? endDate < today : false;

	// Completed tickets finished after the deadline date are late
	const isLate = endDate && actualEndDate ? actualEndDate > endDate : false;

	const formatDate = (date: Date) =>
		date.toLocaleDateString("en-US", {
			month: "short",
			day: "numeric",
			year: "numeric",
		});

	const getDateTextColor = () => {
		if (isOverdue) return "text-red-500 font-medium";
		if (isLate) return "text-orange-500 font-medium";
		return "text-slate-600";
	};

	return (
		<div className="flex flex-col w-full">
			<div
				onClick={() => onSelect(ticket)}
				className={cn(
					"bg-neutral-surface flex overflow-clip rounded-md border border-brand-100 cursor-pointer relative",
					"hover:-translate-y-0.5 hover:border-brand-300 transition-all duration-150 select-none group",
					isSubtask ? "h-36" : "h-45"
				)}
			>
				{isOverdue ? (
					<div className="w-0.5 h-full bg-red-500 shrink-0 group-hover:opacity-50 transition-opacity duration-150" />
				) : isLate ? (
					<div className="w-0.5 h-full bg-orange-500 shrink-0 group-hover:opacity-50 transition-opacity duration-150" />
				) : ticket.status === status.IN_PROGRESS ? (
					<div className="w-0.5 h-full bg-brand-500 shrink-0 group-hover:opacity-50 transition-opacity duration-150" />
				) : null}

				<div className={cn("w-full flex flex-col min-w-0", isSubtask ? "p-3" : "p-4")}>
					{/* Header: Code + OVERDUE/LATE Badge + Delete Button */}
					<div className="flex items-center justify-between gap-2 min-w-0 mb-1">
						<div className="font-mono text-brand-500 text-xs font-semibold truncate min-w-0 pr-1">
							{isSubtask ? "SUB-TASK" : "LRN-BNN"}
						</div>

						<div className="flex items-center gap-1.5 shrink-0">
							{isOverdue && (
								<span className="inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#FFDAD7] text-[#6d0007]">
									OVERDUE
								</span>
							)}
							{isLate && !isOverdue && (
								<span className="inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-full bg-orange-100 text-orange-700">
									LATE
								</span>
							)}
							<Button
								variant="ghost"
								size="icon"
								className="h-fit w-fit shrink-0 text-slate-400 hover:text-slate-600"
								onClick={(e) => {
									e.stopPropagation();
									setIsDeleteModalOpen(true);
								}}
							>
								<X size={14} strokeWidth={2} />
							</Button>
						</div>
					</div>

					{/* Title */}
					<h3 className={cn("line-clamp-1 font-semibold text-slate-900", isSubtask ? "text-xs" : "text-sm")}>
						{ticket.name}
					</h3>

					{/* Description */}
					<div className="w-3/4 text-xs text-neutral-border line-clamp-2 min-w-0 mt-1 break-words">
						{ticket.description}
					</div>

					{/* Bottom row: timeline + assignee avatar */}
					<div className="mt-auto pt-2 flex items-center justify-between gap-2 border-t border-brand-100/60">
						<div className="flex items-center gap-1.5 text-xs min-w-0 font-medium">
							{ticket.Profile ? (
								<Avatar className="w-6 h-6 mr-2 text-[9px] shrink-0">
									<AvatarFallback className="bg-gray-600 text-neutral-surface text-[9px] font-bold">
										{getInitials(
											`${ticket.Profile?.first_name} ${ticket.Profile?.last_name}`,
										)}
									</AvatarFallback>
								</Avatar>
							) : (
								<Avatar className="w-6 h-6 mr-2 border-2 border-dashed border-gray-200 shrink-0">
									<AvatarFallback className="bg-transparent" />
								</Avatar>
							)}

							{startDate && (
								<>
									<Calendar size={13} className={`shrink-0 ${getDateTextColor()}`} />
									<span className={`truncate ${getDateTextColor()}`}>
										{formatDate(startDate)}
									</span>
								</>
							)}

							{startDate && endDate && (
								<span className={`${getDateTextColor()} shrink-0 mx-0.5`}>—</span>
							)}

							{endDate && (
								<>
									<Calendar size={13} className={`shrink-0 ${getDateTextColor()}`} />
									<span className={`truncate ${getDateTextColor()}`}>
										{formatDate(endDate)}
									</span>
								</>
							)}
						</div>

						{!isSubtask && (
							<Button
								variant="ghost"
								size="icon"
								className="h-fit w-fit shrink-0 text-slate-400 hover:text-slate-600"
								onClick={(e) => {
									e.stopPropagation();
									setIsExpanded((prev) => !prev);
								}}
								title={isExpanded ? "Collapse subtasks" : "Expand subtasks"}
							>
								<ChevronDown
									size={14}
									strokeWidth={2}
									className={cn(
										"text-gray-400 transition-transform duration-200",
										isExpanded && "rotate-180"
									)}
								/>
							</Button>
						)}
					</div>
				</div>
			</div>

			{/* Subtasks Accordion Container with Animated Slide-Down & Staggered Entrance */}
			{!isSubtask && (
				<div
					className={cn(
						"grid transition-[grid-template-rows,opacity,margin] duration-300 ease-in-out ml-3.5 pl-2.5 border-l-2",
						isExpanded
							? "grid-rows-[1fr] opacity-100 mt-2.5 border-brand-400/60"
							: "grid-rows-[0fr] opacity-0 mt-0 border-transparent pointer-events-none"
					)}
				>
					<div className="overflow-hidden flex flex-col gap-2 mb-5">
						{subtasks.map((subtask, idx) => (
							<div
								key={subtask.ticket_id}
								className={cn(
									"transition-all duration-300 p-0.5",
									isExpanded && "animate-in fade-in-0 slide-in-from-top-2"
								)}
								style={{
									animationDelay: isExpanded ? `${idx * 60}ms` : "0ms",
									animationFillMode: "backwards",
								}}
							>
								<TicketCardContent
									ticket={subtask}
									onSelect={onSelect}
									onEdit={onEdit}
									onDelete={onDelete}
									isSubtask={true}
								/>
							</div>
						))}
					</div>
				</div>
			)}

			<AlertDialog
				open={isDeleteModalOpen}
				onOpenChange={(open) => {
					if (!open) setIsDeleteModalOpen(false);
				}}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Delete Ticket?</AlertDialogTitle>
						<AlertDialogDescription>
							Are you sure you want to delete{" "}
							<span className="font-medium text-foreground">{ticket.name}</span>
							? This action cannot be undone.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel onClick={() => setIsDeleteModalOpen(false)}>
							Cancel
						</AlertDialogCancel>
						<AlertDialogAction
							onClick={() => {
								setIsDeleteModalOpen(false);
								onDelete(ticket.ticket_id);
							}}
						>
							Delete
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}

/**
 * The default exported React component providing specialized Drag-and-Drop functionality wrapper.
 * It integrates the `@dnd-kit/core` `useDraggable` hook with individual node references, active
 * movement translations, visual dragging opacities, and listener configurations.
 */
export default function TicketCard({
	ticket,
	onSelect,
	onEdit,
	onDelete,
}: {
	ticket: Ticket;
	onSelect: (ticket: Ticket) => void;
	onEdit: (ticket: Ticket) => void;
	onDelete: (ticketId: string) => void;
}) {
	const { attributes, listeners, setNodeRef, transform, isDragging } =
		useDraggable({
			id: ticket.ticket_id,
		});

	const style = {
		transform: transform
			? `translate3d(${transform.x}px, ${transform.y}px, 0)`
			: undefined,
		opacity: isDragging ? 0.4 : 1,
		zIndex: isDragging ? 50 : undefined,
		position: isDragging ? ("relative" as const) : undefined,
		width: "100%",
	};

	return (
		<div
			ref={setNodeRef}
			style={style}
			{...attributes}
			{...listeners}
			className="cursor-grab active:cursor-grabbing focus:outline-none"
		>
			<TicketCardContent
				ticket={ticket}
				onSelect={onSelect}
				onEdit={onEdit}
				onDelete={onDelete}
			/>
		</div>
	);
}