'use client';

import { useState, useRef, useEffect } from 'react';
import { useDraggable } from '@dnd-kit/core';

import { type Ticket } from '@/entities/types';
import TicketModalDelete from './TicketModalDelete';
import { CalendarIcon, AlertTriangleIcon, MoreHorizontalIcon } from './assets';

/**
 * Generates up to two uppercase initials from a full name string.
 * It handles leading, trailing, and multiple consecutive spaces gracefully.
 * * @param {string} name - The full name string to extract initials from.
 * @returns {string} A 1 to 2 character uppercase string representing the name's initials.
 * * @example
 * getInitials(" john   doe ") // Returns "JD"
 * getInitials("Alice")        // Returns "A"
 */
function getInitials(name: string): string {
    return name
        .trim()                        // Remove trailing/leading spaces
        .split(/\s+/)                  // Split into words by any spacing
        .map((word) => word[0])        // Grab the first character of each word
        .slice(0, 2)                   // Keep only the first two characters
        .join("")                      // Combine them
        .toUpperCase();                // Force uppercase
}

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
                                      onDelete
}: {
    ticket: Ticket;
    onSelect: (ticket: Ticket) => void;
    onEdit: (ticket: Ticket) => void;
    onDelete: (ticketId: string) => void;
}) {
    const [menuOpen, setMenuOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

//   const completedSubtasks = ticket.subtasks?.filter((s) => s.completed).length ?? 0;
//   const totalSubtasks = ticket.subtasks?.length ?? 0;

    // Auto-close menu on outside clicks
    useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
        if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
        }
    }
    if (menuOpen) {
        document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [menuOpen]);
	const today = new Date();
	today.setHours(0,0,0,0)
    return (
    <div
        onClick={() => onSelect(ticket)}
        className={[
        'bg-white rounded-xl p-4 border border-gray-200 cursor-pointer relative',
        'hover:border-gray-300 transition-colors duration-150 select-none',
        ticket.deadline_date < today ? 'border-l-4 border-l-red-500' : '',
        ].join(' ')}
    >
        {/* Top row: ID + badges + menu */}
			
        <div className="flex items-center justify-center mb-2.5 gap-1">
				{/* Title */}
				<p className="text-sm font-medium text-gray-900 leading-snug    line-clamp-2">
					{ticket.name}
				</p>
        {/* <span className="text-xs font-semibold text-indigo-600 shrink-0">{ticket.ticket_id}</span> */}
        <div className="flex items-center gap-1.5 ml-auto relative" ref={menuRef}>
          {/* {ticket.isActive && (
            <span className="text-[10px] font-semibold tracking-wide text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full uppercase">
              Active
            </span>
          )} */}
          {ticket.deadline_date < today && (
            <span className="text-[10px] font-semibold tracking-wide text-red-600 bg-red-50 px-2 py-0.5 rounded-full uppercase">
              Overdue
            </span>
          )}
          {/* {ticket.isFlagged && <FlagIcon className="text-red-500" />} */}
          
          <button
            onClick={(e) => {
              e.stopPropagation();
              setMenuOpen(!menuOpen);
            }}
            className={`p-0.5 rounded transition-colors ${menuOpen ? 'text-gray-700 bg-gray-100' : 'text-gray-400 hover:text-gray-600'}`}
          >
            <MoreHorizontalIcon />
          </button>

          {/* Action Menu Dropdown */}
          {menuOpen && (
            <div className="absolute right-0 top-full mt-1 w-32 bg-white rounded-lg border border-gray-200 shadow-lg py-1 z-30">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setMenuOpen(false);
                  onSelect(ticket);
                  onEdit(ticket);
                }}
                className="w-full text-left px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50 font-medium"
              >
                Edit
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setMenuOpen(false);
                  setIsDeleteModalOpen(true);
                }}
                className="w-full text-left px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 font-medium"
              >
                Delete
              </button>
            </div>
          )}
        </div>
				
        </div>

        

        {/* Subtask progress */}
        {/* {totalSubtasks > 0 && (
        <div className="flex items-center gap-1.5 mb-3">
          <div className="flex-1 h-1 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-indigo-400 rounded-full transition-all"
              style={{ width: `${(completedSubtasks / totalSubtasks) * 100}%` }}
            />
          </div>
          <span className="text-[10px] text-gray-400 font-medium shrink-0">
            {completedSubtasks}/{totalSubtasks}
          </span>
        </div>
        )} */}

        {/* Bottom row: deadline + assignee avatar */}
        { <div className="flex items-center justify-between">
        {ticket.deadline_date ? (
          <div
            className={`flex items-center gap-1 text-xs font-medium ${
              ticket.deadline_date < today ? 'text-red-500' : 'text-gray-400'
            }`}
          >
            {ticket.deadline_date < today ? (
              <AlertTriangleIcon className="text-red-500" />
            ) : (
              <CalendarIcon />
            )}
            {ticket.deadline_date.toLocaleDateString('en-US', {
				month: 'short',
				day: '2-digit',
				year: 'numeric'
			})}
          </div>
        ) : (
          <div />
        )}

        {ticket.Profiles_Tickets_watcher_idToProfiles ? (
          <div
            className={`w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold text-white bg-gray-600 shrink-0 {usercolor}`}
            title={`${ticket.Profiles_Tickets_watcher_idToProfiles?.first_name} ${ticket.Profiles_Tickets_watcher_idToProfiles?.last_name}`}
          >
            {getInitials(`${ticket.Profiles_Tickets_watcher_idToProfiles?.first_name} ${ticket.Profiles_Tickets_watcher_idToProfiles?.last_name}`)}
          </div>
        ) : (
          <div className="w-6 h-6 rounded-full border-2 border-dashed border-gray-200" />
        )}
        </div> }

        <TicketModalDelete
        isOpen={isDeleteModalOpen}
        ticketTitle={ticket.name}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={() => {
          setIsDeleteModalOpen(false);
          onDelete(ticket.ticket_id);
        }}
        />
    </div>
    );
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
                                       onDelete
}:
{
    ticket: Ticket;
    onSelect: (ticket: Ticket) => void;
    onEdit: (ticket: Ticket) => void;
    onDelete: (ticketId: string) => void;
}) {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: ticket.ticket_id,
    });

    const style = {
    transform: transform
        ? `translate3d(${transform.x}px, ${transform.y}px, 0)`
        : undefined,
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 50 : undefined,
    position: isDragging ? ('relative' as const) : undefined,
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