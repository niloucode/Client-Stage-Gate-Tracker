import { useState, useMemo } from "react";
import { Ticket, Tag } from "@/entities/types";
import { status as StatusEnum } from "@/lib/generated/prisma";
import { useAuth } from "@/features/auth";
import { useUpdateTicket, useUpdateTicketParent } from "@/entities/ticket/mutations";

const DUMMY_SUBTICKETS: Ticket[] = [
	{
		ticket_id: "dummy-subt123ask-1",
		name: "Design Database Schema for Subtasks",
		status: StatusEnum.IN_PROGRESS,
		workflow_id: "dummy-workflow",
		parent_id: null,
		assignment_date: new Date(),
		plan_start_at: new Date("2026-08-10"),
		plan_end_at: new Date("2026-08-15"),
		actual_start_at: new Date("2026-08-10"),
		actual_end_at: null,
		is_deleted: false,
		deleted_at: null,
		description: "Create relational model and migration for nested subtasks.",
		watcher_id: null,
		api_route: null,
		api_method: null,
		issue_id: null,
		TicketTags: [],
		TicketAssigned: [],
		Profile: null,
	},
	{
		ticket_id: "du123mmy-subtask-2",
		name: "Implement Subtask Selection UI Component",
		status: StatusEnum.PENDING,
		workflow_id: "dummy-workflow",
		parent_id: null,
		assignment_date: new Date(),
		plan_start_at: new Date("2026-08-12"),
		plan_end_at: new Date("2026-08-18"),
		actual_start_at: null,
		actual_end_at: null,
		is_deleted: false,
		deleted_at: null,
		description: "Modal dialog to search and pick available tickets as subtasks.",
		watcher_id: null,
		api_route: null,
		api_method: null,
		issue_id: null,
		TicketTags: [],
		TicketAssigned: [],
		Profile: null,
	},
	{
		ticket_id: "dummy-subt123ask-3",
		name: "Add Subtask Invalidation & State Updates",
		status: StatusEnum.PENDING,
		workflow_id: "dummy-workflow",
		parent_id: null,
		assignment_date: new Date(),
		plan_start_at: new Date("2026-08-14"),
		plan_end_at: new Date("2026-08-20"),
		actual_start_at: null,
		actual_end_at: null,
		is_deleted: false,
		deleted_at: null,
		description: "Ensure TanStack query cache updates when a subtask is attached or removed.",
		watcher_id: null,
		api_route: null,
		api_method: null,
		issue_id: null,
		TicketTags: [],
		TicketAssigned: [],
		Profile: null,
	},
	{
		ticket_id: "du123mmy-subtask-4",
		name: "API Endpoint Integration Testing",
		status: StatusEnum.IN_PROGRESS,
		workflow_id: "dummy-workflow",
		parent_id: null,
		assignment_date: new Date(),
		plan_start_at: new Date("2026-08-15"),
		plan_end_at: new Date("2026-08-22"),
		actual_start_at: new Date("2026-08-15"),
		actual_end_at: null,
		is_deleted: false,
		deleted_at: null,
		description: "Verify subtask parent_id updates on database mutations.",
		watcher_id: null,
		api_route: null,
		api_method: null,
		issue_id: null,
		TicketTags: [],
		TicketAssigned: [],
		Profile: null,
	},
	{
		ticket_id: "dummy-sub123task-1",
		name: "Design Database Schema for Subtasks",
		status: StatusEnum.IN_PROGRESS,
		workflow_id: "dummy-workflow",
		parent_id: null,
		assignment_date: new Date(),
		plan_start_at: new Date("2026-08-10"),
		plan_end_at: new Date("2026-08-15"),
		actual_start_at: new Date("2026-08-10"),
		actual_end_at: null,
		is_deleted: false,
		deleted_at: null,
		description: "Create relational model and migration for nested subtasks.",
		watcher_id: null,
		api_route: null,
		api_method: null,
		issue_id: null,
		TicketTags: [],
		TicketAssigned: [],
		Profile: null,
	},
	{
		ticket_id: "dumm123y-subtask-2",
		name: "Implement Subtask Selection UI Component",
		status: StatusEnum.PENDING,
		workflow_id: "dummy-workflow",
		parent_id: null,
		assignment_date: new Date(),
		plan_start_at: new Date("2026-08-12"),
		plan_end_at: new Date("2026-08-18"),
		actual_start_at: null,
		actual_end_at: null,
		is_deleted: false,
		deleted_at: null,
		description: "Modal dialog to search and pick available tickets as subtasks.",
		watcher_id: null,
		api_route: null,
		api_method: null,
		issue_id: null,
		TicketTags: [],
		TicketAssigned: [],
		Profile: null,
	},
	{
		ticket_id: "dummy321-subtask-3",
		name: "Add Subtask Invalidation & State Updates",
		status: StatusEnum.PENDING,
		workflow_id: "dummy-workflow",
		parent_id: null,
		assignment_date: new Date(),
		plan_start_at: new Date("2026-08-14"),
		plan_end_at: new Date("2026-08-20"),
		actual_start_at: null,
		actual_end_at: null,
		is_deleted: false,
		deleted_at: null,
		description: "Ensure TanStack query cache updates when a subtask is attached or removed.",
		watcher_id: null,
		api_route: null,
		api_method: null,
		issue_id: null,
		TicketTags: [],
		TicketAssigned: [],
		Profile: null,
	},
	{
		ticket_id: "dummy-subt123ask-4",
		name: "API Endpoint Integration Testing",
		status: StatusEnum.IN_PROGRESS,
		workflow_id: "dummy-workflow",
		parent_id: null,
		assignment_date: new Date(),
		plan_start_at: new Date("2026-08-15"),
		plan_end_at: new Date("2026-08-22"),
		actual_start_at: new Date("2026-08-15"),
		actual_end_at: null,
		is_deleted: false,
		deleted_at: null,
		description: "Verify subtask parent_id updates on database mutations.",
		watcher_id: null,
		api_route: null,
		api_method: null,
		issue_id: null,
		TicketTags: [],
		TicketAssigned: [],
		Profile: null,
	},
	{
		ticket_id: "dumm32y-subtask-1",
		name: "Design Database Schema for Subtasks",
		status: StatusEnum.IN_PROGRESS,
		workflow_id: "dummy-workflow",
		parent_id: null,
		assignment_date: new Date(),
		plan_start_at: new Date("2026-08-10"),
		plan_end_at: new Date("2026-08-15"),
		actual_start_at: new Date("2026-08-10"),
		actual_end_at: null,
		is_deleted: false,
		deleted_at: null,
		description: "Create relational model and migration for nested subtasks.",
		watcher_id: null,
		api_route: null,
		api_method: null,
		issue_id: null,
		TicketTags: [],
		TicketAssigned: [],
		Profile: null,
	},
	{
		ticket_id: "dummy-s123ubtask-2",
		name: "Implement Subtask Selection UI Component",
		status: StatusEnum.PENDING,
		workflow_id: "dummy-workflow",
		parent_id: null,
		assignment_date: new Date(),
		plan_start_at: new Date("2026-08-12"),
		plan_end_at: new Date("2026-08-18"),
		actual_start_at: null,
		actual_end_at: null,
		is_deleted: false,
		deleted_at: null,
		description: "Modal dialog to search and pick available tickets as subtasks.",
		watcher_id: null,
		api_route: null,
		api_method: null,
		issue_id: null,
		TicketTags: [],
		TicketAssigned: [],
		Profile: null,
	},
	{
		ticket_id: "dum3213my-subtask-3",
		name: "Add Subtask Invalidation & State Updates",
		status: StatusEnum.PENDING,
		workflow_id: "dummy-workflow",
		parent_id: null,
		assignment_date: new Date(),
		plan_start_at: new Date("2026-08-14"),
		plan_end_at: new Date("2026-08-20"),
		actual_start_at: null,
		actual_end_at: null,
		is_deleted: false,
		deleted_at: null,
		description: "Ensure TanStack query cache updates when a subtask is attached or removed.",
		watcher_id: null,
		api_route: null,
		api_method: null,
		issue_id: null,
		TicketTags: [],
		TicketAssigned: [],
		Profile: null,
	},
	{
		ticket_id: "dum123my-subtask-4",
		name: "API Endpoint Integration Testing",
		status: StatusEnum.IN_PROGRESS,
		workflow_id: "dummy-workflow",
		parent_id: null,
		assignment_date: new Date(),
		plan_start_at: new Date("2026-08-15"),
		plan_end_at: new Date("2026-08-22"),
		actual_start_at: new Date("2026-08-15"),
		actual_end_at: null,
		is_deleted: false,
		deleted_at: null,
		description: "Verify subtask parent_id updates on database mutations.",
		watcher_id: null,
		api_route: null,
		api_method: null,
		issue_id: null,
		TicketTags: [],
		TicketAssigned: [],
		Profile: null,
	},
];

export function useTicketEditor({
	initialTicket,
	tags,
	onUpdate,
	onClose,
	isSubtaskView,
	allTickets = [],
}: {
	initialTicket: Ticket;
	tags: Tag[];
	onUpdate: (updated: Ticket) => void;
	onClose: () => void;
	isSubtaskView?: boolean;
	allTickets?: Ticket[];
}) {
	const [ticket, setTicket] = useState<Ticket>(initialTicket);

	const [localDummyTickets, setLocalDummyTickets] = useState<Ticket[]>(() => [
		{
			...DUMMY_SUBTICKETS[0],
			parent_id: initialTicket.ticket_id,
		},
		...DUMMY_SUBTICKETS.slice(1),
	]);

	const combinedTickets = useMemo(() => {
		return [...allTickets, ...localDummyTickets];
	}, [allTickets, localDummyTickets]);

	const [selectedTags, setSelectedTags] = useState<string[]>(
		initialTicket.TicketTags?.map((t: { tag_id: string }) => t.tag_id) ?? []
	);
	const [apiMethod, setApiMethod] = useState<"GET" | "POST" | "PUT" | "DELETE">(
		(initialTicket.api_method as "GET" | "POST" | "PUT" | "DELETE") || "GET"
	);
	const [apiRoute, setApiRoute] = useState(initialTicket.api_route || "");
	const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);

	const [selectedSubtask, setSelectedSubtask] = useState<Ticket | null>(null);
	const [isSubtaskSelectionOpen, setIsSubtaskSelectionOpen] = useState(false);
	const [isSubtaskViewOpen, setIsSubtaskViewOpen] = useState(false);

	const { user } = useAuth();
	const updateTicketMutation = useUpdateTicket();
	const updateTicketParentMutation = useUpdateTicketParent();

	const availableTickets = useMemo(() => {
		return combinedTickets.filter((t) => {
			if (t.ticket_id === ticket.ticket_id) return false;
			if (t.parent_id !== null) return false;
			if (t.status === StatusEnum.FINISHED) return false;
			return true;
		});
	}, [combinedTickets, ticket.ticket_id]);

	const subtasks = useMemo(() => {
		return combinedTickets.filter((t) => t.parent_id === ticket.ticket_id);
	}, [combinedTickets, ticket.ticket_id]);

	const isApiTagSelected = selectedTags.some(
		(tagId) => tags.find((t) => t.tag_id === tagId)?.name?.toLowerCase() === "api"
	);

	const handleAddSubtask = async (selectedTicket: Ticket) => {
		try {
			if (selectedTicket.ticket_id.startsWith("dummy-")) {
				setLocalDummyTickets((prev) =>
					prev.map((t) =>
						t.ticket_id === selectedTicket.ticket_id
							? { ...t, parent_id: ticket.ticket_id }
							: t
					)
				);
				setIsSubtaskSelectionOpen(false);
				return;
			}
			await updateTicketParentMutation.mutateAsync({
				ticketId: selectedTicket.ticket_id,
				parentId: ticket.ticket_id,
			});
			setIsSubtaskSelectionOpen(false);
		} catch (error) {
			console.error("Failed to add subtask:", error);
		}
	};

	const handleRemoveSubtask = async (subtaskId: string) => {
		try {
			if (subtaskId.startsWith("dummy-")) {
				setLocalDummyTickets((prev) =>
					prev.map((t) =>
						t.ticket_id === subtaskId ? { ...t, parent_id: null } : t
					)
				);
				return;
			}
			await updateTicketParentMutation.mutateAsync({
				ticketId: subtaskId,
				parentId: null,
			});
		} catch (error) {
			console.error("Failed to remove subtask:", error);
		}
	};

	const handleSubtaskClick = (subtask: Ticket) => {
		setSelectedSubtask(subtask);
		setIsSubtaskViewOpen(true);
	};

	async function handleSave() {
		const updated = await updateTicketMutation.mutateAsync({
			ticket_id: ticket.ticket_id,
			workflow_id: ticket.workflow_id,
			name: ticket.name,
			plan_start_at: ticket.plan_start_at ? new Date(ticket.plan_start_at) : null,
			plan_end_at: ticket.plan_end_at ? new Date(ticket.plan_end_at) : new Date(),
			actual_start_at: ticket.actual_start_at ? new Date(ticket.actual_start_at) : null,
			actual_end_at: ticket.actual_end_at ? new Date(ticket.actual_end_at) : null,
			status: ticket.status,
			watcher_id: ticket.watcher_id,
			TicketAssigned: ticket.TicketAssigned?.map((a) => a.profile_id) ?? [],
			tagIds: selectedTags,
			description: ticket.description,
			api_route: isApiTagSelected ? (apiRoute || null) : null,
			api_method: isApiTagSelected ? (apiMethod || null) : null,
			performed_by: user?.profile_id,
		});
		onUpdate(updated);
		if (!isSubtaskView) onClose();
	}

	return {
		ticket,
		setTicket,
		onUpdate,
		selectedTags,
		setSelectedTags,
		apiMethod,
		setApiMethod,
		apiRoute,
		setApiRoute,
		lightboxSrc,
		setLightboxSrc,
		selectedSubtask,
		setSelectedSubtask,
		isSubtaskSelectionOpen,
		setIsSubtaskSelectionOpen,
		isSubtaskViewOpen,
		setIsSubtaskViewOpen,
		user,
		subtasks,
		availableTickets,
		isApiTagSelected,
		handleAddSubtask,
		handleRemoveSubtask,
		handleSubtaskClick,
		handleSave,
	};
}