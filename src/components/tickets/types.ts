import Prisma from '@/lib/generated/prisma';
import { status, CommentParentType, ImageParentType } from "@/lib/generated/prisma";
import { selectTicket } from "@/actions/ticketActions";
import { selectComment } from "@/actions/commentActions";

export interface Assignee {
  name: string;
  initials: string;
  bgColor: string;
}

export interface Profile {
  profile_id: string;
  first_name:string,
  last_name:string,
  email?: string | null;
}

export type Comment = Awaited<ReturnType<typeof selectComment>>[number];

export type Ticket = Awaited<ReturnType<typeof selectTicket>>[number];
// export interface Ticket {
//   ticket_id: string;
//   name: string;
//   description?: string | null;
//   status: status;
//   workflow_id: string | null; // Changed to allow null since Prisma says String?
//
//   // Dates
//   creation_date: Date;
//   assignment_date: Date;
//   deadline_date: Date;
//   start_date?: Date | null;
//   end_date?: Date | null;
//   deleted_at?: Date | null;
//   is_deleted: boolean;
//
//   // Foreign keys
//   assigner_id: string | null;
//   watcher_id: string | null;
//
//   // Relations (Named exactly like your Prisma schema fields)
//   TicketTags?: TicketTag[];
//   TicketAssigned: TicketAssigned[];
//   TicketSubtasks_TicketSubtasks_ticket_idToTickets?: TicketSubtask[];
//
//   Profiles_Tickets_assigner_idToProfiles?: Profile | null;
//   Profiles_Tickets_watcher_idToProfiles?: Profile | null;
// }

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

export interface Attachment {
  id: string;
  name: string;
  type: 'file' | 'image';
}

export interface ActivityItem {
  id: string;
  Profile: Assignee;
  action: string;
  time: string;
  highlight?: string;
  highlightColor?: string;
  dotColor?: string;
}

export interface Column {
  id: 'PENDING' | 'IN_PROGRESS' | 'FINISHED';
  title: string;
  dotColor: string;
}

export const COLUMNS: Column[] = [
  { id: 'PENDING', title: 'Pending', dotColor: 'bg-gray-400' },
  { id: 'IN_PROGRESS', title: 'In Progress', dotColor: 'bg-blue-500' },
  { id: 'FINISHED', title: 'Finished', dotColor: 'bg-green-500' },
];
