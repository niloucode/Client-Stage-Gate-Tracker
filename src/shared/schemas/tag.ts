import { z } from "zod";

// ── Tag ──────────────────────────────────────────────────────────────────────

export const tagSchema = z.object({
  tag_id: z.string().uuid(),
  name: z.string().min(1, "Tag name is required"),
  description: z.string().optional().nullable(),
  color: z.string().optional().nullable(),
  is_deleted: z.boolean().default(false),
  deleted_at: z.date().optional().nullable(),
});

export type Tag = z.infer<typeof tagSchema>;

// ── Create tag (subset for form input) ───────────────────────────────────────

export const tagCreateSchema = z.object({
  name: z.string().min(1, "Tag name is required"),
  description: z.string().optional(),
  color: z.string().optional(),
  tag_id: z.string().optional(),
});

export type TagCreateInput = z.infer<typeof tagCreateSchema>;

// ── Update tag ───────────────────────────────────────────────────────────────

export const tagUpdateSchema = tagCreateSchema.extend({
  tag_id: z.string().min(1, "Tag ID is required"),
});

export type TagUpdateInput = z.infer<typeof tagUpdateSchema>;
