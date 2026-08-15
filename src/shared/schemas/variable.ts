import { z } from "zod";

// ── Project variables ──────────────────────────────────────────────────────
// Canonical type vocabulary (mirrors the UI radio pills). The DB stores the
// uppercase enum value; the UI speaks lowercase — mapping lives in
// entities/variable (mappers.ts).
const VARIABLE_TYPES = ["link", "credential", "repository"] as const;

export const variableCreateSchema = z.object({
	name: z
		.string()
		.trim()
		.min(1, "Variable name is required")
		.max(20, "Name must be 20 characters or less"),
	type: z.enum(VARIABLE_TYPES, { error: "Variable type is required" }),
	value: z
		.string()
		.trim()
		.min(1, "Variable value/address is required")
		.max(4096, "Value must be 4096 characters or less"),
	notesTeam: z
		.string()
		.trim()
		.max(2000, "Team notes must be 2000 characters or less")
		.optional()
		.default(""),
	notesClient: z
		.string()
		.trim()
		.max(2000, "Client notes must be 2000 characters or less")
		.optional()
		.default(""),
});

export type VariableCreateInput = z.infer<typeof variableCreateSchema>;
