"use client";

import { useState } from "react";
import { useDraggable } from "@dnd-kit/core";

import { type Ticket } from "@/entities/types";
import { Dot } from "lucide-react";
import { LucidePencil, LucideTrash2 } from "lucide-react";
import { status } from "@/lib/generated/prisma";
import { getInitials } from "@/shared/lib/strings";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
 * Renders the internal visual contents, layout, and contextual menus of a single ticket.
 */
export function TicketCardContent({
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
	const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
	const today = new Date();
	today.setHours(0, 0, 0, 0);
	const isOverdue = ticket.plan_end_at ? ticket.plan_end_at < today : false;

	return (
		<>
			<div
				onClick={() => onSelect(ticket)}
				className={
					"bg-neutral-surface flex overflow-clip rounded-xl h-35 border-3 border-neutral-subtle cursor-pointer relative " +
					"hover:bg-brand-50 hover:border-brand-300 transition-colors duration-150 select-none"
				}
			>
				{isOverdue ? (
					<div className="w-[3px] h-full bg-red-500" />
				) : ticket.status === status.IN_PROGRESS ? (
					<div className="w-[3px] h-full bg-brand-500" />
				) : null}

				<div className="w-full flex flex-col p-6">
					<div className="flex mb-2.5 gap-1">
						<div className="flex items-start">
							<span className="text-xl text-gray-900 pr-5 line-clamp-2 leading-none break-all">
								{ticket.name}
							</span>
						</div>
						<div className="flex gap-1 items-start ml-auto">
							<Button
								variant="ghost"
								size="icon"
								onClick={(e) => {
									e.stopPropagation();
									onSelect(ticket);
									onEdit(ticket);
								}}
							>
								<LucidePencil size={14} strokeWidth={2} />
							</Button>
							<Button
								variant="ghost"
								size="icon"
								onClick={(e) => {
									e.stopPropagation();
									setIsDeleteModalOpen(true);
								}}
							>
								<LucideTrash2 size={14} strokeWidth={2} />
							</Button>
						</div>
					</div>

					{/* Bottom row: deadline + assignee avatar */}
					<div className="mt-auto h-3 flex items-center">
						{ticket.Profile ? (
							<Avatar className="w-6 h-6 text-[9px]">
								<AvatarFallback className="bg-gray-600 text-neutral-surface text-[9px] font-bold">
									{getInitials(
										`${ticket.Profile?.first_name} ${ticket.Profile?.last_name}`,
									)}
								</AvatarFallback>
							</Avatar>
						) : (
							<Avatar className="w-6 h-6 border-2 border-dashed border-gray-200">
								<AvatarFallback className="bg-transparent" />
							</Avatar>
						)}
						{ticket.plan_end_at ? (
							<div
								className={`ml-3 flex items-center text-xs font-medium ${
									isOverdue ? "text-red-500" : "text-gray-400"
								}`}
							>
								{ticket.plan_end_at.toLocaleDateString("en-US", {
									month: "short",
									day: "2-digit",
									year: "numeric",
								})}
								{isOverdue && (
									<>
										<Dot />
										<Badge
											variant="destructive"
											className="text-[10px] px-1.5 py-0"
										>
											Overdue
										</Badge>
									</>
								)}
							</div>
						) : null}
					</div>
				</div>
			</div>

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
		</>
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
