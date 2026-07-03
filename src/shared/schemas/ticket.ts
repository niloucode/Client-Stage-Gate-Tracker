import { z } from "zod";

// ── Create ticket ────────────────────────────────────────────────────────────

export const ticketCreateSchema = z.object({
  name: z.string().min(1, "Ticket name is required").max(25, "Ticket name must be 25 characters or less"),
  description: z.string().optional().nullable(),
  deadline_date: z.date({ message: "Deadline is required" }),
  watcher_id: z.string().uuid().optional().nullable(),
  tagIds: z.array(z.string().uuid()).optional().nullable(),
  start_date: z.date().optional().nullable(),
  end_date: z.date().optional().nullable(),
});

export type TicketCreateInput = z.infer<typeof ticketCreateSchema>;

// ── Update ticket ────────────────────────────────────────────────────────────

export const ticketUpdateSchema = ticketCreateSchema.partial().extend({
  status: z.enum(["PENDING", "IN_PROGRESS", "FINISHED"]).optional(),
});

export type TicketUpdateInput = z.infer<typeof ticketUpdateSchema>;
