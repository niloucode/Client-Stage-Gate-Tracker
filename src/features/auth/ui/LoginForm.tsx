/**
 * @file Sign-in form with email + password fields.
 * Validates via `loginSchema` (Zod), displays per-field errors,
 * authenticates through Supabase Auth, and invalidates the profile
 * query cache on success so `useCurrentUser()` picks up the session.
 */

"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { useAppForm } from "@/shared/form";
import { createClient } from "@/lib/supabase/client";
import { loginSchema } from "@/shared/schemas";
import { profileKeys } from "@/shared/query/keys";

/** Renders the login form — email, password, submit, and signup links. * @returns The rendered login form.
 */
export function LoginForm() {
	const router = useRouter();
	const queryClient = useQueryClient();
	const [error, setError] = useState<string | null>(null);
	const supabase = createClient();

	const form = useAppForm({
		defaultValues: { email: "", password: "" },
		// Field warnings appear ONLY after a submit attempt — blurring an
		// empty field must not flag the whole form (per product decision).
		validators: { onSubmit: loginSchema },
		onSubmit: async ({ value }) => {
			setError(null);

			const { error: supabaseError } = await supabase.auth.signInWithPassword({
				email: value.email,
				password: value.password,
			});

			if (supabaseError) {
				setError(supabaseError.message);
				return;
			}

			await queryClient.invalidateQueries({
				queryKey: profileKeys.currentUser(),
			});
			router.refresh();
		},
	});

	return (
		<div className="bg-neutral-surface rounded-md p-6 border border-brand-100">
			<div className="mb-7">
				<h2>Welcome back</h2>
				<p className="text-sm text-gray-400 mt-1">Sign in to your workspace</p>
			</div>

			<form
				onSubmit={(e) => {
					e.preventDefault();
					void form.handleSubmit();
				}}
				className="space-y-4"
			>
				{/* Email */}
				<form.AppField name="email">
					{(field) => (
						<field.TextField
							label="Email Address"
							required
							type="email"
							autoComplete="email"
							placeholder="name@company.com"
						/>
					)}
				</form.AppField>

				{/* Password */}
				<form.AppField name="password">
					{(field) => (
						<field.PasswordField
							label="Password"
							required
							autoComplete="current-password"
							placeholder="Enter your password"
						/>
					)}
				</form.AppField>

				{error && (
					<p
						className="text-sm text-destructive bg-red-50 border border-red-200
            rounded-md px-3 py-2"
					>
						{error}
					</p>
				)}

				<form.AppForm>
					<form.SubmitButton className="w-full" pendingLabel="Logging in…">
						Log In
					</form.SubmitButton>
				</form.AppForm>
			</form>

			<p className="mt-4 text-xs text-gray-400 text-center leading-relaxed">
				You&apos;ll be directed to your dedicated dashboard after signing in
			</p>

			{/* OR divider */}
			<div className="relative my-6">
				<div className="absolute inset-0 flex items-center">
					<div className="w-full border-t border-gray-200" />
				</div>
				<div className="relative flex justify-center text-[11px] uppercase tracking-wider">
					<span className="bg-neutral-surface px-3 text-gray-400">OR</span>
				</div>
			</div>

			<p className="text-center text-sm text-gray-500">
				Sign up as:{" "}
				<Link
					href="/signup/staff"
					className="text-brand-600 hover:text-brand-500 transition-colors"
				>
					Staff
				</Link>{" "}
				or{" "}
				<Link
					href="/signup/client"
					className="text-brand-600 hover:text-brand-500 transition-colors"
				>
					Client
				</Link>
			</p>
		</div>
	);
}
