import { z } from "zod";
import {
	hasValidActualRange,
	hasValidPlannedRange,
	toSchedulingDates,
} from "@/shared/lib/scheduling";

// ── Project ──────────────────────────────────────────────────────────────────

const baseProject = z.object({
	name: z
		.string()
		.trim()
		.min(1, "Project name is required")
		.max(50, "Project name must be 50 characters or less"),
	description: z
		.string()
		.max(160, "Description must be 160 characters or less")
		.optional()
		.default(""),
	client_id: z.uuid({ message: "Selecting a client is required" }),
	// Project plan dates are REQUIRED (non-nullable): the DB columns
	// plan_start_at/plan_end_at are NOT NULL and the user must always pick
	// them — never fill them with new Date() fallbacks (Input Rules).
	start_date: z.date({ message: "Plan Start Date is required" }),
	deadline_date: z.date({ message: "Plan End Date is required" }),
});

export const projectCreateSchema = baseProject.refine(
	(data) =>
		!data.start_date ||
		!data.deadline_date ||
		data.start_date <= data.deadline_date,
	{
		message: "Start must be before End",
		path: ["start_date"],
	},
);

export const projectUpdateSchema = baseProject
	.partial()
	.extend({
		project_id: z.uuid({ message: "Invalid project ID" }),
	})
	.refine(
		(data) =>
			!data.start_date ||
			!data.deadline_date ||
			data.start_date <= data.deadline_date,
		{
			message: "Start date must be before or equal to deadline date",
			path: ["start_date"],
		},
	);

export const projectDeleteSchema = z.object({
	project_id: z.uuid({ message: "Invalid project ID" }),
	confirmation_name: z.string().min(1, "Project name confirmation is required"),
});

export type ProjectCreateInput = z.infer<typeof projectCreateSchema>;
export type ProjectUpdateInput = z.infer<typeof projectUpdateSchema>;
export type ProjectDeleteInput = z.infer<typeof projectDeleteSchema>;

// ── Phase ────────────────────────────────────────────────────────────────────
// Canonical scheduling vocabulary (Task 1.5): planStart / planEnd /
// actualStart / actualEnd in TS domain types and UI forms; Prisma column
// names (plan_start_at, …) appear only inside server-side mappers.

const basePhase = z.object({
	name: z
		.string()
		.min(1, "Phase name cannot be empty")
		.max(20, "Phase name must be 20 characters or less"),
	description: z.string().optional().default(""),
	// Date rules: plan dates REQUIRED for phases; actuals optional
	planStart: z.date({ error: "Plan Start Date is required" }),
	planEnd: z.date({ error: "Plan End Date is required" }),
	actualStart: z.date().optional().nullable(),
	actualEnd: z.date().optional().nullable(),
});

export const phaseCreateSchema = basePhase
	.refine((data) => hasValidPlannedRange(toSchedulingDates(data)), {
		message: "Plan Start must be before or equal to Plan End",
		path: ["planStart"],
	})
	.refine((data) => hasValidActualRange(toSchedulingDates(data)), {
		message: "Actual Start must be before or equal to Actual End",
		path: ["actualStart"],
	});

export const phaseUpdateSchema = basePhase
	.partial()
	.refine((data) => hasValidPlannedRange(toSchedulingDates(data)), {
		message: "Plan Start must be before or equal to Plan End",
		path: ["planStart"],
	})
	.refine((data) => hasValidActualRange(toSchedulingDates(data)), {
		message: "Actual Start must be before or equal to Actual End",
		path: ["actualStart"],
	});

export type PhaseCreateInput = z.infer<typeof phaseCreateSchema>;
export type PhaseUpdateInput = z.infer<typeof phaseUpdateSchema>;

// ── Module ───────────────────────────────────────────────────────────────────

const baseModule = z.object({
	name: z
		.string()
		.min(1, "Module name is required")
		.max(35, "Module name must be 35 characters or less"),
	// Date rules: plan dates REQUIRED for modules; actuals optional
	planStart: z.date({ error: "Plan Start Date is required" }),
	planEnd: z.date({ error: "Plan End Date is required" }),
	actualStart: z.date().optional().nullable(),
	actualEnd: z.date().optional().nullable(),
});

export const moduleCreateSchema = baseModule.refine(
	(data) => hasValidPlannedRange(toSchedulingDates(data)),
	{
		message: "Plan Start must be before or equal to Plan End",
		path: ["planStart"],
	},
);

export const moduleUpdateSchema = baseModule
	.partial()
	.refine((data) => hasValidPlannedRange(toSchedulingDates(data)), {
		message: "Plan Start must be before or equal to Plan End",
		path: ["planStart"],
	});

export type ModuleCreateInput = z.infer<typeof moduleCreateSchema>;
export type ModuleUpdateInput = z.infer<typeof moduleUpdateSchema>;

// ── Workflow ─────────────────────────────────────────────────────────────────

const baseWorkflow = z.object({
	name: z
		.string()
		.min(1, "Workflow name is required")
		.max(35, "Workflow name must be 35 characters or less"),
	// Date rules: plan dates REQUIRED for workflows; actuals optional
	planStart: z.date({ error: "Plan Start Date is required" }),
	planEnd: z.date({ error: "Plan End Date is required" }),
	actualStart: z.date().optional().nullable(),
	actualEnd: z.date().optional().nullable(),
	isApproved: z.boolean().optional(),
});

export const workflowCreateSchema = baseWorkflow.refine(
	(data) => hasValidPlannedRange(toSchedulingDates(data)),
	{
		message: "Plan Start must be before or equal to Plan End",
		path: ["planStart"],
	},
);

export const workflowUpdateSchema = baseWorkflow
	.partial()
	.refine((data) => hasValidPlannedRange(toSchedulingDates(data)), {
		message: "Plan Start must be before or equal to Plan End",
		path: ["planStart"],
	});

export type WorkflowCreateInput = z.infer<typeof workflowCreateSchema>;
export type WorkflowUpdateInput = z.infer<typeof workflowUpdateSchema>;
