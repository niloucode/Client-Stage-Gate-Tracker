import { z } from "zod";

// ── Create ticket ────────────────────────────────────────────────────────────
// Date fields follow the database column names:
//   plan_start_at    → planned start of the entity
//   plan_end_at      → planned end (previously "deadline")
//   actual_start_at  → when the entity went from PENDING to IN_PROGRESS
//   actual_end_at    → when the entity finished (previously "end date")

export const ticketCreateSchema = z.object({
	name: z.string().trim().min(1, "Ticket name is required").max(50, "Ticket name must be 50 characters or less"),
	description: z.string().max(360, "Description must be 360 characters or less").optional().nullable(),
	watcher_id: z.uuid().optional().nullable(),
	tagIds: z.array(z.uuid()).optional().nullable(),
	plan_start_at: z.date().optional().nullable(),
	plan_end_at: z.date({ message: "Deadline is required" }),
	actual_start_at: z.date().optional().nullable(),
	actual_end_at: z.date().optional().nullable(),
	api_route: z.string().optional().nullable(),
	api_method: z.enum(["GET", "POST", "PUT", "DELETE"]).optional().nullable(),
});

export type TicketCreateInput = z.infer<typeof ticketCreateSchema>;

// ── Create ticket (full server-action params) ────────────────────────────────

export type CreateTicketParams = TicketCreateInput & {
	// Every ticket must belong to a workflow (schema invariant: NOT NULL).
	workflow_id: string;
	status: import("@/lib/generated/prisma").status;
	TicketAssigned: string[] | null;
	tagIds: string[] | null;
	image_urls?: string[];
};

// ── Update ticket ────────────────────────────────────────────────────────────

export const ticketUpdateSchema = ticketCreateSchema.partial().extend({
  status: z.enum(["PENDING", "IN_PROGRESS", "FINISHED"]).optional(),
  parent_id: z.uuid().optional().nullable(),
});

export type TicketUpdateInput = z.infer<typeof ticketUpdateSchema>;

// ── Comment ──────────────────────────────────────────────────────────────────

export const commentCreateSchema = z.object({
	profile_id: z.uuid(),
	description: z.string().min(1, "Comment cannot be empty"),
	parent_type: z.enum(["TICKET_COMMENT", "GATE_COMMENT"]),
	parent_id: z.uuid(),
	imageUrls: z.array(z.string()).optional().default([]),
});

export type CommentCreateInput = z.infer<typeof commentCreateSchema>;

// ── Update ticket (full server-action params) ────────────────────────────────

export type UpdateTicketParams = TicketUpdateInput & {
  ticket_id: string;
  workflow_id: string;
  TicketAssigned: string[];
  tagIds: string[];
  parent_id?: string | null;
};