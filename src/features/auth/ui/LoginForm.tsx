/**
 * @fileoverview Sign-in form with email + password fields.
 * Validates via `loginSchema` (Zod), displays per-field errors,
 * authenticates through Supabase Auth, and invalidates the profile
 * query cache on success so `useCurrentUser()` picks up the session.
 */

"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Button } from "@/shared/ui/button";
import { PasswordInput } from "@/shared/ui/PasswordInput";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/features/auth";
import { loginSchema } from "@/shared/schemas";
import { profileKeys } from "@/shared/query/keys";

/** Renders the login form — email, password, submit, and signup links. */
export function LoginForm() {
	const router = useRouter();
	const queryClient = useQueryClient();
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
	const [loading, setLoading] = useState(false);
	const supabase = createClient();
	useAuth();

	function fieldErrClass(key: string) {
		return fieldErrors[key] ? "border-red-400 focus:ring-red-400" : "";
	}

	const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		setError(null);
		setFieldErrors({});

		const result = loginSchema.safeParse({ email, password });
		if (!result.success) {
			const flattened = result.error.flatten().fieldErrors;
			const mapped: Record<string, string> = {};
			for (const [key, msgs] of Object.entries(flattened)) {
				if (msgs && msgs.length > 0) mapped[key] = msgs[0];
			}
			setFieldErrors(mapped);
			return;
		}

		setLoading(true);

		const { error: supabaseError } = await supabase.auth.signInWithPassword({
			email,
			password,
		});

		if (supabaseError) {
			setError(supabaseError.message);
			setLoading(false);
			return;
		}

		queryClient.invalidateQueries({ queryKey: profileKeys.currentUser() });
		router.refresh();
	};

	return (
		<>
			<div className="mb-7">
				<h1 className="text-[22px] font-semibold text-gray-900 leading-snug">
					Welcome back
				</h1>
				<p className="text-sm text-gray-400 mt-1">Sign in to your workspace</p>
			</div>

			<form onSubmit={handleSignIn} className="space-y-4">
				{/* Email */}
				<div>
					<Label
						htmlFor="email"
						className="mb-1.5"
						required
						error={!!fieldErrors.email}
					>
						Email Address
					</Label>
					<Input
						id="email"
						type="email"
						placeholder="name@company.com"
						onChange={(e) => setEmail(e.target.value)}
						className={fieldErrClass("email")}
					/>
					{fieldErrors.email && (
						<p className="text-xs text-red-500 mt-1">{fieldErrors.email}</p>
					)}
				</div>

				{/* Password */}
				<div>
					<div className="flex items-center justify-between mb-1.5">
						<Label htmlFor="password" required error={!!fieldErrors.password}>
							Password
						</Label>
						{/*<Link*/}
						{/*  href="#"*/}
						{/*  className="text-sm text-indigo-600 hover:text-indigo-500 transition-colors"*/}
						{/*>*/}
						{/*  Forgot password?*/}
						{/*</Link>*/}
					</div>
					<PasswordInput
						id="password"
						placeholder="Enter your password"
						onChange={(e) => setPassword(e.target.value)}
						className={fieldErrClass("password")}
					/>
					{fieldErrors.password && (
						<p className="text-xs text-red-500 mt-1">{fieldErrors.password}</p>
					)}
				</div>

				{error && (
					<p
						className="text-sm text-red-600 bg-red-50 border border-red-200
            rounded-md px-3 py-2"
					>
						{error}
					</p>
				)}

				<Button type="submit" disabled={loading}>
					{loading ? "Signing in…" : "Sign In"}
				</Button>
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
					<span className="bg-[#F8F9FB] px-3 text-gray-400">OR</span>
				</div>
			</div>

			<p className="text-center text-sm text-gray-500">
				Sign up as:{" "}
				<Link
					href="/signup/staff"
					className="text-indigo-600 hover:text-indigo-500 transition-colors"
				>
					Staff
				</Link>{" "}
				or{" "}
				<Link
					href="/signup/client"
					className="text-indigo-600 hover:text-indigo-500 transition-colors"
				>
					Client
				</Link>
			</p>
		</>
	);
}
