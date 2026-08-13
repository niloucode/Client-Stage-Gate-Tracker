"use client";

import { useState, useEffect } from "react";
import { Ticket, Tag } from "@/entities/types";
import TicketEditor from "./editor/TicketEditor";

interface TicketModalEditProps {
  ticket: Ticket | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (updated: Ticket) => void;
  tags: Tag[];
  /** All tickets in the workflow for subtask lookup */
  allTickets?: Ticket[];
  /** When true, this modal is being used to view/edit a subtask */
  isSubtaskView?: boolean;
  /** Parent ticket info to display when in subtask view */
  parentTicket?: Ticket | null;
}

/**
 * The Modal shell. Remains mounted off-screen so CSS transform transitions
 * trigger smoothly on every open and close interaction.
 */
export default function TicketModalEdit({
  ticket,
  isOpen,
  onClose,
  ...rest
}: TicketModalEditProps) {
  const [activeTicket, setActiveTicket] = useState<Ticket | null>(ticket);

  useEffect(() => {
    if (ticket) {
      setActiveTicket(ticket);
    }
  }, [ticket]);

  const showModal = Boolean(isOpen && ticket);

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-foreground/30 z-40 transition-opacity duration-300 ${
          showModal ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />

      {/* Sliding Panel */}
      <div
        className={`fixed top-0 right-0 h-full w-160 max-w-full bg-neutral-surface shadow-2xl z-50 flex flex-col transition-transform duration-300 ease-in-out ${
          showModal ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {activeTicket && (
          <TicketEditor
            key={activeTicket.ticket_id}
            initialTicket={activeTicket}
            onClose={onClose}
            {...rest}
          />
        )}
      </div>
    </>
  );
}