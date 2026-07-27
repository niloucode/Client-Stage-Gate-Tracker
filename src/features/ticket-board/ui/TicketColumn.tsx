"use client";

import { useDroppable } from "@dnd-kit/core";

import TicketCard from "./TicketCard";

import { Column } from "../model/columns";
import { Ticket } from "@/entities/types";

interface TicketColumnProps {
	column: Column;
	tickets: Ticket[];
	onSelectTicket: (ticket: Ticket) => void;
	onEditTicket?: (ticket: Ticket) => void; // Made optional with "?"
	onDeleteTicket?: (ticketId: string) => void; // Made optional with "?"
}

export default function TicketColumn({
	column,
	tickets,
	onSelectTicket,
	onEditTicket = () => {}, // Default fallback function
	onDeleteTicket = () => {}, // Default fallback function
}: TicketColumnProps) {
	const { setNodeRef, isOver } = useDroppable({ id: column.id });

	return (
		<div className="flex flex-col h-full w-full shrink-0 select-none bg-brand-25 border-2 border-brand-100 rounded-xl">
			{/* Column header */}
			<div className="flex h-16 items-center gap-2 p-4">
				<span className={`w-2 h-2 rounded-full ${column.dotColor}`} />
				<span className="text-lg font-semibold text-brand-900">{column.title}</span>
				<span className="ml-auto text-xs font-semibold text-brand-900 bg-brand-100 w-5 h-5 flex items-center justify-center rounded-full">
					{tickets.length}
				</span>
			</div>

			<div className="border-brand-100 border-b-2"></div>
			{/* Container + cards drop zone */}
			<div
				ref={setNodeRef}
				className={`flex flex-col items-center gap-2 flex-1 rounded-xl p-2.5 transition-colors duration-150 min-h-[calc(100vh-240px)] max-h-[calc(100vh-240px)] overflow-auto ${
					isOver ? "border bg-indigo-50 border-indigo-200" :
					 "border border-brand-25 bg-brand-25"
				}`}
			>
				{tickets.map((ticket) => (
					<TicketCard
						key={ticket.ticket_id}
						ticket={ticket}
						onSelect={onSelectTicket}
						onEdit={onEditTicket}
						onDelete={onDeleteTicket}
					/>
				))}

				{tickets.length === 0 && (
					<div className="flex items-center w-full justify-center flex-1 h-full border border-dashed border-gray-300 rounded-xl bg-white/40">
						<p className="text-xs text-gray-400 font-medium tracking-wide">
							Drop tickets here
						</p>
					</div>
				)}
			</div>
		</div>
	);
}
