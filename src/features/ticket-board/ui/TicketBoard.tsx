"use client";

import { useRef, useState } from "react";
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

// Components
import TopNav from "@/shared/ui/TopNav";
import TicketColumn from "./TicketColumn";
import { TicketCardContent } from "./TicketCard";
import TicketModalCreate from "./TicketModalCreate";
import TicketModalEdit from "./TicketModalEdit";
import { TagManager } from "@/features/tag-manager";

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

// Types
import { COLUMNS } from "../model/columns";
import { Ticket } from "@/entities/types";
import { status as TicketStatus } from "@/lib/generated/prisma";
import type { CreateTicketParams } from "@/shared/schemas";
type CreateTicketFormData = Omit<CreateTicketParams, "workflow_id" | "status">;

// Icons
import { TagsIcon, PlusIcon } from "@/shared/ui/icons";
import { useAuth } from "@/features/auth";

// ── Main board ────────────────────────────────────────────────────────────────

/**
 * Renders the primary project workflow board workspace.
 * Uses TanStack Query for server state and dnd-kit for drag-and-drop.
 *
 * @param {Object} props
 * @param {string} props.workflow_id - Unique container scope identifying the target board sprint layout.
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
	}

	/**
	 * Triggers a cascaded soft-deletion database script while immediately dropping
	 * the target element from the visible client board arrays to optimize user latency perception.
	 * * @async
	 * @param {string} ticketId - The explicit UUID string mapping to the target document reference.
	 * @returns {Promise<void>} Resolves when state mutation pipelines finish reconciling.
	 */
	function handleDeleteTicket(ticketId: string) {
		deleteTicketMutation.mutate({ ticketId, performed_by: user?.profile_id });
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
			<div className="flex h-full items-center justify-center bg-slate-50">
				<div className="text-gray-500 font-medium animate-pulse">
					Loading database tickets...
				</div>
			</div>
		);
	}

	return (
		<div className="flex flex-col h-full bg-slate-50">
			<TopNav breadcrumbs={["Acesoft", "Project Alpha", "Tickets"]} />

			<div className="flex items-center justify-between px-6 py-5 shrink-0">
				<div className="flex items-center gap-3">
					{stageId && projectId ? (
						<Link
							href={`/projects/${projectId}/stages/${stageId}`}
							className="flex items-center gap-2 text-xl font-bold text-gray-900 hover:text-indigo-600 transition-colors"
						>
							<svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="flex-shrink-0">
								<path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
							</svg>
							{workflowName}
						</Link>
					) : (
						<h1 className="text-xl font-bold text-gray-900">{workflowName}</h1>
					)}
				</div>

				<div className="flex items-center gap-3">
					<button
						onClick={() => setTagManagerOpen(true)}
						className="flex items-center gap-1.5 text-sm font-medium text-gray-600 border border-gray-200 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
					>
						<TagsIcon />
						Tags
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
