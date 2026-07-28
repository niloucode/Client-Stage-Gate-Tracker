import { z } from "zod";

// ── Create ticket ────────────────────────────────────────────────────────────

export const ticketCreateSchema = z.object({
  name: z.string().trim().min(1, "Ticket name is required").max(50, "Ticket name must be 50 characters or less"),
  description: z.string().optional().nullable(),
  deadline_date: z.date({ message: "Deadline is required" }),
  watcher_id: z.string().uuid().optional().nullable(),
  tagIds: z.array(z.string().uuid()).optional().nullable(),
  finish_date: z.date().optional().nullable(),
  api_route: z.string().optional().nullable(),
  api_method: z.enum(["GET", "POST", "PUT", "DELETE"]).optional().nullable(),
});

export type TicketCreateInput = z.infer<typeof ticketCreateSchema>;

// ── Create ticket (full server-action params) ────────────────────────────────

export type CreateTicketParams = TicketCreateInput & {
  workflow_id: string | null;
  status: import("@/lib/generated/prisma").status;
  TicketAssigned: string[] | null;
  tagIds: string[] | null;
  image_urls?: string[];
};

// ── Update ticket ────────────────────────────────────────────────────────────

export const ticketUpdateSchema = ticketCreateSchema.partial().extend({
  status: z.enum(["PENDING", "IN_PROGRESS", "FINISHED"]).optional(),
});

export type TicketUpdateInput = z.infer<typeof ticketUpdateSchema>;

// ── Comment ──────────────────────────────────────────────────────────────────

export const commentCreateSchema = z.object({
	profile_id: z.string().uuid(),
	description: z.string().min(1, "Comment cannot be empty"),
	parent_type: z.enum(["TICKET_COMMENT", "GATE_COMMENT"]),
	parent_id: z.string().uuid(),
	imageUrls: z.array(z.string()).optional().default([]),
});

export type CommentCreateInput = z.infer<typeof commentCreateSchema>;

// ── Update ticket (full server-action params) ────────────────────────────────

export type UpdateTicketParams = TicketUpdateInput & {
  ticket_id: string;
  workflow_id: string | null;
  TicketAssigned: string[];
  tagIds: string[];
};
