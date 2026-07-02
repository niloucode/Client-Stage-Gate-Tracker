'use client';

import { useEffect, useRef, useState } from "react";
import {
    DndContext,
    DragEndEvent,
    DragOverlay,
    DragStartEvent,
    MouseSensor,
    TouchSensor,
    useSensor,
    useSensors,
} from "@dnd-kit/core";

// Components
import TopNav from "@/components/layout/TopNav";
import TicketColumn from "./TicketColumn";
import { TicketCardContent } from "./TicketCard";
import TicketModalCreate from "./TicketModalCreate";
import TicketModalEdit from "./TicketModalEdit";
import { TagManager } from "../tag/TagModals";

// Actions
import {
    selectTicket,
    updateTicketStatus,
    createTicket,
    cascadeSoftDeleteTicket
} from "@/actions/ticketActions";
import {
    selectTag,
    updateTag,
    createTag,
    softDeleteTag
} from "@/actions/tagActions";

// Types
import { COLUMNS, Ticket, Tag, TicketAssigned } from "./types";
import { status as TicketStatus } from "@/lib/generated/prisma";

// Icons
import { TagsIcon, FilterIcon, PlusIcon } from './assets';


// ── Main board ────────────────────────────────────────────────────────────────

/**
 * Renders the primary project workflow board workspace.
 * It coordinates asynchronous data fetching loops for active project elements, handles
 * client-side state projection syncing with Prisma relational layouts, registers global
 * dnd-kit pointer listeners, and provides centralized handlers for modals, drawers, and overlays.
 * * @component
 * @param {Object} props
 * @param {string} props.projectId - Unique database identifier for the parent project scope.
 * @param {string} props.workflowId - Unique container scope identifying the target board sprint layout.
 * @returns {JSX.Element} The fully rendered sprint board panel or a full-viewport loading skeleton.
 */
export default function TicketBoard({projectId, workflowId}:
{
    projectId: string;
    workflowId: string;
})
{
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [tags, setTags] = useState<Tag[]>([]);

    const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [slideOverOpen, setSlideOverOpen] = useState(false);
    const [activeId, setActiveId] = useState<string | null>(null);
    const [tagManagerOpen, setTagManagerOpen] = useState(false);

    const wasDraggingRef = useRef(false);

    const mouseSensor = useSensor(MouseSensor, {
        activationConstraint: { distance: 8 },
    });
    const touchSensor = useSensor(TouchSensor, {
        activationConstraint: { delay: 200, tolerance: 5 },
    });
    const sensors = useSensors(mouseSensor, touchSensor);

    const activeTicket = activeId ? tickets.find((t)=>
        t.ticket_id === activeId) : null;

    useEffect(() => {
        let isMounted = true;

        if (isMounted) {
            selectTag()
                .then((data) => {
                    if (isMounted) {
                        setTags(data as Tag[]);
                    }
                })
                .catch((err) => console.error("Failed to fetch tags:", err));
        }

        return () => {
            isMounted = false; // Prevents updating state if component unmounts mid-fetch
        };
    }, []);

    useEffect(() => {
        let isMounted = true;

        async function fetchBot() {
            try {
                setIsLoading(true);
                const data = await selectTicket();

                // Only update state if the user is still looking at this page!
                if (isMounted) {
                    setTickets(data);
                }
            } catch (error) {
                console.error("Error loading tickets from database:", error);
            } finally {
                if (isMounted) {
                    setIsLoading(false);
                }
            }
        }

        fetchBot();

        // Cleanup function: Fires if the component unmounts mid-fetch
        return () => {
            isMounted = false;
        };
    }, []); // Empty array is perfectly fine now because fetchBot is self-contained

    /**
     * Intercepts selection events on individual ticket layout targets to open the view/edit drawer.
     * Includes a guard condition checking the mutable dragging reference to avoid firing
     * accidental element selections at the immediate termination of item canvas shifts.
     * * @param {Ticket} ticket - The specific ticket entity being targeted for inspection.
     * @returns {void}
     */
    function handleSelectTicket(ticket: Ticket) {
        if (wasDraggingRef.current) return;
        setSelectedTicket(ticket);
        setSlideOverOpen(true);
    }

    /**
     * Asynchronously posts fields gathered by the creation modal component configuration to the database backend.
     * Provides error isolation by preserving structural state rollback snapshots if the downstream
     * network request throws an unhandled server error mutation exception.
     * * @async
     * @param {Object} params - Cleaned property payload collected from form context inputs.
     * @param {string} params.name - Target display summary title for the generated ticket.
     * @param {Date} params.deadline_date - Due date timestamp threshold flag for overdue visual triggers.
     * @param {string | null} [params.watcher_id] - Profile reference string track for monitoring changes.
     * @param {string[] | null} [params.TicketAssigned] - Collection array of profile reference id keys linked to assignees.
     * @param {string[] | null} [params.tagIds] - Primary key association list attaching metadata styling tags.
     * @param {string | null} [params.description] - Markdown descriptive content text block string.
     * @param {Date | null} [params.start_date] - Timestamp scheduling baseline start window boundary.
     * @param {Date | null} [params.end_date] - Timestamp scheduling baseline completion window boundary.
     * @returns {Promise<void>} Resolves when the local state append routine completes.
     */
    async function handleCreateTicket({
                                          name,
                                          deadline_date,
                                          watcher_id,
                                          TicketAssigned,
                                          tagIds,
                                          description,
                                          start_date,
                                          end_date,
                                      }: {
        // Declare the types here in a separate block!
        name: string;
        deadline_date: Date;
        watcher_id?: string | null;
        TicketAssigned?: string[] | null;
        tagIds?: string[] | null;
        description?: string | null;
        start_date?: Date | null;
        end_date?: Date | null;
    }) {
        const previousTickets = tickets;
        try {
            // Clean matching call setup with deadlineDate passed as the 3rd argument
            const result = await createTicket(
                {
                    workflow_id: "cddde38b-1a89-440a-9d39-6bf12cfb3d05",
                    name: name,
                    deadline_date: deadline_date,
                    status: TicketStatus.PENDING,
                    watcher_id: watcher_id ?? null,
                    TicketAssigned: TicketAssigned ?? [],
                    tagIds: tagIds ?? [],
                    description: description ?? null,
                    start_date: start_date ?? null,
                    end_date: end_date ?? null
                }
            );

            if (result) {
                setTickets((prev) =>
                    [...prev, result as Ticket]);
                setModalOpen(false);
            }
        } catch (error) {
            setTickets(previousTickets);
            console.error("Failed to create ticket:", error);
        }
    }

    /**
     * Triggers a cascaded soft-deletion database script while immediately dropping
     * the target element from the visible client board arrays to optimize user latency perception.
     * * @async
     * @param {string} ticketId - The explicit UUID string mapping to the target document reference.
     * @returns {Promise<void>} Resolves when state mutation pipelines finish reconciling.
     */
    async function handleDeleteTicket(ticketId: string) {
        const previousTickets = tickets;
        try {
            setTickets((prev) =>
                prev.filter((t) => t.ticket_id !== ticketId));
            await cascadeSoftDeleteTicket(ticketId);
        } catch (error) {
            setTickets(previousTickets);
            console.error("Failed to delete ticket:", error);
        }
    }

    /**
     * Processes the creation of a new tag or updates an existing tag by invoking
     * backend server actions and optimistically/reactively updating the local state.
     * * - If a `tag_id` is present, it targets an update mutation (`updateTag`).
     * - If `tag_id` is empty or falsy, it defaults to a creation sequence (`createTag`).
     * * @async
     * @param {string} tag_id - The unique identifier of the target tag. Pass an empty string or nullish value to trigger tag creation.
     * @param {string} name - The intended display name for the tag.
     * @param {string | null} [description] - Optional contextual details or summary of the tag's purpose.
     * @param {string | null} [color] - Optional Hex code, Tailwind class, or color variant identifier for UI styling.
     * @returns {Promise<void>} Resolves when the database mutations complete and React component state is successfully reconciled.
     */
    async function handleSaveTag({name, tag_id, description, color}:{
        name: string,
        tag_id?: string,
        description?: string | null,
        color?: string | null,
    }): Promise<void>
    {
        if (tag_id) {
            // Edit
            const result = await updateTag(tag_id, name, description, color);

            if (result.name)
                setTags((prev) => prev.map((t) => t.tag_id === tag_id ? { ...t, ...{name, description, color} } as Tag : t));
        } else {
            // Create
            const result = await createTag(name, description, color);

            if (result.success)
                setTags((prev) => [...prev, {
                    tag_id:result?.data?.tag_id ?? "",
                    name:name,
                    description:description,
                    color:color,
                    deleted_at:null,
                    is_deleted:false
                } as Tag]);
        }
    }

    /**
     * Executes soft delete sequences on categorization tags. Removes references instantly from layout options
     * and retains a contextual rollback fallback array to cover unexpected database operational failures.
     * * @async
     * @param {string} tagId - Target primary key mapping to the custom styling metadata structure.
     * @returns {Promise<void>} Resolves when structural mutations finish execution steps.
     */
    async function handleDeleteTag(tagId: string) {
        const previousTag = tags;
        try {
            setTags((prev) =>
                prev.filter((t) => t.tag_id !== tagId));
            await softDeleteTag(tagId);
        } catch (error) {
            setTags(previousTag);
            console.error("Failed to delete ticket:", error);
        }
    }

    /**
     * Captures active pointer initialization signals emitted from active dnd-kit draggable component bounds.
     * Sets the layout state values with the current target card string and flags tracking parameters
     * to ensure background selections remain blocked during the motion phase.
     * * @param {DragStartEvent} event - Native dnd-kit synthetic payload context tracking mouse/touch triggers.
     * @returns {void}
     */
    function handleDragStart(event: DragStartEvent) {
        setActiveId(event.active.id as string);
        wasDraggingRef.current = true;
    }

    /**
     * Validates landing node layouts at pointer finalization boundaries to execute lane state shifts.
     * Modifies columns optimistically across local collections and handles exceptions by restoring
     * state signatures if backend mutations drop or timeout. Includes a short timeout delay clear
     * to separate trailing pointer tap events from completed movement paths.
     * * @async
     * @param {DragEndEvent} event - Context event tracking target item nodes and overlapping droppable lanes.
     * @returns {Promise<void>}
     */
    async function handleDragEnd(event: DragEndEvent) {
        const { active, over } = event;
        setActiveId(null);

        if (over && active.id !== over.id) {
            const newStatus = over.id as TicketStatus;
            const previousTickets = tickets;

            setTickets((prev) =>
                prev.map((t) =>
                    t.ticket_id === active.id ? { ...t, status: newStatus } : t
                )
            );

            try {
                await updateTicketStatus(active.id as string, newStatus);
            } catch (error) {
                setTickets(previousTickets);
                console.error("Failed to update ticket status:", error);
            }
        }

        setTimeout(() => {
            wasDraggingRef.current = false;
        }, 100);
    }

    if (isLoading) {
        return (
            <div className="flex h-full items-center justify-center bg-slate-50">
                <div className="text-gray-500 font-medium animate-pulse">Loading database tickets...</div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-slate-50">
            <TopNav breadcrumbs={["Acesoft", "Project Alpha", "Tickets"]} />

            <div className="flex items-center justify-between px-6 py-5 shrink-0">
                <div className="flex items-center gap-3">
                    <h1 className="text-xl font-bold text-gray-900">Current Sprint</h1>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setTagManagerOpen(true)}
                        className="flex items-center gap-1.5 text-sm font-medium text-gray-600 border border-gray-200 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                        <TagsIcon />
                        Tags
                    </button>

                    <button className="flex items-center gap-1.5 text-sm font-medium text-gray-600 border border-gray-200 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors">
                        <FilterIcon />
                        Filter
                    </button>
                    <button
                        onClick={() => setModalOpen(true)}
                        className="flex items-center gap-1.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded-lg transition-colors"
                    >
                        <PlusIcon />
                        New Issue
                    </button>
                </div>
            </div>

            <DndContext
                id="ticket-board-dnd"
                sensors={sensors}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
            >
                <div className="flex-1 overflow-x-auto overflow-y-hidden px-6 pb-6">
                    <div className="flex gap-5 h-full items-start">
                        {COLUMNS.map((column) => (
                            <TicketColumn
                                key={column.id}
                                column={column}
                                tickets={tickets.filter((t) => t.status === column.id)}
                                onSelectTicket={handleSelectTicket}
                                onDeleteTicket={handleDeleteTicket}
                            />
                        ))}
                    </div>
                </div>

                <DragOverlay dropAnimation={null}>
                    {activeTicket ? (
                        <div className="rotate-2 opacity-90">
                            <TicketCardContent ticket={activeTicket} onSelect={() => {}} onEdit={() =>
                            {}} onDelete={() => {}} />
                        </div>
                    ) : null}
                </DragOverlay>
            </DndContext>

            <TicketModalEdit
                ticket={selectedTicket}
                isOpen={slideOverOpen}
                onClose={() => setSlideOverOpen(false)}
                onUpdate={(updated) => setTickets((prev) => prev.map((t) => t.ticket_id === updated.ticket_id ? (updated as Ticket) : t))}
                tags={tags}
            />

            <TicketModalCreate
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                onCreateTicket={handleCreateTicket}
                tags={tags}
            />

            <TagManager
                isOpen={tagManagerOpen}
                onClose={() => setTagManagerOpen(false)}
                onSave={handleSaveTag}
                onDelete={handleDeleteTag}
                tags={tags}
            />
        </div>
    );
}