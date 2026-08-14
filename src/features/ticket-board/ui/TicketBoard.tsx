"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
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

import TicketColumn from "./TicketColumn";
import { TicketCardContent } from "./TicketCard";
import {TicketModalCreate,TicketModalEdit} from "./TicketModals";
import { TagManager } from "@/features/tag-manager";

import { Back } from "@/components/ui/back"

// TanStack Query hooks
import { useTicketsByWorkflow } from "@/entities/ticket/queries";
import {
	useCreateTicket,
	useUpdateTicketStatus,
	useDeleteTicket,
} from "@/entities/ticket/mutations";
import { useTags } from "@/entities/tag/queries";
import {
	useCreateTag,
	useUpdateTag,
	useDeleteTag,
} from "@/entities/tag/mutations";

import { ChevronLeft } from "lucide-react"
import { toast } from "@/components/ui/toast";

// Types
import { COLUMNS } from "../model/columns";
import { Ticket } from "@/entities/types";
import { status as TicketStatus } from "@/lib/generated/prisma";
import type { CreateTicketParams } from "@/shared/schemas";
type CreateTicketFormData = Omit<CreateTicketParams, "workflow_id" | "status">;

// Icons
import { Tag, Plus } from "lucide-react";
import { useAuth } from "@/features/auth";
import { Button } from "@/components/ui/button";

// ── Main board ────────────────────────────────────────────────────────────────

/**
 * Renders the primary project workflow board workspace.
 * Uses TanStack Query for server state and dnd-kit for drag-and-drop.
 *
 * @param {Object} props
 * @param {string} props.workflow_id - Unique container scope identifying the target board sprint layout.
 * @param {string} [props.workflowName] - Display name for the board header (defaults to "Current Sprint").
 * @param {string} [props.projectId] - Parent project id, used for auth and project-scoped lookups.
 * @param {string} [props.stageId] - Parent stage id, used for tag scope resolution.
 * @returns {JSX.Element} The fully rendered sprint board panel or a loading skeleton.
 */
export default function TicketBoard({
  workflow_id,
  workflowName = 'Current Sprint',
  projectId,
  stageId,
}: {
  workflow_id: string;
  workflowName?: string;
  projectId?: string;
  stageId?: string;
}) {
	const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
	const [modalOpen, setModalOpen] = useState(false);
	const [slideOverOpen, setSlideOverOpen] = useState(false);
	const [activeId, setActiveId] = useState<string | null>(null);
	const [tagManagerOpen, setTagManagerOpen] = useState(false);

	const wasDraggingRef = useRef(false);
	const { user } = useAuth();

	const mouseSensor = useSensor(MouseSensor, {
		activationConstraint: { distance: 8 },
	});
	const touchSensor = useSensor(TouchSensor, {
		activationConstraint: { delay: 200, tolerance: 5 },
	});
	const sensors = useSensors(mouseSensor, touchSensor);

	// ── TanStack Query ────────────────────────────────────────────────────

	const { data: tickets = [], isLoading } = useTicketsByWorkflow(workflow_id);

	// Group once per tickets change — three .filter() passes over the full
	// list on every render become one pass.
	const ticketsByStatus = useMemo(() => {
		const map = new Map<Ticket["status"], Ticket[]>()
		for (const t of tickets) {
			const list = map.get(t.status) ?? []
			list.push(t)
			map.set(t.status, list)
		}
		return map
	}, [tickets])

	const { data: tags = [] } = useTags();

	const createTicketMutation = useCreateTicket();
	const updateStatusMutation = useUpdateTicketStatus();
	const deleteTicketMutation = useDeleteTicket();
	const createTagMutation = useCreateTag();
	const updateTagMutation = useUpdateTag();
	const deleteTagMutation = useDeleteTag();

	const activeTicket = activeId
		? tickets.find((t) => t.ticket_id === activeId)
		: null;

	/**
	 * Intercepts selection events on individual ticket layout targets to open the view/edit drawer.
	 * Includes a guard condition checking the mutable dragging reference to avoid firing
	 * accidental element selections at the immediate termination of item canvas shifts.
	 * @param {Ticket} ticket - The specific ticket entity being targeted for inspection.
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
	 * @param {Date | null} [params.finish_date] - Timestamp scheduling baseline completion window boundary.
	 * @returns {Promise<void>} Resolves when the local state append routine completes.
	 */
	async function handleCreateTicket(data: CreateTicketFormData) {
		try {
			await createTicketMutation.mutateAsync({
				...data,
				workflow_id: workflow_id,
				status: TicketStatus.PENDING,
				TicketAssigned: data.TicketAssigned ?? [],
				tagIds: data.tagIds ?? [],
			performed_by: user?.profile_id,
			} as CreateTicketParams & { performed_by?: string });
			setModalOpen(false);
		} catch (error) {
			console.error("Failed to create ticket:", error);
		}

		// Trigger Success Toast
		toast.add({
			title: "Ticket Created",
			description: `Ticket has been created successfully.`,
			type: "success",
		});
	}

	/**
	 * Soft-deletes a ticket via the delete mutation. The ticket disappears
	 * from the board when the server mutation succeeds (query invalidation
	 * refetches the list) — there is no client-side optimistic removal.
	 * @param {string} ticketId - The UUID of the ticket to delete.
	 */
	function handleDeleteTicket(ticketId: string) {
		deleteTicketMutation.mutate({ ticketId, performed_by: user?.profile_id });
		// Trigger Success Toast
		toast.add({
			title: "Ticket Deleted",
			description: `Ticket has been deleted successfully.`,
			type: "delete",
		});
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
	async function handleSaveTag({
		name,
		tag_id,
		description,
		color,
	}: {
		name: string;
		tag_id?: string;
		description?: string | null;
		color?: string | null;
	}): Promise<{ error?: string }> {
		try {
			if (tag_id) {
				await updateTagMutation.mutateAsync({ tag_id, name, description, color });
			} else {
				await createTagMutation.mutateAsync({ name, description, color });
			}
			return {};
		} catch (err: any) {
			return { error: err?.message ?? "Failed to save tag" };
		}
	}

	/**
	 * Executes soft delete sequences on categorization tags. Removes references instantly from layout options
	 * and retains a contextual rollback fallback array to cover unexpected database operational failures.
	 * * @async
	 * @param {string} tagId - Target primary key mapping to the custom styling metadata structure.
	 * @returns {Promise<void>} Resolves when structural mutations finish execution steps.
	 */
	function handleDeleteTag(tagId: string) {
		deleteTagMutation.mutate(tagId);
	}

	/**
	 * Captures active pointer initialization signals emitted from active dnd-kit draggable component bounds.
	 * Sets the layout state values with the current target card string and flags tracking parameters
	 * to ensure background selections remain blocked during the motion phase.
	 * @param {DragStartEvent} event - Native dnd-kit synthetic payload context tracking mouse/touch triggers.
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
	function handleDragEnd(event: DragEndEvent) {
		const { active, over } = event;
		setActiveId(null);

		if (over && active.id !== over.id) {
			const newStatus = over.id as TicketStatus;
			updateStatusMutation.mutate({
				ticketId: active.id as string,
				status: newStatus,
				performed_by: user?.profile_id,
			});
		}

		setTimeout(() => {
			wasDraggingRef.current = false;
		}, 100);
	}

	if (isLoading) {
		return (
			<div className="flex h-full items-center justify-center">
				<div className="text-gray-500 font-medium animate-pulse">
					Loading database tickets...
				</div>
			</div>
		);
	}

	return (
		<>
			<div className="flex items-start justify-between shrink-0">
				<div className="flex items-center gap-2">
					{stageId && projectId ? (
						<Back 	link = {`/projects/${projectId}/stages/${stageId}`}
								/>
					) : (
						<h1 className="text-xl font-bold text-gray-900">{workflowName}</h1>
					)}
				</div>

				<div className="flex items-center gap-3">

					<Button
						onClick={() => setTagManagerOpen(true)}
						className="flex items-center gap-1.5 bg-transparent text-sm font-medium text-gray-600 border-2 border-gray-200 px-4 py-2 rounded-md hover:bg-gray-50 transition-colors"
					>
						<Tag />
						Tags
					</Button>

					<Button
						onClick={() => setModalOpen(true)}
					>
						<Plus />
						New Ticket
					</Button>
				</div>
			</div>


			<DndContext
				id="ticket-board-dnd"
				sensors={sensors}
				onDragStart={handleDragStart}
				onDragEnd={handleDragEnd}
			>
				<div className="mt-7 w-full flex-1 overflow-x-auto pb-6">
					<div className="grid grid-cols-3 gap-10 flex-1 w-full min-h-0 max-h-[80vh] min-w-[30vw]">
						{COLUMNS.map((column) => (
							<TicketColumn
								key={column.id}
								column={column}
								tickets={ticketsByStatus.get(column.id) ?? []}
								onSelectTicket={handleSelectTicket}
								onDeleteTicket={handleDeleteTicket}
							/>
						))}
					</div>
				</div>

				<DragOverlay dropAnimation={null}>
					{activeTicket ? (
						<div className="rotate-2 opacity-90">
							<TicketCardContent
								ticket={activeTicket}
								onSelect={() => {}}
								onEdit={() => {}}
								onDelete={() => {}}
							/>
						</div>
					) : null}
				</DragOverlay>
			</DndContext>

			<TicketModalEdit
				ticket={selectedTicket}
				isOpen={slideOverOpen}
				onClose={() => setSlideOverOpen(false)}
				onUpdate={(updated) => setSelectedTicket(updated)}
				tags={tags}
				allTickets={tickets} 
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
		</>
	);
}
