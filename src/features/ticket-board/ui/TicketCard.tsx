"use client"

import { useState, useRef, useEffect } from "react"
import { useDraggable } from "@dnd-kit/core"

import { type Ticket } from "@/entities/types"
import TicketModalDelete from "./TicketModalDelete"
import { Calendar, AlertTriangle, MoreHorizontal, Dot } from "lucide-react"
import { getInitials } from "@/shared/lib/strings"
import { LucidePencil, LucideTrash2 } from "lucide-react"
import { status } from "@/lib/generated/prisma"


/**
 * Renders the internal visual contents, layout, and contextual menus of a single ticket.
 * This subcomponent manages its own drop-down actions menu (Edit/Delete) and localized
 * "outside-click" detection listeners to automatically close the menu overlay. It also calculates
 * and applies structural indicators if a ticket's deadline is past due.
 * * @component
 * @param {Object} props
 * @param {Ticket} props.ticket - The comprehensive data object representing the current ticket.
 * @param {(ticket: Ticket) => void} props.onSelect - Callback fired when the main ticket surface is clicked.
 * @param {(ticket: Ticket) => void} props.onEdit - Callback executed when "Edit" is selected from the dropdown menu.
 * @param {(ticketId: string) => void} props.onDelete - Callback invoked when a deletion is finalized in the confirmation modal.
 * @returns {JSX.Element} The underlying structural markup for the ticket's user interface.
 */
export function TicketCardContent({
	ticket,
	onSelect,
	onEdit,
	onDelete,
}: {
	ticket: Ticket
	onSelect: (ticket: Ticket) => void
	onEdit: (ticket: Ticket) => void
	onDelete: (ticketId: string) => void
}) {
	const [menuOpen, setMenuOpen] = useState(false)
	const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
	const menuRef = useRef<HTMLDivElement>(null)

	// Auto-close menu on outside clicks
	useEffect(() => {
		function handleClickOutside(event: MouseEvent) {
			if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
				setMenuOpen(false)
			}
		}
		if (menuOpen) {
			document.addEventListener("mousedown", handleClickOutside)
		}
		return () => document.removeEventListener("mousedown", handleClickOutside)
	}, [menuOpen])
	const today = new Date()
	today.setHours(0, 0, 0, 0)
	return (
		<div
			onClick={() => onSelect(ticket)}
			className={[
				// (ticket.deadline_date && ticket.deadline_date < today) ? "bg-[#FFEEEE]": 
				"bg-neutral-surface",
				"flex overflow-clip rounded-xl h-35 border-3 border-neutral-subtle cursor-pointer relative ",
				"hover:bg-brand-50 hover:border-brand-300 transition-colors duration-150 select-none",
				
			].join(" ")}
		>
			{(ticket.deadline_date && ticket.deadline_date < today) ? (
				<div className={"w-[3px] h-full "+((ticket.deadline_date && ticket.deadline_date < today) ? "bg-red-500" : "")}></div>
			) : ticket.status === status.IN_PROGRESS ? (
				<div className={"w-[3px] h-full "+((ticket.status === status.IN_PROGRESS) ? "bg-brand-500" : "")}></div>
			):<></>}

			<div className="w-full flex flex-col p-6">
				<div className="flex mb-2.5 gap-1">
					<div className="flex items-start">
						<span className="text-xl text-gray-900 pr-5 line-clamp-2 leading-none break-all">
							{ticket.name}
						</span>
					</div>
					<div className="flex gap-1.5 mt-0.5 items-start ml-auto" ref={menuRef}>
						<button
							onClick={(e) => {
								e.stopPropagation()
								setMenuOpen(false)
								onSelect(ticket)
								onEdit(ticket)
							}}
							className="h-[14px] w-[14px] cursor-pointer text-gray-700 hover:text-foreground transition-all duration-300 fade-in"
						><LucidePencil size={14} strokeWidth={2}/>
						</button>
						<button
							onClick={(e) => {
								e.stopPropagation()
								setMenuOpen(false)
								setIsDeleteModalOpen(true)
							}}
							className="h-[14px] w-[14px] cursor-pointer text-gray-700 hover:text-red-800 transition-all duration-300 fade-in"
						><LucideTrash2 size={14} strokeWidth={2}/>
						</button>
					</div>
				</div>

				{/* Bottom row: deadline + assignee avatar */}
				{
					<div className="mt-auto h-3 flex items-center">
						{ticket.Profiles ? (
							<div
								className={`w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold text-neutral-surface bg-gray-600 shrink-0 {usercolor}`}
								title={`${ticket.Profiles?.first_name} ${ticket.Profiles?.last_name}`}
							>
								{getInitials(
									`${ticket.Profiles?.first_name} ${ticket.Profiles?.last_name}`,
								)}
							</div>
						) : (
							<div className="w-6 h-6 rounded-full border-2 border-dashed border-gray-200" />
						)}
						{ticket.deadline_date ? (
							<div
								className={`ml-3 flex items-center text-xs font-medium ${
									ticket.deadline_date < today ? "text-red-500" : "text-gray-400"
								}`}
							>
								{/* {ticket.deadline_date < today ? (
									<AlertTriangle className="text-red-500" />
								) : (
									<Calendar />
								)} */}
								{ticket.deadline_date.toLocaleDateString("en-US", {
									month: "short",
									day: "2-digit",
									year: "numeric",
								})}
								{ticket.deadline_date < today ? <><Dot/>Overdue</> :""}
							</div>
						) : (
							<div />
						)}

						
					</div>
				}

				<TicketModalDelete
					isOpen={isDeleteModalOpen}
					ticketTitle={ticket.name}
					onClose={() => setIsDeleteModalOpen(false)}
					onConfirm={() => {
						setIsDeleteModalOpen(false)
						onDelete(ticket.ticket_id)
					}}
				/>
			</div>
		</div>
	)
}

/**
 * The default exported React component providing specialized Drag-and-Drop functionality wrapper.
 * It integrates the `@dnd-kit/core` `useDraggable` hook with individual node references, active
 * movement translations, visual dragging opacities, and listener configurations. It wraps
 * `<TicketCardContent />` to pass down the essential ticket metadata properties and handler callbacks.
 * * @component
 * @exports
 * @param {Object} props
 * @param {Ticket} props.ticket - The data object containing unique ID and details for drag registration.
 * @param {(ticket: Ticket) => void} props.onSelect - Forwarded selection handler.
 * @param {(ticket: Ticket) => void} props.onEdit - Forwarded editing action handler.
 * @param {(ticketId: string) => void} props.onDelete - Forwarded ticket deletion handler.
 * @returns {JSX.Element} A draggable DOM wrapper component enclosing the ticket card view layer.
 */
export default function TicketCard({
	ticket,
	onSelect,
	onEdit,
	onDelete,
}: {
	ticket: Ticket
	onSelect: (ticket: Ticket) => void
	onEdit: (ticket: Ticket) => void
	onDelete: (ticketId: string) => void
}) {
	const { attributes, listeners, setNodeRef, transform, isDragging } =
		useDraggable({
			id: ticket.ticket_id,
		})

	const style = {
		transform: transform
			? `translate3d(${transform.x}px, ${transform.y}px, 0)`
			: undefined,
		opacity: isDragging ? 0.4 : 1,
		zIndex: isDragging ? 50 : undefined,
		position: isDragging ? ("relative" as const) : undefined,
		width: "100%",
	}

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
	)
}
