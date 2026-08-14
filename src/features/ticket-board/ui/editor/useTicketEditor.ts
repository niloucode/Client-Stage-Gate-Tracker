import { useState, useMemo } from "react";
import { Ticket, Tag } from "@/entities/types";
import { status as StatusEnum } from "@/lib/generated/prisma";
import { useAuth } from "@/features/auth";
import { useUpdateTicket, useUpdateTicketParent } from "@/entities/ticket/mutations";
import { toast } from "@/components/ui/toast";

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
	const [submitAttempted, setSubmitAttempted] = useState(false);

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
		return allTickets.filter((t) => {
			if (t.ticket_id === ticket.ticket_id) return false;
			if (t.parent_id !== null) return false;
			return t.status !== StatusEnum.FINISHED;

		});
	}, [allTickets, ticket.ticket_id]);

	const subtasks = useMemo(() => {
		return allTickets.filter((t) => t.parent_id === ticket.ticket_id);
	}, [allTickets, ticket.ticket_id]);

	const isApiTagSelected = selectedTags.some(
		(tagId) => tags.find((t) => t.tag_id === tagId)?.name?.toLowerCase() === "api"
	);

	// Validation conditions
	const isNameInvalid = !ticket.name || !ticket.name.trim() || ticket.name.trim().length > 50;

	const isDateInverted = Boolean(
		ticket.plan_start_at &&
			ticket.plan_end_at &&
			new Date(ticket.plan_start_at) > new Date(ticket.plan_end_at)
	);

	const showDateError = submitAttempted && isDateInverted;
	const showNameError = submitAttempted && isNameInvalid;
	const hasErrors = isNameInvalid || isDateInverted;

	const handleAddSubtask = async (selectedTicket: Ticket) => {
		try {
			await updateTicketParentMutation.mutateAsync({
				ticketId: selectedTicket.ticket_id,
				parentId: ticket.ticket_id,
			});
			setIsSubtaskSelectionOpen(false);
		} catch (error) {
			console.error("Failed to add subtask:", error);
			toast.add({
				title: "Add Subtask Failed",
				description:
					error instanceof Error ? error.message : "Something went wrong.",
				type: "error",
			});
		}
	};

	const handleRemoveSubtask = async (subtaskId: string) => {
		try {
			await updateTicketParentMutation.mutateAsync({
				ticketId: subtaskId,
				parentId: null,
			});
		} catch (error) {
			console.error("Failed to remove subtask:", error);
			toast.add({
				title: "Remove Subtask Failed",
				description:
					error instanceof Error ? error.message : "Something went wrong.",
				type: "error",
			});
		}
	};

	const handleSubtaskClick = (subtask: Ticket) => {
		setSelectedSubtask(subtask);
		setIsSubtaskViewOpen(true);
	};

	async function handleSave() {
		setSubmitAttempted(true);

		if (hasErrors) {
			return;
		}

		try {
			const updated = await updateTicketMutation.mutateAsync({
				ticket_id: ticket.ticket_id,
				workflow_id: ticket.workflow_id,
				name: ticket.name.trim(),
				plan_start_at: ticket.plan_start_at ? new Date(ticket.plan_start_at) : null,
				// Deadline is required (spec) and cannot be cleared in the UI — no fallback.
				plan_end_at: new Date(ticket.plan_end_at),
				actual_start_at: ticket.actual_start_at ? new Date(ticket.actual_start_at) : null,
				actual_end_at: ticket.actual_end_at ? new Date(ticket.actual_end_at) : null,
				status: ticket.status,
				watcher_id: ticket.watcher_id,
				TicketAssigned: ticket.TicketAssigned?.map((a) => a.profile_id) ?? [],
				tagIds: selectedTags,
				description: ticket.description,
				api_route: isApiTagSelected ? (apiRoute || null) : null,
				api_method: isApiTagSelected ? (apiMethod || null) : null,
				// 1-to-1 issue link (spec): persisted via updateTicket.
				issue_id: ticket.issue_id ?? null,
				performed_by: user?.profile_id,
			});
			onUpdate(updated);
			if (!isSubtaskView) onClose();
		} catch (error) {
			console.error("Failed to save ticket:", error);
			toast.add({
				title: "Save Failed",
				description:
					error instanceof Error ? error.message : "An error occurred while saving the ticket.",
				type: "error",
			});
		}
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
		showDateError,
		showNameError,
		isSaving: updateTicketMutation.isPending,
		handleAddSubtask,
		handleRemoveSubtask,
		handleSubtaskClick,
		handleSave,
	};
}