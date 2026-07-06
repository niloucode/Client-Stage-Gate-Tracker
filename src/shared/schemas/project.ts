import { z } from "zod";

// ── Phase ────────────────────────────────────────────────────────────────────

export const phaseCreateSchema = z.object({
	name: z
		.string()
		.min(1, "Phase name is required")
		.max(20, "Phase name must be 20 characters or less"),
	description: z.string().optional().default(""),
	creation_date: z.date().optional().nullable(),
	deadline_date: z.date().optional().nullable(),
	end_date: z.date().optional().nullable(),
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
	creation_date: z.date().optional().nullable(),
	deadline_date: z.date().optional().nullable(),
	end_date: z.date().optional().nullable(),
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
	creation_date: z.date().optional().nullable(),
	deadline_date: z.date().optional().nullable(),
	end_date: z.date().optional().nullable(),
});

export const workflowUpdateSchema = workflowCreateSchema.partial();

export type WorkflowCreateInput = z.infer<typeof workflowCreateSchema>;
export type WorkflowUpdateInput = z.infer<typeof workflowUpdateSchema>;
