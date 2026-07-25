import { z } from "zod";

// ── Project ──────────────────────────────────────────────────────────────────

const baseProject = z.object({
  name: z.string().min(1, "Project name is required").max(50, "Project name must be 50 characters or less"),
  description: z.string().max(160, "Description must be 160 characters or less").optional().default(""),
  client_id: z.string().uuid("Invalid client ID").optional().nullable(),
  start_date: z.date().optional().nullable(),
  deadline_date: z.date().optional().nullable(),
});

export const projectCreateSchema = baseProject.refine(
  (data) => !data.start_date || !data.deadline_date || data.start_date <= data.deadline_date,
  { message: "Start date must be before or equal to deadline date", path: ["start_date"] }
);

export const projectUpdateSchema = baseProject.partial().extend({
  project_id: z.string().uuid("Invalid project ID"),
}).refine(
  (data) => !data.start_date || !data.deadline_date || data.start_date <= data.deadline_date,
  { message: "Start date must be before or equal to deadline date", path: ["start_date"] }
);

export const projectDeleteSchema = z.object({
  project_id: z.string().uuid("Invalid project ID"),
  confirmation_name: z.string().min(1, "Project name confirmation is required"),
});

export type ProjectCreateInput = z.infer<typeof projectCreateSchema>;
export type ProjectUpdateInput = z.infer<typeof projectUpdateSchema>;
export type ProjectDeleteInput = z.infer<typeof projectDeleteSchema>;

// ── Phase ────────────────────────────────────────────────────────────────────

const basePhase = z.object({
  name: z.string().min(1, "Phase name is required").max(20, "Phase name must be 20 characters or less"),
  description: z.string().optional().default(""),
  start_date: z.date().optional().nullable(),
  deadline_date: z.date().optional().nullable(),
  finish_date: z.date().optional().nullable(),
});

export const phaseCreateSchema = basePhase.refine(
  (data) => !data.start_date || !data.deadline_date || data.start_date <= data.deadline_date,
  { message: "Start date must be before or equal to deadline date", path: ["start_date"] }
);

export const phaseUpdateSchema = basePhase.partial().refine(
  (data) => !data.start_date || !data.deadline_date || data.start_date <= data.deadline_date,
  { message: "Start date must be before or equal to deadline date", path: ["start_date"] }
);

export type PhaseCreateInput = z.infer<typeof phaseCreateSchema>;
export type PhaseUpdateInput = z.infer<typeof phaseUpdateSchema>;

// ── Module ───────────────────────────────────────────────────────────────────

const baseModule = z.object({
  name: z.string().min(1, "Module name is required").max(35, "Module name must be 35 characters or less"),
  start_date: z.date().optional().nullable(),
  deadline_date: z.date().optional().nullable(),
  finish_date: z.date().optional().nullable(),
});

export const moduleCreateSchema = baseModule.refine(
  (data) => !data.start_date || !data.deadline_date || data.start_date <= data.deadline_date,
  { message: "Start date must be before or equal to deadline date", path: ["start_date"] }
);

export const moduleUpdateSchema = baseModule.partial().refine(
  (data) => !data.start_date || !data.deadline_date || data.start_date <= data.deadline_date,
  { message: "Start date must be before or equal to deadline date", path: ["start_date"] }
);

export type ModuleCreateInput = z.infer<typeof moduleCreateSchema>;
export type ModuleUpdateInput = z.infer<typeof moduleUpdateSchema>;

// ── Workflow ─────────────────────────────────────────────────────────────────

const baseWorkflow = z.object({
  name: z.string().min(1, "Workflow name is required").max(35, "Workflow name must be 35 characters or less"),
  start_date: z.date().optional().nullable(),
  deadline_date: z.date().optional().nullable(),
  finish_date: z.date().optional().nullable(),
});

export const workflowCreateSchema = baseWorkflow.refine(
  (data) => !data.start_date || !data.deadline_date || data.start_date <= data.deadline_date,
  { message: "Start date must be before or equal to deadline date", path: ["start_date"] }
);

export const workflowUpdateSchema = baseWorkflow.partial().refine(
  (data) => !data.start_date || !data.deadline_date || data.start_date <= data.deadline_date,
  { message: "Start date must be before or equal to deadline date", path: ["start_date"] }
);

export type WorkflowCreateInput = z.infer<typeof workflowCreateSchema>;
export type WorkflowUpdateInput = z.infer<typeof workflowUpdateSchema>;