"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import {
	DndContext,
	DragEndEvent,
	DragOverlay,
	DragStartEvent,
	KeyboardSensor,
	MouseSensor,
	TouchSensor,
	useSensor,
	useSensors,
} from "@dnd-kit/core";

import TicketColumn from "./TicketColumn";
import { TicketCardContent } from "./TicketCard";
import { TicketModalCreate, TicketModalEdit } from "./TicketModals";
import { TagManager } from "@/features/tag-manager";

import { Back } from "@/components/ui/back";

// TanStack Query hooks
import { useTicketsByWorkflow } from "@/entities/ticket/queries";
import { useCurrentUser } from "@/entities/profile/queries";
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
 * Props are typed on the destructured signature (workflow_id, workflowName,
 * projectId, stageId).
 */
export default function TicketBoard({
	workflow_id,
	workflowName = "Current Sprint",
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
	const { data: profile } = useCurrentUser();
	// Spec: client profiles (linked via the contract) are read-only here;
	// project team and project owners have full edit access.
	const isClientProfile = !!profile?.client_id;

	const mouseSensor = useSensor(MouseSensor, {
		activationConstraint: { distance: 8 },
	});
	const touchSensor = useSensor(TouchSensor, {
		activationConstraint: { delay: 200, tolerance: 5 },
	});
	const keyboardSensor = useSensor(KeyboardSensor);
	const sensors = useSensors(mouseSensor, touchSensor, keyboardSensor);

	// ── TanStack Query ────────────────────────────────────────────────────

	const { data: tickets = [], isLoading } = useTicketsByWorkflow(workflow_id);

	// Deep link: ?ticket=<id> opens the edit slide-over for that ticket once
	// its row is loaded. Derived state (no effect): the modal opens when the
	// param is present AND the ticket exists in the loaded list; the param
	// is stripped on close/in-board selection so it never fights the local
	// state.
	const router = useRouter();
	const searchParams = useSearchParams();
	const pathname = usePathname();
	const requestedTicketId = searchParams.get("ticket") || null;

	const deepLinkedTicket = useMemo(
		() =>
			requestedTicketId
				? (tickets.find((t) => t.ticket_id === requestedTicketId) ?? null)
				: null,
		[tickets, requestedTicketId],
	);

	const clearTicketParam = () => {
		if (!requestedTicketId) return;
		const params = new URLSearchParams(searchParams.toString());
		params.delete("ticket");
		const qs = params.toString();
		router.replace(qs ? `?${qs}` : pathname, { scroll: false });
	};

	// Group once per tickets change — three .filter() passes over the full
	// list on every render become one pass.
	const ticketsByStatus = useMemo(() => {
		const map = new Map<Ticket["status"], Ticket[]>();
		for (const t of tickets) {
			const list = map.get(t.status) ?? [];
			list.push(t);
			map.set(t.status, list);
		}
		return map;
	}, [tickets]);

	const { data: tags = [] } = useTags();

	// Real subtasks: tickets whose parent_id points at a ticket in this
	// workflow. Derived from the flat list (one fetch, no nested include) —
	// same source the editor uses.
	const subtasksByParent = useMemo(() => {
		const map = new Map<string, Ticket[]>();
		for (const t of tickets) {
			if (!t.parent_id) continue;
			const list = map.get(t.parent_id) ?? [];
			list.push(t);
			map.set(t.parent_id, list);
		}
		return map;
	}, [tickets]);

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
	 * Intercepts selection events on individual ticket layout targets to
	 * open the view/edit drawer. Guards against accidental selection right
	 * after a drag ends.
	 * @param ticket - The ticket being inspected.
	 */
	function handleSelectTicket(ticket: Ticket) {
		if (wasDraggingRef.current) return;
		// An in-board selection supersedes any deep-link param.
		clearTicketParam();
		setSelectedTicket(ticket);
		setSlideOverOpen(true);
	}

	/**
	 * Posts the create-modal payload to the server. The modal owns all
	 * toasts (success + failure) — failures propagate to its catch.
	 * @param data - Cleaned payload from the create form (see CreateTicketFormData).
	 */
	async function handleCreateTicket(data: CreateTicketFormData) {
		await createTicketMutation.mutateAsync({
			...data,
			workflow_id: workflow_id,
			status: TicketStatus.PENDING,
			TicketAssigned: data.TicketAssigned ?? [],
			tagIds: data.tagIds ?? [],
			performed_by: user?.profile_id,
		} as CreateTicketParams & { performed_by?: string });
		setModalOpen(false);
	}

	/**
	 * Soft-deletes a ticket via the delete mutation. The ticket disappears
	 * from the board when the server mutation succeeds (query invalidation
	 * refetches the list) — there is no client-side optimistic removal.
	 * `mode` is chosen in the delete dialog: "cascade" removes the whole
	 * subtask subtree, "promote" turns subtasks into top-level tickets.
	 * @param ticketId - The UUID of the ticket to delete.
	 * @param mode - What happens to the ticket's subtasks.
	 */
	async function handleDeleteTicket(
		ticketId: string,
		mode: "cascade" | "promote",
	) {
		try {
			await deleteTicketMutation.mutateAsync({
				ticketId,
				mode,
				performed_by: user?.profile_id,
			});
			// Trigger Success Toast
			toast.add({
				title: "Ticket Deleted",
				description: `Ticket has been deleted successfully.`,
				type: "delete",
			});
		} catch (error) {
			toast.add({
				title: "Delete Failed",
				description:
					error instanceof Error ? error.message : "Something went wrong.",
				type: "error",
			});
		}
	}

	/**
	 * Creates or updates a tag: a `tag_id` targets an update, otherwise the
	 * tag is created. Returns `{ error }` so the TagManager can surface it.
	 * @param input - The tag payload (`tag_id` empty/falsy = create).
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
				await updateTagMutation.mutateAsync({
					tag_id,
					name,
					description,
					color,
				});
			} else {
				await createTagMutation.mutateAsync({ name, description, color });
			}
			return {};
		} catch (err) {
			return {
				error: err instanceof Error ? err.message : "Failed to save tag",
			};
		}
	}

	/**
	 * Soft-deletes a tag.
	 * @param tagId - The tag to remove.
	 */
	function handleDeleteTag(tagId: string) {
		deleteTagMutation.mutate(tagId);
	}

	/**
	 * Records the dragged card id and blocks selection while dragging.
	 * @param event - dnd-kit drag-start payload.
	 */
	function handleDragStart(event: DragStartEvent) {
		if (isClientProfile) return;
		setActiveId(event.active.id as string);
		wasDraggingRef.current = true;
	}

	/**
	 * Moves a ticket to the column it was dropped on (awaited, with an
	 * error toast on failure), then releases the drag lock after a short
	 * delay so the trailing pointer tap doesn't open the slide-over.
	 * @param event - dnd-kit drag-end payload.
	 */
	async function handleDragEnd(event: DragEndEvent) {
		if (isClientProfile) return;
		const { active, over } = event;
		setActiveId(null);

		if (over && active.id !== over.id) {
			const newStatus = over.id as TicketStatus;
			try {
				await updateStatusMutation.mutateAsync({
					ticketId: active.id as string,
					status: newStatus,
					performed_by: user?.profile_id,
				});
			} catch (error) {
				toast.add({
					title: "Move Failed",
					description:
						error instanceof Error ? error.message : "Something went wrong.",
					type: "error",
				});
			}
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
						<Back link={`/projects/${projectId}/stages/${stageId}`} />
					) : (
						<h1 className="text-xl font-bold text-gray-900">{workflowName}</h1>
					)}
				</div>

				<div className="flex items-center gap-3">
					{!isClientProfile && (
						<Button
							onClick={() => setTagManagerOpen(true)}
							className="flex items-center gap-1.5 bg-transparent text-sm font-medium text-gray-600 border-2 border-gray-200 px-4 py-2 rounded-md hover:bg-gray-50 transition-colors"
						>
							<Tag />
							Tags
						</Button>
					)}

					{!isClientProfile && (
						<Button onClick={() => setModalOpen(true)}>
							<Plus />
							New Ticket
						</Button>
					)}
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
								subtasksByParent={subtasksByParent}
								onSelectTicket={handleSelectTicket}
								onDeleteTicket={handleDeleteTicket}
								readOnly={isClientProfile}
							/>
						))}
					</div>
				</div>

				<DragOverlay dropAnimation={null}>
					{activeTicket ? (
						<div className="rotate-2 opacity-90">
							<TicketCardContent
								ticket={activeTicket}
								subtasks={subtasksByParent.get(activeTicket.ticket_id) ?? []}
								onSelect={() => {}}
								onDelete={() => {}}
							/>
						</div>
					) : null}
				</DragOverlay>
			</DndContext>

			<TicketModalEdit
				ticket={selectedTicket ?? deepLinkedTicket}
				isOpen={
					slideOverOpen ||
					(requestedTicketId !== null && deepLinkedTicket !== null)
				}
				onClose={() => {
					setSlideOverOpen(false);
					clearTicketParam();
				}}
				onUpdate={(updated) => setSelectedTicket(updated)}
				tags={tags}
				allTickets={tickets}
				projectId={projectId}
				readOnly={isClientProfile}
			/>

			<TicketModalCreate
				isOpen={modalOpen}
				onClose={() => setModalOpen(false)}
				onCreateTicket={handleCreateTicket}
				tags={tags}
				projectId={projectId}
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
