/**
 * @file Staff / internal team signup form.
 * Creates an auth user via Supabase, stores profile metadata
 * (first_name, last_name, job_title, phone), then creates the Profiles row
 * explicitly via `createProfileForCurrentUser` so the signup is
 * reproducible without an external DB trigger.
 * The DEPARTMENT INVITE CODE (issued by the project owner via the team
 * page) is required — the code determines the department the account joins
 * (resolved server-side against Department.invite_code_hash).
 * All 8 fields are required — validated by `signupSchema`.
 * @returns The result.
 */

"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { useAppForm } from "@/shared/form";
import {
	getProfileByEmail,
	createProfileForCurrentUser,
} from "@/entities/profile";
import { createClient } from "@/lib/supabase/client";
import { signupSchema } from "@/shared/schemas";
import { env } from "@/env";
import { profileKeys } from "@/shared/query/keys";

/**
 * Staff signup form (department invite code).
 * @returns The result.
 */
export function StaffSignupForm() {
	const router = useRouter();
	const queryClient = useQueryClient();
	const supabase = createClient();
	const [error, setError] = useState<string | null>(null);
	const [success, setSuccess] = useState<string | null>(null);
	// Auth user id from a successful signUp — kept across submit attempts so
	// a retry after a failed profile-create can recover ("already registered").
	const lastUserIdRef = useRef<string | null>(null);

	const form = useAppForm({
		defaultValues: {
			firstName: "",
			lastName: "",
			email: "",
			phone: "",
			jobTitle: "",
			inviteCode: "",
			password: "",
			confirmPassword: "",
		},
		validators: { onSubmit: signupSchema },
		onSubmit: async ({ value }) => {
			setError(null);
			setSuccess(null);

			// ── Duplicate email check ──────────────────────────────────────
			const { success, data: existingProfile } = await getProfileByEmail(
				value.email,
			);
			if (success && existingProfile) {
				setError("An account with this email already exists.");
				return;
			}

			const { data, error: signUpError } = await supabase.auth.signUp({
				email: value.email,
				password: value.password,
				options: {
					data: {
						first_name: value.firstName,
						last_name: value.lastName,
						job_title: value.jobTitle,
						phone: value.phone,
					},
					emailRedirectTo: `${env.NEXT_PUBLIC_SITE_URL ?? window.location.origin}/login`,
				},
			});

			if (signUpError) {
				// Retry after a failed profile-create: the auth user already
				// exists — recover by creating the profile now (idempotent,
				// freshness-gated server-side) instead of failing.
				const alreadyRegistered =
					signUpError.code === "user_already_exists" ||
					/already registered/i.test(signUpError.message);
				if (alreadyRegistered && lastUserIdRef.current) {
					const recovered = await createProfileForCurrentUser({
						first_name: value.firstName,
						last_name: value.lastName,
						email: value.email,
						phone: value.phone,
						job_title: value.jobTitle,
						departmentInviteCode: value.inviteCode,
						userId: lastUserIdRef.current,
					});
					if (recovered.success) {
						setSuccess(
							"Account created! Check your email to confirm your account before logging in.",
						);
						return;
					}
				}
				setError(signUpError.message);
				return;
			}
			lastUserIdRef.current = data.user?.id ?? null;

			// Create the Profiles row explicitly (idempotent; verified
			// server-side against auth.users when no session exists yet).
			// The department comes from the invite code — never from the client.
			const profileResult = await createProfileForCurrentUser({
				first_name: value.firstName,
				last_name: value.lastName,
				email: value.email,
				phone: value.phone,
				job_title: value.jobTitle,
				departmentInviteCode: value.inviteCode,
				userId: data.user?.id,
			});
			if (!profileResult.success) {
				setError(profileResult.error);
				return;
			}

			// Only triggers if CONFIRM EMAIL option in Supabase is off (should
			// be on by default).
			if (data.session) {
				router.push("/login");
				await queryClient.invalidateQueries({
					queryKey: profileKeys.currentUser(),
				});
			} else {
				setSuccess(
					"Account created! Check your email to confirm your account before logging in.",
				);
			}
		},
	});

	return (
		<form
			onSubmit={(e) => {
				e.preventDefault();
				void form.handleSubmit();
			}}
			className="flex flex-col gap-5 w-lg mx-auto"
		>
			{/* Invite code */}
			<form.AppField name="inviteCode">
				{(field) => (
					<field.TextField
						label="Invite Code"
						required
						autoComplete="off"
						placeholder="e.g. K7Q2M9XWAB"
						className="[&_input]:font-mono [&_input]:uppercase"
					/>
				)}
			</form.AppField>

			{/* First Name + Last Name */}
			<div className="flex gap-4">
				<div className="flex-1 min-w-0">
					<form.AppField name="firstName">
						{(field) => (
							<field.TextField
								label="First Name"
								required
								autoComplete="given-name"
								placeholder="Jean"
							/>
						)}
					</form.AppField>
				</div>
				<div className="flex-1 min-w-0">
					<form.AppField name="lastName">
						{(field) => (
							<field.TextField
								label="Last Name"
								required
								autoComplete="family-name"
								placeholder="Gunnhildr"
							/>
						)}
					</form.AppField>
				</div>
			</div>

			{/* Email + Phone Number */}
			<div className="flex gap-4">
				<div className="flex-1 min-w-0">
					<form.AppField name="email">
						{(field) => (
							<field.TextField
								label="Email"
								required
								type="email"
								autoComplete="email"
								placeholder="employee@client.com"
							/>
						)}
					</form.AppField>
				</div>
				<div className="flex-1 min-w-0">
					<form.AppField name="phone">
						{(field) => (
							<field.PhoneField
								label="Contact Number"
								required
								placeholder="+1 (555) 000-0000"
							/>
						)}
					</form.AppField>
				</div>
			</div>

			{/* Job Title */}
			<form.AppField name="jobTitle">
				{(field) => (
					<field.TextField
						label="Job Title"
						required
						placeholder="e.g. Product Director"
					/>
				)}
			</form.AppField>

			{/* Password + Confirm Password */}
			<div className="flex gap-4">
				<div className="flex-1 min-w-0">
					<form.AppField name="password">
						{(field) => (
							<field.PasswordField
								label="Password"
								required
								autoComplete="new-password"
								placeholder="Create a password"
							/>
						)}
					</form.AppField>
				</div>
				<div className="flex-1 min-w-0">
					<form.AppField name="confirmPassword">
						{(field) => (
							<field.PasswordField
								label="Confirm Password"
								required
								autoComplete="new-password"
								placeholder="Confirm your password"
							/>
						)}
					</form.AppField>
				</div>
			</div>

			{/* Error message */}
			{error && (
				<p className="text-sm text-destructive bg-red-50 border border-red-200 rounded-md px-3 py-2">
					{error}
				</p>
			)}
			{/* Success message */}
			{success && (
				<p
					role="status"
					className="text-sm text-green-800 bg-green-50 border border-green-200 rounded-md px-3 py-2"
				>
					{success}
				</p>
			)}

			<div className="flex flex-col gap-2">
				<p className="text-center text-[11px] text-gray-400 leading-relaxed">
					By signing up, you agree to our{" "}
					<Link
						href="#"
						className="underline hover:text-gray-500 transition-colors"
					>
						Terms of Service
					</Link>{" "}
					and{" "}
					<Link
						href="#"
						className="underline hover:text-gray-500 transition-colors"
					>
						Privacy Policy
					</Link>
				</p>
				{/* Submit Button */}
				<form.AppForm>
					<form.SubmitButton
						className="w-full"
						pendingLabel="Creating account…"
					>
						Join Workspace
					</form.SubmitButton>
				</form.AppForm>

				{/* Sign in link */}
				<p className="mt-2 text-center text-sm text-gray-500">
					Already have an account?{" "}
					<Link
						href="/login"
						className="text-brand-600 hover:text-brand-500 transition-colors"
					>
						Sign in
					</Link>
				</p>
			</div>
		</form>
	);
}
