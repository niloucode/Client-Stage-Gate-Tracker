import { z } from "zod";

// ── Client ───────────────────────────────────────────────────────────────────

export const clientSchema = z.object({
	client_id: z.uuid(),
	client_name: z.string().trim().min(1, "Client name is required"),
	tin: z.string().min(1, "TIN is required"),
	billing_address: z.string().min(1, "Billing address is required"),
	email: z.email({ message: "Invalid email address" }),
	phone: z.string().min(1, "Phone number is required"),
	is_deleted: z.boolean().default(false),
	deleted_at: z.date().optional().nullable(),
});

export type ClientType = z.infer<typeof clientSchema>;

// Create input: server-owned fields (client_id, is_deleted, deleted_at) are
// excluded — UUIDs originate from the DB (project rule), never the client.
export const clientCreateSchema = clientSchema.omit({
	client_id: true,
	is_deleted: true,
	deleted_at: true,
});

export type ClientCreateType = z.infer<typeof clientCreateSchema>;
