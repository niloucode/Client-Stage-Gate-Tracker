"use client";

import { useDroppable } from "@dnd-kit/core";

import TicketCard from "./TicketCard";

import { Column } from "../model/columns";
import { Ticket } from "@/entities/types";

interface TicketColumnProps {
	column: Column;
	tickets: Ticket[];
	subtasksByParent: ReadonlyMap<string, Ticket[]>;
	onSelectTicket: (ticket: Ticket) => void;
	onDeleteTicket?: (ticketId: string, mode: "cascade" | "promote") => void;
}

export default function TicketColumn({
	column,
	tickets,
	subtasksByParent,
	onSelectTicket,
	onDeleteTicket = () => {}, // Default fallback function
}: TicketColumnProps) {
	const { setNodeRef, isOver } = useDroppable({ id: column.id });

	return (
		<div className="flex flex-col h-full w-full select-none rounded-md min-h-0">
    		{/* Column header - shrink-0 keeps header fixed size */}
			<div className="flex mb-2 shrink-0 items-center gap-5">
				<h2>{column.title}</h2>
				<span className={`text-md ${column.dotColor} ${column.textColor} font-semibold w-10 h-7 flex items-center justify-center rounded-full`}>
					{tickets.length}
				</span>
			</div>

			<div className="shrink-0"></div>

			{/* Container + cards drop zone */}
			{/* min-h-0 allows overflow-auto to trigger internal scrolling when cards overflow */}
			<div className="flex items-center w-full justify-center flex-1 rounded-md bg-neutral-surface/40">
					<div
				ref={setNodeRef}
				className={`p-0.5 flex flex-col items-center gap-2 flex-1 min-h-[69vh] rounded-md max-h-[69vh] overflow-y-auto transition-colors duration-150 ${
					isOver ? "border bg-indigo-50 border-indigo-200" :
					""
				}`}
			>
				{tickets.map((ticket) => (
					<TicketCard
						key={ticket.ticket_id}
						ticket={ticket}
						subtasks={subtasksByParent.get(ticket.ticket_id) ?? []}
						onSelect={onSelectTicket}
						onDelete={onDeleteTicket}
					/>
				))}

						{tickets.length === 0 && (
						<div className="w-full h-full flex-1 flex justify-center items-center text-xs text-gray-400 font-medium tracking-wide">
									Drop tickets here
						</div>
						)}
					</div>
			</div>
		</div>
	);
}
