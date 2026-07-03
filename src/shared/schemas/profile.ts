import { z } from "zod";

// ── Profile (full DB row) ────────────────────────────────────────────────────

export const profileSchema = z.object({
  profile_id: z.string().uuid(),
  first_name: z.string().min(1),
  last_name: z.string().min(1),
  phone: z.string(),
  image_id: z.string().uuid().optional().nullable(),
  client_id: z.string().uuid().optional().nullable(),
  department_id: z.string().uuid().optional().nullable(),
  email: z.string().email(),
  job_title: z.string().optional().nullable(),
  is_deleted: z.boolean().default(false),
  deleted_at: z.date().optional().nullable(),
});

export type ProfileType = z.infer<typeof profileSchema>;

// ── Display profile (subset used in UI dropdowns / assignee lists) ───────────

export const profileDisplaySchema = profileSchema.pick({
  profile_id: true,
  first_name: true,
  last_name: true,
  email: true,
});

export type ProfileDisplay = z.infer<typeof profileDisplaySchema>;
