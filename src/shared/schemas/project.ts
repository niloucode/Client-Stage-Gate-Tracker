import { z } from "zod";
import {
	hasValidActualRange,
	hasValidPlannedRange,
	toSchedulingDates,
} from "@/shared/lib/scheduling";

// ── Project ──────────────────────────────────────────────────────────────────

// Shared by create/update/delete schemas and the project modal (edit mode
// omits client_id via baseProject.omit — see ProjectModals).
export const baseProject = z.object({
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
	planStart: z.date({ message: "Plan Start Date is required" }),
	planEnd: z.date({ message: "Plan End Date is required" }),
});

export const projectCreateSchema = baseProject.refine(
	(data) =>
		!data.planStart ||
		!data.planEnd ||
		data.planStart <= data.planEnd,
	{
		message: "Start must be before End",
		path: ["planStart"],
	},
);

export const projectUpdateSchema = baseProject
	.partial()
	.extend({
		project_id: z.uuid({ message: "Invalid project ID" }),
	})
	.refine(
		(data) =>
			!data.planStart ||
			!data.planEnd ||
			data.planStart <= data.planEnd,
		{
			message: "Start date must be before or equal to deadline date",
			path: ["planStart"],
		},
	);

// eslint-disable-next-line @typescript-eslint/no-unused-vars -- used via typeof
const projectDeleteSchema = z.object({
	project_id: z.uuid({ message: "Invalid project ID" }),
	confirmation_name: z.string().min(1, "Project name confirmation is required"),
});

// ── Stage ────────────────────────────────────────────────────────────────────
// Date rules: plan dates REQUIRED for stages (DB NOT NULL); the form keeps
// them nullable while picking, hence the nullable+refine pattern (types stay
// Date | null in the form, validation enforces non-null on submit).

const baseStage = z.object({
	name: z
		.string()
		.trim()
		.min(1, "Stage name is required")
		.max(20, "Stage name must be 20 characters or less"),
	description: z
		.string()
		.max(160, "Description must be 160 characters or less")
		.optional()
		.default(""),
	planStart: z
		.date()
		.nullable()
		.refine((val): val is Date => val !== null, {
			error: "Plan Start Date is required",
		}),
	planEnd: z
		.date()
		.nullable()
		.refine((val): val is Date => val !== null, {
			error: "Plan End Date is required",
		}),
});

function stageRangeIssues(data: {
	planStart?: Date | null | undefined;
	planEnd?: Date | null | undefined;
}) {
	const issues: { message: string; path: ("planStart" | "planEnd")[] }[] = [];
	if (data.planStart && data.planEnd && data.planStart > data.planEnd) {
		issues.push({ message: "Start must be before End", path: ["planStart"] });
		issues.push({ message: "End must be after Start", path: ["planEnd"] });
	}
	return issues;
}

export const stageCreateSchema = baseStage.superRefine((data, ctx) => {
	for (const issue of stageRangeIssues(data)) {
		ctx.addIssue({ code: "custom", message: issue.message, path: issue.path });
	}
});


export type StageCreateInput = z.infer<typeof stageCreateSchema>;

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
