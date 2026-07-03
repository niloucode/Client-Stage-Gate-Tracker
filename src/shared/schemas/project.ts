import { z } from "zod";

// ── Phase ────────────────────────────────────────────────────────────────────

export const phaseSchema = z.object({
  name: z.string().min(1, "Phase name is required"),
  subtitle: z.string().optional().default(""),
  description: z.string().optional().default(""),
});

export type PhaseInput = z.infer<typeof phaseSchema>;

// ── Module ───────────────────────────────────────────────────────────────────

export const moduleSchema = z.object({
  name: z.string().min(1, "Module name is required"),
  description: z.string().optional().default(""),
  roles: z.string().optional().default(""),
});

export type ModuleInput = z.infer<typeof moduleSchema>;

// ── Workflow ─────────────────────────────────────────────────────────────────

export const workflowSchema = z.object({
  name: z.string().min(1, "Workflow name is required"),
  tags: z.string().optional().default(""),
});

export type WorkflowInput = z.infer<typeof workflowSchema>;
