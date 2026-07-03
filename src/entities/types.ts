import Prisma from '@/lib/generated/prisma';
import { status, CommentParentType, ImageParentType } from "@/lib/generated/prisma";
import { selectTicket } from "@/entities/ticket/ticketActions";
import { selectComment } from "@/entities/comment/commentActions";

export interface Profile {
	profile_id: string;
	first_name:string,
	last_name:string,
	email?: string | null;
}

export type Comment = Awaited<ReturnType<typeof selectComment>>[number];

export type Ticket = Awaited<ReturnType<typeof selectTicket>>[number];

export interface TicketTag {
	tag_id: string;
	ticket_id: string;
}

export interface Tag {
	tag_id: string;
	name: string;
	description?: string | null;
	color?: string | null;
	is_deleted: boolean;
	deleted_at: Date | null;
}

export interface Subtask {
	id: string;
	title: string;
	completed: boolean;
}

export interface TicketAssigned {
	ticket_id: string;
	profile_id: string;
	assigned_date: Date;
	Profiles?: Profile | null;
}

export interface TicketSubtask {
	subtask_id: string;
	ticket_id: string;
}