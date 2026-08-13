"use client";

import React, { useState } from "react";
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
import { Copy } from "lucide-react";
import { clientCreate, clientUpdate } from "@/entities/client";
import { getFieldErrors } from "@/shared/lib/zod";
import { clientSchema, clientCreateSchema } from "@/shared/schemas";
import { useResetOnOpen } from "@/shared/hooks/useResetOnOpen";

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
	// Plain invite code returned exactly once by clientCreate.
	const [generatedCode, setGeneratedCode] = useState<string | null>(null);
	const [createError, setCreateError] = useState<string | null>(null);

	// Helper to clear individual field errors on change
	const handleClearError = (key: string): void => {
		setFieldErrors((prev: Record<string, string>) => {
			if (!prev[key]) return prev;
			const newErrors = { ...prev };
			delete newErrors[key];
			return newErrors;
		});
	};

	// Reset form when the modal opens (deferred a frame so the dialog can
	// finish mounting before controlled inputs are reset).
	useResetOnOpen(isOpen, () => {
		setClientName(initialData?.clientName ?? "");
		setTin(initialData?.tin ?? "");
		setEmail(initialData?.email ?? "");
		setContactNumber(initialData?.contactNumber ?? "");
		setBillingAddress(initialData?.billingAddress ?? "");
		setFieldErrors({});
		setGeneratedCode(null);
		setCreateError(null);
	});

	const handleSubmit = async (): Promise<void> => {
		setFieldErrors({});
		setCreateError(null);
		// Create uses clientCreateSchema (no client_id — UUIDs come from the
		// DB, project rule #2); edit validates the full schema with the
		// server-issued id.
		if (isEdit) {
			const parsed = clientSchema.safeParse({
				client_id: clientId,
				client_name: clientName,
				tin,
				email,
				phone: contactNumber,
				billing_address: billingAddress,
				is_deleted: false,
			});
			if (!parsed.success) {
				setFieldErrors(getFieldErrors(parsed));
				return;
			}
			const result = await clientUpdate(parsed.data);
			if (!result.success) {
				setCreateError(result.error);
				return;
			}
			onClose();
		} else {
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
			const result = await clientCreate(parsed.data);
			if (!result.success) {
				setCreateError(result.error);
				return;
			}
			// The invite code is returned exactly once — show it before
			// closing so the owner can share it with the client's employees.
			setGeneratedCode(result.inviteCode ?? null);
		}
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

				{generatedCode ? (
					<div className="flex flex-col gap-4">
						<p className="text-sm text-muted-foreground">
							Client created. Share this invite code with the client&apos;s
							employees so they can create their accounts —{" "}
							<span className="font-semibold text-foreground">
								it is shown only once
							</span>
							.
						</p>
						<div className="flex items-center justify-between gap-2 rounded-md border border-brand-100 bg-neutral-subtle px-4 py-3">
							<span className="font-mono text-lg tracking-[0.3em] text-foreground">
								{generatedCode}
							</span>
							<Button
								variant="ghost"
								size="icon-sm"
								aria-label="Copy invite code"
								onClick={() => navigator.clipboard?.writeText(generatedCode)}
							>
								<Copy className="h-4 w-4" />
							</Button>
						</div>
						{createError && (
							<p className="text-sm text-destructive bg-red-50 border border-red-200 rounded-md px-3 py-2">
								{createError}
							</p>
						)}
						<DialogFooter className="border-t pt-4">
							<Button onClick={onClose}>Done</Button>
						</DialogFooter>
					</div>
				) : (
				<>
				<div className="flex flex-col gap-5">
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

					<PhoneInput
						label="Contact Number"
						required
						value={contactNumber}
						onChange={(val: string) => {
							setContactNumber(val);
							handleClearError("phone");
						}}
						placeholder="+1 (555) 000-0000"
						error={fieldErrors.phone}
					/>

					{/* Billing Address */}
					<FormInput
						variant="textarea"
						label="Billing Address"
						required
						rows={4}
						maxLength={50}
						placeholder="4050 Oz Street"
						value={billingAddress}
						error={fieldErrors.billing_address}
						onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
							setBillingAddress(e.target.value)
						}
						onClearError={() => handleClearError("billing_address")}
					/>

					{/* Create/edit failures (e.g. duplicate TIN, owner-only
						rejection) are visible here — not only in the
						invite-code success view. */}
					{createError && (
						<p className="text-sm text-destructive bg-red-50 border border-red-200 rounded-md px-3 py-2">
							{createError}
						</p>
					)}
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
				</>
				)}
			</DialogContent>
		</Dialog>
	);
}
