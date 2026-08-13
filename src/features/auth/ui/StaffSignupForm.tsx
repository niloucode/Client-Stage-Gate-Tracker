/**
 * @fileoverview Staff / internal team signup form.
 * Creates an auth user via Supabase, stores profile metadata
 * (first_name, last_name, job_title, department_id, phone), then creates
 * the Profiles row explicitly via `createProfileForCurrentUser` so the
 * signup is reproducible without an external DB trigger.
 * Department is selected from the active departments in the DB
 * (department_id is the option value — display name is the label).
 * All 8 fields are required — validated by `signupSchema`.
 */

"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { useAppForm } from "@/shared/form";
import { useDepartments } from "@/entities/department";
import { getProfileByEmail, createProfileForCurrentUser } from "@/entities/profile";
import { createClient } from "@/lib/supabase/client";
import { signupSchema } from "@/shared/schemas";
import { env } from "@/env";
import { profileKeys } from "@/shared/query/keys";

export function StaffSignupForm() {
	const router = useRouter();
	const queryClient = useQueryClient();
	const supabase = createClient();
	const { data: departments } = useDepartments();
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
			department: "",
			password: "",
			confirmPassword: "",
		},
		validators: { onBlur: signupSchema, onSubmit: signupSchema },
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
						department_id: value.department,
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
						department_id: value.department,
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
			const profileResult = await createProfileForCurrentUser({
				first_name: value.firstName,
				last_name: value.lastName,
				email: value.email,
				phone: value.phone,
				job_title: value.jobTitle,
				department_id: value.department,
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

	const departmentOptions = (departments ?? []).map((d) => ({
		value: d.department_id,
		label: d.name,
	}));

	return (
		<form
			onSubmit={(e) => {
				e.preventDefault();
				void form.handleSubmit();
			}}
			className="space-y-4"
		>
			{/* First Name + Last Name */}
			<div className="flex gap-3">
				<div className="flex-1">
					<form.AppField name="firstName">
						{(field) => (
							<field.TextField
								label="First Name"
								required
								placeholder="John"
								autoComplete="given-name"
							/>
						)}
					</form.AppField>
				</div>
				<div className="flex-1">
					<form.AppField name="lastName">
						{(field) => (
							<field.TextField
								label="Last Name"
								required
								placeholder="Cecil"
								autoComplete="family-name"
							/>
						)}
					</form.AppField>
				</div>
			</div>

			{/* Work Email */}
			<form.AppField name="email">
				{(field) => (
					<field.TextField
						label="Work Email"
						required
						type="email"
						autoComplete="email"
						placeholder="name@company.com"
					/>
				)}
			</form.AppField>

			{/* Phone Number */}
			<form.AppField name="phone">
				{(field) => (
					<field.PhoneField
						label="Phone Number"
						required
						placeholder="+1 (555) 000-0000"
					/>
				)}
			</form.AppField>

			{/* Job Title + Department */}
			<div className="flex gap-3">
				<div className="flex-1">
					<form.AppField name="jobTitle">
						{(field) => (
							<field.TextField
								label="Job Title"
								required
								placeholder="e.g. Product Director"
							/>
						)}
					</form.AppField>
				</div>
				<div className="flex-1">
					<form.AppField name="department">
						{(field) => (
							<field.SelectField
								label="Department"
								required
								placeholder="Select…"
								options={departmentOptions}
							/>
						)}
					</form.AppField>
				</div>
			</div>

			{/* Password */}
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

			{/* Confirm Password */}
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
			<div>
				<div className="text-center mt-6 mb-2">
					<p className="text-[11px] text-gray-400 leading-relaxed">
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
				</div>
				<form.AppForm>
					<form.SubmitButton
						className="mt-2 w-full"
						pendingLabel="Creating account…"
					>
						Join Workspace
					</form.SubmitButton>
				</form.AppForm>
			</div>

			{/* OR divider */}
			<div className="relative my-6">
				<div className="absolute inset-0 flex items-center">
					<div className="w-full border-t border-gray-200" />
				</div>
				<div className="relative flex justify-center text-[11px] uppercase tracking-wider">
					<span className="bg-neutral-surface px-3 text-gray-400">OR</span>
				</div>
			</div>

			{/* Sign in link */}
			<p className="text-center text-sm text-gray-500">
				Already have an account?{" "}
				<Link
					href="/login"
					className="text-brand-600 hover:text-brand-500 transition-colors"
				>
					Sign in
				</Link>
			</p>
		</form>
	);
}
