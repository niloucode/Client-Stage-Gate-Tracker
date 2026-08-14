import { z } from "zod";

// ── Login ────────────────────────────────────────────────────────────────────

export const loginSchema = z.object({
	email: z.email({ message: "Enter a valid email address" }),
	password: z.string().min(1, "Password is required"),
});

export type LoginInput = z.infer<typeof loginSchema>;

// ── Signup (Asceoft team member) ─────────────────────────────────────────────

export const signupSchema = z
	.object({
		firstName: z.string().min(1, "First name is required"),
		lastName: z.string().min(1, "Last name is required"),
		email: z.email({ message: "Enter a valid email address" }),
		phone: z.string().min(1, "Phone number is required"),
		jobTitle: z.string().min(1, "Job title is required"),
		// Department invite code issued by the project owner — the code
		// determines the department the account joins. Case-insensitive,
		// 6-12 chars (same format as the client invite codes).
		inviteCode: z
			.string()
			.trim()
			.min(1, "Invite code is required")
			.regex(/^[a-zA-Z0-9]{6,12}$/, "Enter a valid invite code"),
		password: z.string().min(6, "Password must be at least 6 characters"),
		confirmPassword: z.string().min(1, "Please confirm your password"),
	})
	.refine((data) => data.password === data.confirmPassword, {
		message: "Passwords do not match",
		path: ["confirmPassword"],
	});

export type SignupInput = z.infer<typeof signupSchema>;

// ── Client signup ────────────────────────────────────────────────────────────

export const clientSignupSchema = z
	.object({
		firstName: z.string().trim().min(1, "First name is required"),
		lastName: z.string().trim().min(1, "Last name is required"),
		email: z.email({ message: "Enter a valid email address" }),
		phone: z.string().min(1, "Phone number is required"),
		password: z.string().min(6, "Password must be at least 6 characters"),
		confirmPassword: z.string().min(1, "Please confirm your password"),
		// Invite code issued by the project owner — resolves the client the
		// profile belongs to. Case-insensitive, 6-12 chars.
		inviteCode: z
			.string()
			.trim()
			.min(1, "Invite code is required")
			.regex(/^[a-zA-Z0-9]{6,12}$/, "Enter a valid invite code"),
	})
	.refine((data) => data.password === data.confirmPassword, {
		message: "Passwords do not match",
		path: ["confirmPassword"],
	});

export type ClientSignupInput = z.infer<typeof clientSignupSchema>;

// ── OTP verification ─────────────────────────────────────────────────────────
// Removed 2026-08-14: staff signup is invite-code-driven; the contract-
// signing OTP lives in src/features/contracts (its own schema).
