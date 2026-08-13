"use client";

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
 * The Modal shell. Contains only the overlay backdrop and the sliding container.
 * Only mounts the heavy `TicketEditor` content when it is explicitly open and provided with a ticket.
 */
export default function TicketModalEdit({
  ticket,
  isOpen,
  onClose,
  ...rest
}: TicketModalEditProps) {
  if (!ticket) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-foreground/30 z-40 transition-opacity duration-300 ${isOpen ? "opacity-100" : "opacity-0 pointer-events-none"}`}
        onClick={onClose}
      />

      {/* Sliding Panel */}
      <div
        className={`fixed top-0 right-0 h-full w-160 bg-neutral-surface shadow-2xl z-50 flex flex-col transition-transform duration-300 ease-in-out ${isOpen ? "translate-x-0" : "translate-x-full"}`}
      >
        {isOpen && (
          <TicketEditor
            initialTicket={ticket}
            onClose={onClose}
            {...rest}
          />
        )}
      </div>
    </>
  );
}