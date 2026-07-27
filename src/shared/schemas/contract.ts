import { z } from "zod";

// ── Upload ───────────────────────────────────────────────────────────────────

export const contractUploadSchema = z.object({
	clientId: z.string().uuid("Invalid client ID"),
	projectId: z.string().uuid("Invalid project ID"),
	contractName: z
		.string()
		.min(1, "Contract name is required")
		.max(100, "Contract name must be 100 characters or less"),
});

export type ContractUploadInput = z.infer<typeof contractUploadSchema>;

// ── Sign ─────────────────────────────────────────────────────────────────────

export const contractSignSchema = z.object({
	projectId: z.string().uuid("Invalid project ID"),
	role: z.enum(["Client Viewer", "Project Owner"], {
		message: "Role must be 'Client Viewer' or 'Project Owner'",
	}),
	fullName: z
		.string()
		.min(1, "Full name is required")
		.max(100, "Full name must be 100 characters or less"),
	initials: z
		.string()
		.min(1, "Initials are required")
		.max(4, "Initials must be 4 characters or less"),
});

export type ContractSignInput = z.infer<typeof contractSignSchema>;

// ── Change Name ──────────────────────────────────────────────────────────────

export const contractChangeNameSchema = z.object({
	projectId: z.string().uuid("Invalid project ID"),
	contractName: z
		.string()
		.min(1, "Contract name is required")
		.max(100, "Contract name must be 100 characters or less"),
});

export type ContractChangeNameInput = z.infer<typeof contractChangeNameSchema>;
