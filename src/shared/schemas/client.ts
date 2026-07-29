import { z } from "zod";

// ── Client ───────────────────────────────────────────────────────────────────

export const clientSchema = z.object({
  client_id: z.string().uuid(),
  client_name: z.string().trim().min(1, "Client name is required"),
  tin: z.string().min(1, "TIN is required"),
  billing_address: z.string().min(1, "Billing address is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(1, "Phone number is required"),
  is_deleted: z.boolean().default(false),
  deleted_at: z.date().optional().nullable(),
});

export type ClientType = z.infer<typeof clientSchema>;
