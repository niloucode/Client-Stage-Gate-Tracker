import { z } from "zod";

// ── Profile (full DB row) ────────────────────────────────────────────────────

export const profileSchema = z.object({
	profile_id: z.uuid(),
	first_name: z.string().trim().min(1),
	last_name: z.string().trim().min(1),
	phone: z.string().nullable(),
	image_id: z.uuid().nullable(),
	client_id: z.uuid().nullable(),
	department_id: z.uuid().nullable(),
	email: z.email(),
	job_title: z.string().nullable(),
	is_deleted: z.boolean().default(false),
	deleted_at: z.date().nullable(),
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
