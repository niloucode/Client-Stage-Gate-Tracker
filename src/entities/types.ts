export type EntityFilterStatus = "active" | "deleted" | "all";

export type { TicketPayload as Ticket } from "@/entities/ticket/types";
export type { CommentWithImages as Comment } from "@/entities/comment/types";

export interface Profile {
	profile_id: string;
	first_name: string;
	last_name: string;
	email?: string | null;
}

export type { Tag } from "@/shared/schemas";

export interface TicketAssigned {
	ticket_id: string;
	profile_id: string;
	assigned_date: Date;
	Profiles?: Profile | null;
}

// Landing dashboard view modes (role-resolution output, entities/roleAssignment).
export type DashboardRole = "client" | "owner" | "staff";
