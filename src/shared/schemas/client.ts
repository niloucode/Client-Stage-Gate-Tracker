import { z } from "zod";

// ── Client ───────────────────────────────────────────────────────────────────

export const clientSchema = z.object({
  client_id: z.string().uuid(),
  client_name: z.string().min(1),
  tin: z.string().min(1),
  billing_address: z.string(),
  is_deleted: z.boolean().default(false),
  deleted_at: z.date().optional().nullable(),
});

export type ClientType = z.infer<typeof clientSchema>;
