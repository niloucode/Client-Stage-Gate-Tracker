"use client";

import React, { useState, useEffect } from "react";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogDescription,
	DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { PhoneInput } from "@/components/ui/phone-input";
import { FormInput } from "@/components/ui/forminput"; // Adjust path as needed
import { clientCreate, clientUpdate } from "@/entities/client";
import { getFieldErrors } from "@/shared/lib/zod";
import { clientSchema } from "@/shared/schemas";

export interface ClientFormData {
	clientName: string;
	tin: string;
	email: string;
	contactNumber: string;
	billingAddress: string;
}

interface ClientFormModalProps {
	isOpen: boolean;
	clientId?: string;
	initialData?: Partial<ClientFormData>;
	onClose: () => void;
}

export default function ClientFormModal({
	isOpen,
	clientId,
	initialData,
	onClose,
}: ClientFormModalProps) {
	const isEdit = !!clientId;
	const [clientName, setClientName] = useState<string>("");
	const [tin, setTin] = useState<string>("");
	const [email, setEmail] = useState<string>("");
	const [contactNumber, setContactNumber] = useState<string>("");
	const [billingAddress, setBillingAddress] = useState<string>("");
	const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

	// Helper to clear individual field errors on change
	const handleClearError = (key: string): void => {
		setFieldErrors((prev: Record<string, string>) => {
			if (!prev[key]) return prev;
			const newErrors = { ...prev };
			delete newErrors[key];
			return newErrors;
		});
	};

	// Reset form when modal opens or client changes
	useEffect(() => {
		if (!isOpen) return;
		setClientName(initialData?.clientName ?? "");
		setTin(initialData?.tin ?? "");
		setEmail(initialData?.email ?? "");
		setContactNumber(initialData?.contactNumber ?? "");
		setBillingAddress(initialData?.billingAddress ?? "");
		setFieldErrors({});
	}, [
		isOpen,
		clientId,
		initialData?.clientName,
		initialData?.tin,
		initialData?.email,
		initialData?.contactNumber,
		initialData?.billingAddress,
	]);

	const handleSubmit = async (): Promise<void> => {
		const parsed = clientSchema.safeParse({
			client_id: clientId || crypto.randomUUID(),
			client_name: clientName,
			tin,
			email,
			phone: contactNumber,
			billing_address: billingAddress,
			is_deleted: false,
		});

		if (!parsed.success) {
			const mapped = getFieldErrors(parsed);
			setFieldErrors(mapped);
			return;
		}

		setFieldErrors({});
		if (isEdit) {
			await clientUpdate(parsed.data);
		} else {
			await clientCreate(parsed.data);
		}
		onClose();
	};

	return (
		<Dialog
			open={isOpen}
			onOpenChange={(open: boolean) => {
				if (!open) onClose();
			}}
		>
			<DialogContent className="sm:max-w-lg">
				<DialogHeader>
					<DialogTitle>
						{isEdit ? "Edit Client Details" : "Add Client"}
					</DialogTitle>
					<DialogDescription>
						{isEdit
							? "Update the client information below."
							: "Fill in the details to add a new client."}
					</DialogDescription>
				</DialogHeader>

				<div className="flex flex-col gap-5 px-6 py-6">
					{/* Client Name */}
					<FormInput
						label="Client Name"
						required
						maxLength={40}
						placeholder="Acme Corp"
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
							onChange={(e) => setTin(e.target.value)}
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
						placeholder="4050 Oz Street"
						value={billingAddress}
						error={fieldErrors.billing_address}
						onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
							setBillingAddress(e.target.value)
						}
						onClearError={() => handleClearError("billing_address")}
					/>
				</div>

				<DialogFooter className="bg-muted/50 border-t p-6">
					<div className="flex items-center justify-end gap-3 w-full">
						<Button variant="ghost" onClick={onClose}>
							Cancel
						</Button>
						<Button onClick={handleSubmit}>
							{isEdit ? "Save Changes" : "Add Client"}
						</Button>
					</div>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}