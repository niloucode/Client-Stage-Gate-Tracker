import { z } from "zod";

// ── Upload ───────────────────────────────────────────────────────────────────

export const contractUploadSchema = z.object({
	projectId: z.uuid({ message: "Invalid project ID" }),
	contractName: z
		.string()
		.min(1, "Contract name is required")
		.max(100, "Contract name must be 100 characters or less"),
});

export type ContractUploadInput = z.infer<typeof contractUploadSchema>;

// ── Approve (2026-08-15 spec: button-based dual approval, no typed signature) ──

export const contractApproveSchema = z.object({
	projectId: z.uuid({ message: "Invalid project ID" }),
	role: z.enum(["client", "owner"], {
		message: "Role must be 'client' or 'owner'",
	}),
});

export type ContractApproveInput = z.infer<typeof contractApproveSchema>;
