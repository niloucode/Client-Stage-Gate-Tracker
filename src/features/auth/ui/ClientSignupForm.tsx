"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { PasswordInput } from "@/shared/ui/PasswordInput";
import { clientSignupSchema, type ClientSignupInput } from "@/shared/schemas";
import { getFieldErrors } from "@/shared/lib/zod";
import { createClient } from "@/lib/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { profileKeys } from "@/shared/query/keys";
import { getProfileByEmail } from "@/entities/profile/profileActions";
import {
  clientSelectByNameTin,
  clientCreate,
  clientDeleteByID,
} from "@/entities/client/clientActions";
import type { ClientType } from "@/shared/schemas";
import type { ProfileType } from "@/shared/schemas";

type FieldKey = keyof ClientSignupInput;
type Errors = Partial<Record<FieldKey, string>>;

const emptyFields: ClientSignupInput = {
	firstName: "",
	lastName: "",
	companyName: "",
	email: "",
	password: "",
	confirmPassword: "",
	streetNumber: "",
	streetName: "",
	city: "",
	country: "",
	tin: "",
	phone: "",
};

export function ClientSignupForm() {
	const router = useRouter();
	const supabase = createClient();
	const queryClient = useQueryClient();

	const [fields, setFields] = useState<ClientSignupInput>(emptyFields);

	const [errors, setErrors] = useState<Errors>({});
	const [apiError, setApiError] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);

	function set(key: FieldKey) {
		return (e: React.ChangeEvent<HTMLInputElement>) => {
			setFields((prev) => ({ ...prev, [key]: e.target.value }));
			if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }));
		};
	}

	function setNumeric(key: FieldKey) {
		return (e: React.ChangeEvent<HTMLInputElement>) => {
			const digits = e.target.value.replace(/\D/g, "");
			setFields((prev) => ({ ...prev, [key]: digits }));
			if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }));
		};
	}

	async function userSignUp(user: ProfileType, password: string) {
		return await supabase.auth.signUp({
			email: user.email,
			password,
			options: {
				data: {
					first_name: user.first_name,
					last_name: user.last_name,
					job_title: user.job_title,
					client_id: user.client_id,
					department_id: user.department_id,
					phone: user.phone,
					is_deleted: user.is_deleted,
					deleted_at: user.deleted_at,
				},
				emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/login`,
			},
		});
	}

	async function handleSubmit(e: React.BaseSyntheticEvent) {
		e.preventDefault();
		setApiError(null);

		const result = clientSignupSchema.safeParse(fields);
		if (!result.success) {
			const mapped = getFieldErrors(result);
			setErrors(mapped);
			return;
		}
		setErrors({});
		setLoading(true);

		// Duplicate email check (same pattern as StaffSignup)
		const { success: emailOk, data: existingProfile } =
			await getProfileByEmail(fields.email.trim());
		if (emailOk && existingProfile) {
			setApiError("An account with this email already exists.");
			setLoading(false);
			return;
		}

		// Check if client already exists
		const existingClient = await clientSelectByNameTin(
			fields.companyName.trim(),
			fields.tin.trim(),
		);

		let client = existingClient ?? null;

		// Create client if not found
		if (!client) {
			const address =
				fields.streetNumber.trim() +
				" " +
				fields.streetName.trim() +
				", " +
				fields.city.trim() +
				", " +
				fields.country.trim();

			const newClient: ClientType = {
				client_id: "",
				client_name: fields.companyName.trim(),
				tin: fields.tin.trim(),
				billing_address: address,
				email: fields.email.trim(),
				phone: fields.phone.trim(),
				is_deleted: false,
				deleted_at: null,
			};

			const created = await clientCreate(newClient);
			if (!created.success) {
				setApiError(created.error ?? "Unable to save company data.");
				setLoading(false);
				return;
			}
			client = created.data;
		}

		// Create profile and sign up
		const user: ProfileType = {
			profile_id: "",
			first_name: fields.firstName.trim(),
			last_name: fields.lastName.trim(),
			phone: fields.phone.trim(),
			image_id: null,
			client_id: client.client_id,
			department_id: null,
			email: fields.email.trim(),
			job_title: null,
			is_deleted: false,
			deleted_at: null,
		};

		const { data, error: signUpError } = await userSignUp(
			user,
			fields.password,
		);

		if (signUpError) {
			setApiError(signUpError.message);
			if (client && !existingClient) {
				await clientDeleteByID(client.client_id);
			}
			setLoading(false);
			return;
		}

		// Only triggers if email confirmation is OFF in Supabase
		if (data.session) {
			router.push("/login");
			queryClient.invalidateQueries({ queryKey: profileKeys.currentUser() });
		} else {
			setApiError(
				"Account created! Check your email to confirm your account before logging in.",
			);
			setLoading(false);
		}
	}

	function errClass(key: FieldKey) {
		return errors[key] ? "border-red-400 focus:ring-red-400" : "";
	}

	return (
		<form onSubmit={handleSubmit} className="space-y-4" noValidate>
			{/* First Name + Last Name */}
			<div className="flex gap-3">
				<div className="flex-1 min-w-0">
					<Label
						htmlFor="firstName"
						className="mb-1.5"
						required
						error={!!errors.firstName}
					>
						First Name
					</Label>
					<Input
						id="firstName"
						name="firstName"
						type="text"
						placeholder="Jane"
						value={fields.firstName}
						onChange={set("firstName")}
						className={errClass("firstName")}
					/>
					{errors.firstName && (
						<p className="text-xs text-destructive mt-1">{errors.firstName}</p>
					)}
				</div>
				<div className="flex-1 min-w-0">
					<Label
						htmlFor="lastName"
						className="mb-1.5"
						required
						error={!!errors.lastName}
					>
						Last Name
					</Label>
					<Input
						id="lastName"
						name="lastName"
						type="text"
						placeholder="Smith"
						value={fields.lastName}
						onChange={set("lastName")}
						className={errClass("lastName")}
					/>
					{errors.lastName && (
						<p className="text-xs text-destructive mt-1">{errors.lastName}</p>
					)}
				</div>
			</div>

			{/* Company Name */}
			<div>
				<Label
					htmlFor="companyName"
					className="mb-1.5"
					required
					error={!!errors.companyName}
				>
					Company Name
				</Label>
				<Input
					id="companyName"
					name="companyName"
					type="text"
					placeholder="Acme Corporation"
					value={fields.companyName}
					onChange={set("companyName")}
					className={errClass("companyName")}
				/>
				{errors.companyName && (
					<p className="text-xs text-destructive mt-1">{errors.companyName}</p>
				)}
			</div>

			{/* Email */}
			<div>
				<Label
					htmlFor="email"
					className="mb-1.5"
					required
					error={!!errors.email}
				>
					Email Address
				</Label>
				<Input
					id="email"
					name="email"
					type="email"
					placeholder="you@company.com"
					value={fields.email}
					onChange={set("email")}
					className={errClass("email")}
				/>
				{errors.email && (
					<p className="text-xs text-destructive mt-1">{errors.email}</p>
				)}
			</div>

			{/* Password */}
			<div>
				<Label
					htmlFor="password"
					className="mb-1.5"
					required
					error={!!errors.password}
				>
					Password
				</Label>
				<PasswordInput
					id="password"
					name="password"
					placeholder="Create a password"
					value={fields.password}
					onChange={set("password")}
					className={errClass("password")}
				/>
				{errors.password && (
					<p className="text-xs text-destructive mt-1">{errors.password}</p>
				)}
			</div>

			{/* Confirm Password */}
			<div>
				<Label
					htmlFor="confirmPassword"
					className="mb-1.5"
					required
					error={!!errors.confirmPassword}
				>
					Confirm Password
				</Label>
				<PasswordInput
					id="confirmPassword"
					name="confirmPassword"
					placeholder="Confirm your password"
					value={fields.confirmPassword}
					onChange={set("confirmPassword")}
					className={errClass("confirmPassword")}
				/>
				{errors.confirmPassword && (
					<p className="text-xs text-destructive mt-1">{errors.confirmPassword}</p>
				)}
			</div>

			{/* Address */}
			<div className="pt-1">
				<p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-3">
					Address
				</p>

				{/* Street Number + Street Name */}
				<div className="flex gap-3 mb-3">
					<div className="w-[30%] shrink-0">
						<Label
							htmlFor="streetNumber"
							className="mb-1.5"
							required
							error={!!errors.streetNumber}
						>
							Street No.
						</Label>
						<Input
							id="streetNumber"
							name="streetNumber"
							type="text"
							placeholder="123"
							value={fields.streetNumber}
							onChange={set("streetNumber")}
							className={errClass("streetNumber")}
						/>
						{errors.streetNumber && (
							<p className="text-xs text-destructive mt-1">{errors.streetNumber}</p>
						)}
					</div>
					<div className="flex-1 min-w-0">
						<Label
							htmlFor="streetName"
							className="mb-1.5"
							required
							error={!!errors.streetName}
						>
							Street Name
						</Label>
						<Input
							id="streetName"
							name="streetName"
							type="text"
							placeholder="Main Street"
							value={fields.streetName}
							onChange={set("streetName")}
							className={errClass("streetName")}
						/>
						{errors.streetName && (
							<p className="text-xs text-destructive mt-1">{errors.streetName}</p>
						)}
					</div>
				</div>

				{/* City + Country */}
				<div className="flex gap-3">
					<div className="flex-1 min-w-0">
						<Label
							htmlFor="city"
							className="mb-1.5"
							required
							error={!!errors.city}
						>
							City
						</Label>
						<Input
							id="city"
							name="city"
							type="text"
							placeholder="New York"
							value={fields.city}
							onChange={set("city")}
							className={errClass("city")}
						/>
						{errors.city && (
							<p className="text-xs text-destructive mt-1">{errors.city}</p>
						)}
					</div>
					<div className="flex-1 min-w-0">
						<Label
							htmlFor="country"
							className="mb-1.5"
							required
							error={!!errors.country}
						>
							Country
						</Label>
						<Input
							id="country"
							name="country"
							type="text"
							placeholder="United States"
							value={fields.country}
							onChange={set("country")}
							className={errClass("country")}
						/>
						{errors.country && (
							<p className="text-xs text-destructive mt-1">{errors.country}</p>
						)}
					</div>
				</div>
			</div>

			{/* TIN */}
			<div>
				<Label htmlFor="tin" className="mb-1.5" required error={!!errors.tin}>
					TIN (Tax Identification Number)
				</Label>
				<Input
					id="tin"
					name="tin"
					type="text"
					inputMode="numeric"
					placeholder="000000000"
					value={fields.tin}
					onChange={setNumeric("tin")}
					className={errClass("tin")}
				/>
				{errors.tin && (
					<p className="text-xs text-destructive mt-1">{errors.tin}</p>
				)}
			</div>

			{/* Phone Number */}
			<div>
				<Label
					htmlFor="phone"
					className="mb-1.5"
					required
					error={!!errors.phone}
				>
					Phone Number
				</Label>
				<Input
					id="phone"
					name="phone"
					type="text"
					inputMode="numeric"
					placeholder="12025550100"
					value={fields.phone}
					onChange={setNumeric("phone")}
					className={errClass("phone")}
				/>
				{errors.phone && (
					<p className="text-xs text-destructive mt-1">{errors.phone}</p>
				)}
			</div>

			{apiError && (
				<p className="text-sm text-destructive bg-red-50 border border-red-200 rounded-md px-3 py-2">
					{apiError}
				</p>
			)}

			<Button type="submit" className="mt-2" disabled={loading}>
				{loading ? "Creating account..." : "Sign Up"}
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
