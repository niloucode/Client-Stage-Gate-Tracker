"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { PhoneInput } from "@/components/ui/phone-input";
import { FormInput } from "@/components/ui/forminput";
import { clientCreate } from "@/entities/client";
import { getFieldErrors } from "@/shared/lib/zod";
import { clientCreateSchema } from "@/shared/schemas";
import Link from "next/link";

export function ClientSignupForm() {
	const [clientName, setClientName] = useState<string>("");
	const [tin, setTin] = useState<string>("");
	const [email, setEmail] = useState<string>("");
	const [contactNumber, setContactNumber] = useState<string>("");
	const [billingAddress, setBillingAddress] = useState<string>("");
	const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
	const [isLoading, setIsLoading] = useState<boolean>(false);

	// Helper to clear individual field errors on change
	const handleClearError = (key: string): void => {
		setFieldErrors((prev: Record<string, string>) => {
			if (!prev[key]) return prev;
			const newErrors = { ...prev };
			delete newErrors[key];
			return newErrors;
		});
	};

	const handleSubmit = async (e: React.FormEvent): Promise<void> => {
		e.preventDefault();
		setFieldErrors({});

		const parsed = clientCreateSchema.safeParse({
			client_name: clientName,
			tin,
			email,
			phone: contactNumber,
			billing_address: billingAddress,
		});

		if (!parsed.success) {
			setFieldErrors(getFieldErrors(parsed));
			return;
		}

		setIsLoading(true);

		try {
			await clientCreate(parsed.data);
			// Redirect or post-signup logic here
		} catch (error) {
			console.error("Registration failed:", error);
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<form onSubmit={handleSubmit} className="flex flex-col gap-5">
			{/* Client Name */}
			<FormInput
				label="Client Name"
				required
				maxLength={40}
				placeholder="Teyvat Incorporated"
				value={clientName}
				error={fieldErrors.client_name}
				onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
					setClientName(e.target.value)
				}
				onClearError={() => handleClearError("client_name")}
			/>

			{/* TIN + Email */}
			<div className="flex gap-4">
				<FormInput
					containerClassName="flex-1"
					label="TIN"
					type="tin"
					required
					value={tin}
					error={fieldErrors.tin}
					onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
						setTin(e.target.value)
					}
					onClearError={() => handleClearError("tin")}
				/>

				<FormInput
					containerClassName="flex-1"
					label="Email"
					type="email"
					required
					placeholder="contact@client.com"
					value={email}
					error={fieldErrors.email}
					onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
						setEmail(e.target.value)
					}
					onClearError={() => handleClearError("email")}
				/>
			</div>

			{/* Contact Number (Custom PhoneInput) */}
			<div className="flex flex-col gap-2">
				<div className="flex">
					<Label required error={!!fieldErrors.phone}>
						Contact Number
					</Label>
					{fieldErrors.phone && (
						<div className="ml-auto text-xs text-destructive">
							{fieldErrors.phone}
						</div>
					)}
				</div>
				<PhoneInput
					value={contactNumber}
					onChange={(val: string) => {
						setContactNumber(val);
						handleClearError("phone");
					}}
					placeholder="+1 (555) 000-0000"
				/>
			</div>

			{/* Billing Address */}
			<FormInput
				variant="textarea"
				label="Billing Address"
				required
				rows={4}
				maxLength={40}
				placeholder="8960 Evernight Terrace, Mondstadt, Oregon, USA"
				value={billingAddress}
				error={fieldErrors.billing_address}
				onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
					setBillingAddress(e.target.value)
				}
				onClearError={() => handleClearError("billing_address")}
			/>

				<div className="flex flex-col gap-2">
				{/* Footer */}
				<div className="text-center mt-auto mb-2">
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
				{/* Submit Button */}
				<Button type="submit" className="w-full" disabled={isLoading}>
					{isLoading ? "Registering..." : "Register Company"}
				</Button>
				{/* OR divider */}
			<div className="relative my-4">
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
			</div>
		</form>
	);
}