import { z } from "zod";

// ── Phase ────────────────────────────────────────────────────────────────────

export const phaseCreateSchema = z.object({
	name: z
		.string()
		.min(1, "Phase name is required")
		.max(20, "Phase name must be 20 characters or less"),
	description: z.string().optional().default(""),
	start_date: z.date().optional().nullable(),
	deadline_date: z.date().optional().nullable(),
	finish_date: z.date().optional().nullable(),
});

export const phaseUpdateSchema = phaseCreateSchema.partial();

export type PhaseCreateInput = z.infer<typeof phaseCreateSchema>;
export type PhaseUpdateInput = z.infer<typeof phaseUpdateSchema>;

// ── Module ───────────────────────────────────────────────────────────────────

export const moduleCreateSchema = z.object({
	name: z
		.string()
		.min(1, "Module name is required")
		.max(35, "Module name must be 35 characters or less"),
	start_date: z.date().optional().nullable(),
	deadline_date: z.date().optional().nullable(),
	finish_date: z.date().optional().nullable(),
});

export const moduleUpdateSchema = moduleCreateSchema.partial();

export type ModuleCreateInput = z.infer<typeof moduleCreateSchema>;
export type ModuleUpdateInput = z.infer<typeof moduleUpdateSchema>;

// ── Workflow ─────────────────────────────────────────────────────────────────

export const workflowCreateSchema = z.object({
	name: z
		.string()
		.min(1, "Workflow name is required")
		.max(35, "Workflow name must be 35 characters or less"),
	start_date: z.date().optional().nullable(),
	deadline_date: z.date().optional().nullable(),
	finish_date: z.date().optional().nullable(),
});

export const workflowUpdateSchema = workflowCreateSchema.partial();

export type WorkflowCreateInput = z.infer<typeof workflowCreateSchema>;
export type WorkflowUpdateInput = z.infer<typeof workflowUpdateSchema>;

// ── Project ──────────────────────────────────────────────────────────────────

export const projectCreateSchema = z.object({
	name: z.string().min(1, "Project name is required").max(50, "Project name must be 50 characters or less"),
	description: z.string().max(2000, "Description must be 2000 characters or less").optional().default(""),
	client_id: z.string().uuid("Invalid client ID").optional().nullable(),
	start_date: z.date().optional().nullable(),
	deadline_date: z.date().optional().nullable(),
});

export const projectUpdateSchema = projectCreateSchema.partial().extend({
	project_id: z.string().uuid("Invalid project ID"),
});

export const projectDeleteSchema = z.object({
	project_id: z.string().uuid("Invalid project ID"),
	confirmation_name: z.string().min(1, "Project name confirmation is required"),
});

export type ProjectCreateInput = z.infer<typeof projectCreateSchema>;
export type ProjectUpdateInput = z.infer<typeof projectUpdateSchema>;
export type ProjectDeleteInput = z.infer<typeof projectDeleteSchema>;
