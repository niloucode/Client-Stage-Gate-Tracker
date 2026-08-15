import { z } from "zod";

// ── Issue reporting ─────────────────────────────────────────────────────────
// Canonical bug-type vocabulary (mirrors the UI options). The DB stores the
// enum value in Issues.type, EXCEPT for type "other" where the free-text
// specific type is stored in Issues.type (the UI already renders unknown
// type strings via `BUG_TYPE_LABELS[type] ?? type`).
export const ISSUE_BUG_TYPES = [
	"feature_request",
	"deadlinks",
	"missing_fields",
	"not_saving",
	"slow_loading",
	"other",
] as const;

export const ISSUE_URGENCIES = ["low", "medium", "high"] as const;

export const issueCreateSchema = z
	.object({
		name: z
			.string()
			.trim()
			.min(1, "Issue name is required")
			.max(60, "Issue name must be 60 characters or less"),
		type: z.enum(ISSUE_BUG_TYPES, { error: "Issue type is required" }),
		specificType: z
			.string()
			.trim()
			.max(60, "Specific type must be 60 characters or less")
			.optional()
			.default(""),
		urgency: z.enum(ISSUE_URGENCIES, { error: "Priority level is required" }),
		description: z
			.string()
			.max(300, "Description must be 300 characters or less")
			.optional()
			.default(""),
		systemEnv: z
			.string()
			.max(60, "System environment must be 60 characters or less")
			.optional()
			.default(""),
		timeOfError: z.date().nullable().default(null),
		steps: z
			.array(
				z.object({
					description: z
						.string()
						.max(200, "Step description must be 200 characters or less"),
					image: z.string().optional().nullable(),
				}),
			)
			.max(20, "Too many steps")
			.optional()
			.default([]),
	})
	.superRefine((data, ctx) => {
		// "Other" requires the free-text specific type (matches the modal UI).
		if (data.type === "other" && !data.specificType.trim()) {
			ctx.addIssue({
				code: "custom",
				message: "Specific type is required",
				path: ["specificType"],
			});
		}
	});

export type IssueCreateInput = z.infer<typeof issueCreateSchema>;
