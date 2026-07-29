/**
 * @fileoverview Staff / internal team signup form.
 * Creates an auth user via Supabase and stores profile metadata
 * (first_name, last_name, job_title, department_id, phone).
 * Department is selected from a dropdown restricted to the three
 * valid internal departments (Project Team, Project Owner, Finance).
 * All 8 fields are required — validated by `signupSchema`.
 */

"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PhoneInput } from "@/components/ui/phone-input";
import { Button } from "@/components/ui/button";
import { PasswordInput } from "@/shared/ui/PasswordInput";
import { useQueryClient } from "@tanstack/react-query";
import { ProfileType } from "@/shared/types";
import { createClient } from "@/lib/supabase/client";
import { signupSchema } from "@/shared/schemas";
import { profileKeys } from "@/shared/query/keys";
import { getProfileByEmail } from "@/entities/profile/profileActions";

export function StaffSignupForm() {
	const router = useRouter();
	const queryClient = useQueryClient();
	const supabase = createClient();

	const [firstName, setFirstName] = useState("");
	const [lastName, setLastName] = useState("");
	const [email, setEmail] = useState("");
	const [phone, setPhone] = useState("");
	const [jobTitle, setJobTitle] = useState("");
	const [department, setDepartment] = useState("");
	const [password, setPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
	const [loading, setLoading] = useState(false);

	function fieldErrClass(key: string) {
		return fieldErrors[key] ? "border-red-400 focus:ring-red-400" : "";
	}

	async function userSignUp(user: ProfileType, password: string) {
		return await supabase.auth.signUp({
			email: user.email,
			password: password,
			options: {
				data: {
					first_name: user.first_name,
					last_name: user.last_name,
					job_title: user.job_title,
					department_id: user.department_id,
					phone: user.phone,
					is_deleted: user.is_deleted,
					deleted_at: user.deleted_at,
				},
				emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/login`,
			},
		});
	}

	const handleSignUp = async (e: React.BaseSyntheticEvent) => {
		setError(null);
		setFieldErrors({});
		setLoading(false);
		e.preventDefault();

		const result = signupSchema.safeParse({
			firstName,
			lastName,
			email,
			phone,
			jobTitle,
			department,
			password,
			confirmPassword,
		});

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

		// ── Duplicate email check ──────────────────────────────────────
		const { success, data: existingProfile } = await getProfileByEmail(email);
		if (success && existingProfile) {
			setError("An account with this email already exists.");
			setLoading(false);
			return;
		}

		const user: ProfileType = {
			profile_id: "",
			first_name: firstName,
			last_name: lastName,
			phone: phone,
			image_id: null,
			client_id: null,
			department_id: department,
			email: email,
			job_title: jobTitle.trim().length == 0 ? null : jobTitle,
			is_deleted: false,
			deleted_at: null,
		};

		const { data, error: signUpError } = await userSignUp(user, password);

		//catch the sign in error
		if (signUpError) {
			setError(signUpError.message);
			setLoading(false);
			return;
		}

		//only triggers if CONFIRM EMAIL option in Supabase is off (shud be on by default tho)
		if (data.session) {
			router.push("/login");
			queryClient.invalidateQueries({ queryKey: profileKeys.currentUser() });
		} else {
			setError(
				"Account created! Check your email to confirm your account before logging in.",
			);
			console.log(data);
			setLoading(false);
		}
	};

	return (
		<form onSubmit={handleSignUp} className="space-y-4">
			{/* First Name + Last Name */}
			<div className="flex gap-3">
				<div className="flex-1">
					<Label
						htmlFor="firstname"
						className="mb-1.5"
						required
						error={!!fieldErrors.firstName}
					>
						First Name
					</Label>
					<Input
						id="firstname"
						type="text"
						placeholder="First name"
						value={firstName}
						onChange={(e) => setFirstName(e.target.value)}
						className={fieldErrClass("firstName")}
					/>
					{fieldErrors.firstName && (
						<p className="text-xs text-destructive mt-1">{fieldErrors.firstName}</p>
					)}
				</div>
				<div className="flex-1">
					<Label
						htmlFor="lastname"
						className="mb-1.5"
						required
						error={!!fieldErrors.lastName}
					>
						Last Name
					</Label>
					<Input
						id="lastname"
						type="text"
						placeholder="Last name"
						value={lastName}
						onChange={(e) => setLastName(e.target.value)}
						className={fieldErrClass("lastName")}
					/>
					{fieldErrors.lastName && (
						<p className="text-xs text-destructive mt-1">{fieldErrors.lastName}</p>
					)}
				</div>
			</div>

			{/* Work Email */}
			<div>
				<Label
					htmlFor="email"
					className="mb-1.5"
					required
					error={!!fieldErrors.email}
				>
					Work Email
				</Label>
				<Input
					id="email"
					type="email"
					placeholder="name@company.com"
					value={email}
					onChange={(e) => setEmail(e.target.value)}
					className={fieldErrClass("email")}
				/>
				{fieldErrors.email && (
					<p className="text-xs text-destructive mt-1">{fieldErrors.email}</p>
				)}
			</div>

			{/* Phone Number */}
			<div>
				<Label
					htmlFor="phone"
					className="mb-1.5"
					required
					error={!!fieldErrors.phone}
				>
					Phone Number
				</Label>
				<PhoneInput
					value={phone}
					onChange={setPhone}
					placeholder="+1 (555) 000-0000"
				/>
				{fieldErrors.phone && (
					<p className="text-xs text-destructive mt-1">{fieldErrors.phone}</p>
				)}
			</div>

			{/* Job Title + Department */}
			<div className="flex gap-3">
				<div className="flex-1">
					<Label
						htmlFor="jobtitle"
						className="mb-1.5"
						required
						error={!!fieldErrors.jobTitle}
					>
						Job Title
					</Label>
					<Input
						id="jobtitle"
						type="text"
						placeholder="e.g. Product Manager"
						value={jobTitle}
						onChange={(e) => setJobTitle(e.target.value)}
						className={fieldErrClass("jobTitle")}
					/>
					{fieldErrors.jobTitle && (
						<p className="text-xs text-destructive mt-1">{fieldErrors.jobTitle}</p>
					)}
				</div>
				<div className="flex-1">
					<Label
						htmlFor="department"
						className="mb-1.5"
						required
						error={!!fieldErrors.department}
					>
						Department
					</Label>
					<select
						id="department"
						value={department}
						onChange={(e) => setDepartment(e.target.value)}
						className={`w-full px-3.5 py-2.5 rounded-lg border border-gray-300 bg-neutral-surface text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent ${fieldErrors.department ? "border-red-400 focus:ring-red-400" : ""} ${department ? "text-gray-900" : "text-gray-400"}`}
					>
						<option value="" disabled>
							Select...
						</option>
						<option value="Project Team">Project Team</option>
						<option value="Project Owner">Project Owner</option>
						<option value="Finance Team">Finance Team</option>
					</select>
					{fieldErrors.department && (
						<p className="text-xs text-destructive mt-1">
							{fieldErrors.department}
						</p>
					)}
				</div>
			</div>

			{/* Password */}
			<div>
				<Label
					htmlFor="password"
					className="mb-1.5"
					required
					error={!!fieldErrors.password}
				>
					Password
				</Label>
				<PasswordInput
					id="password"
					placeholder="Create a password"
					value={password}
					onChange={(e) => setPassword(e.target.value)}
					className={fieldErrClass("password")}
				/>
				{fieldErrors.password && (
					<p className="text-xs text-destructive mt-1">{fieldErrors.password}</p>
				)}
			</div>

			{/* Confirm Password */}
			<div>
				<Label
					htmlFor="confirm-password"
					className="mb-1.5"
					required
					error={!!fieldErrors.confirmPassword}
				>
					Confirm Password
				</Label>
				<PasswordInput
					id="confirm-password"
					placeholder="Confirm your password"
					value={confirmPassword}
					onChange={(e) => setConfirmPassword(e.target.value)}
					className={fieldErrClass("confirmPassword")}
				/>
				{fieldErrors.confirmPassword && (
					<p className="text-xs text-destructive mt-1">
						{fieldErrors.confirmPassword}
					</p>
				)}
			</div>

			{/* Error message */}
			{error && (
				<p className="text-sm text-destructive bg-red-50 border border-red-200 rounded-md px-3 py-2">
					{error}
				</p>
			)}

			<Button type="submit" className="mt-2" disabled={loading}>
				{loading ? "Creating account..." : "Join Workspace"}
			</Button>

			{/* OR divider */}
			<div className="relative my-6">
				<div className="absolute inset-0 flex items-center">
					<div className="w-full border-t border-gray-200" />
				</div>
				<div className="relative flex justify-center text-[11px] uppercase tracking-wider">
					<span className="bg-background px-3 text-gray-400">OR</span>
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
