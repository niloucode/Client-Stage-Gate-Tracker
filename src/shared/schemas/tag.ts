import { z } from "zod";

// ── Tag ──────────────────────────────────────────────────────────────────────

export const tagSchema = z.object({
	tag_id: z.uuid(),
	name: z.string().trim().min(1, "Tag name is required"),
	description: z.string().nullable().optional(),
	color: z.string().nullable().optional(),
	is_deleted: z.boolean().default(false),
	deleted_at: z.date().nullable().optional(),
});

export type Tag = z.infer<typeof tagSchema>;

// ── Create tag (subset for form input) ───────────────────────────────────────

export const tagCreateSchema = z.object({
	name: z
		.string()
		.min(1, "Tag name is required")
		.max(10, "Tag name must be 10 characters or less"),
	description: z
		.string()
		.max(35, "Description must be 35 characters or less")
		.optional()
		.nullable(),
	color: z.string().optional().nullable(),
	tag_id: z.string().optional(),
});

export type TagCreateInput = z.infer<typeof tagCreateSchema>;

// ── Update tag ───────────────────────────────────────────────────────────────

export const tagUpdateSchema = tagCreateSchema.extend({
	tag_id: z.uuid({ message: "Tag ID is required" }),
});

export type TagUpdateInput = z.infer<typeof tagUpdateSchema>;
