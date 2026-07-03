'use client';

import { useDroppable } from '@dnd-kit/core';

import TicketCard from './TicketCard';

import { Column } from "../model/types";
import { Ticket } from "@/entities/types"

interface TicketColumnProps {
  column: Column;
  tickets: Ticket[];
  onSelectTicket: (ticket: Ticket) => void;
  onEditTicket?: (ticket: Ticket) => void;   // Made optional with "?"
  onDeleteTicket?: (ticketId: string) => void; // Made optional with "?"
}

export default function TicketColumn({ 
  column, 
  tickets, 
  onSelectTicket,
  onEditTicket = () => {},   // Default fallback function
  onDeleteTicket = () => {}  // Default fallback function
}: TicketColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id });

  return (
    <div className="flex flex-col w-90 shrink-0 select-none">
      {/* Column header */}
      <div className="flex items-center gap-2 mb-2.5 px-1">
        <span className={`w-2 h-2 rounded-full ${column.dotColor}`} />
        <span className="text-sm font-semibold text-gray-700">{column.title}</span>
        <span className="ml-auto text-xs font-semibold text-gray-400 bg-gray-100 w-5 h-5 flex items-center justify-center rounded-full">
          {tickets.length}
        </span>
      </div>

      {/* Container + cards drop zone */}
      <div
        ref={setNodeRef}
        className={`flex flex-col gap-2 flex-1 rounded-xl p-2.5 border transition-colors duration-150 min-h-[400px] ${
          isOver ? 'bg-indigo-50 border-indigo-200' : 'bg-[#F2F3FF] border-gray-200'
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
          <div className="flex items-center justify-center flex-1 min-h-[120px] border border-dashed border-gray-300 rounded-xl bg-white/40">
            <p className="text-xs text-gray-400 font-medium tracking-wide">Drop tickets here</p>
          </div>
        )}
      </div>
    </div>
  );
}