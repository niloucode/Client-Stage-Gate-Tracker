export type { TicketPayload as Ticket } from "@/entities/ticket/types";
export type { CommentWithImages as Comment } from "@/entities/comment/types";

export interface Profile {
	profile_id: string;
	first_name:string,
	last_name:string,
	email?: string | null;
}

export interface TicketTag {
	tag_id: string;
	ticket_id: string;
}

export type { Tag } from "@/shared/schemas";

export interface TicketAssigned {
	ticket_id: string;
	profile_id: string;
	assigned_date: Date;
	Profiles?: Profile | null;
}

export interface Contract {
	contract_id: string;  
	contract_name: string | null;
	project_id: string;
	client_id: string;
	file_path: string | null;
	client_signature: String | null;
	is_deleted: boolean;
	deleted_at: Date | null;
	project_owner_signature: String | null;
	client_signed_at: Date | null;
	project_owner_signed_at: Date | null;
}