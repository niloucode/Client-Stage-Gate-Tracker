"use client";

import { useState, useEffect } from "react";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogDescription,
	DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { PhoneInput } from "@/components/ui/phone-input";
import { clientCreate, clientUpdate } from "@/entities/client";
import { getFieldErrors } from "@/shared/lib/zod";
import { clientSchema } from "@/shared/schemas";

const CLIENT_NAME_MAX = 40;

interface ClientFormData {
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
	const [clientName, setClientName] = useState("");
	const [tin, setTin] = useState("");
	const [email, setEmail] = useState("");
	const [contactNumber, setContactNumber] = useState("");
	const [billingAddress, setBillingAddress] = useState("");
	const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

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

	const handleSubmit = async () => {
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
			onOpenChange={(open) => {
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
					<div className="flex flex-col gap-2">
						<div className="flex items-center justify-between">
							<Label required>Client Name</Label>
							<span className="text-[10px] text-muted-foreground">
								{clientName.length}/{CLIENT_NAME_MAX}
							</span>
						</div>
						<Input
							type="text"
							maxLength={CLIENT_NAME_MAX}
							placeholder="Acme Corp"
							value={clientName}
							onChange={(e) => setClientName(e.target.value)}
						/>
						{fieldErrors.client_name && (
							<p className="text-xs text-destructive mt-1">
								{fieldErrors.client_name}
							</p>
						)}
					</div>

					{/* TIN + Email */}
					<div className="flex gap-4">
						<div className="flex flex-1 flex-col gap-2">
							<Label required>TIN</Label>
							<Input
								type="text"
								placeholder="4444444444"
								value={tin}
								onChange={(e) => setTin(e.target.value)}
							/>
							{fieldErrors.tin && (
								<p className="text-xs text-destructive mt-1">
									{fieldErrors.tin}
								</p>
							)}
						</div>
						<div className="flex flex-1 flex-col gap-2">
							<Label required>Email</Label>
							<Input
								type="email"
								placeholder="contact@client.com"
								value={email}
								onChange={(e) => setEmail(e.target.value)}
							/>
							{fieldErrors.email && (
								<p className="text-xs text-destructive mt-1">
									{fieldErrors.email}
								</p>
							)}
						</div>
					</div>

					{/* Contact Number */}
					<div className="flex flex-col gap-2">
						<Label required>Contact Number</Label>
						<PhoneInput
							value={contactNumber}
							onChange={setContactNumber}
							placeholder="+1 (555) 000-0000"
						/>
						{fieldErrors.phone && (
							<p className="text-xs text-destructive mt-1">
								{fieldErrors.phone}
							</p>
						)}
					</div>

					{/* Billing Address */}
					<div className="flex flex-col gap-2">
						<Label required>Billing Address</Label>
						<Textarea
							placeholder="4050 Oz Street"
							rows={4}
							value={billingAddress}
							onChange={(e) => setBillingAddress(e.target.value)}
						/>
						{fieldErrors.billing_address && (
							<p className="text-xs text-destructive mt-1">
								{fieldErrors.billing_address}
							</p>
						)}
					</div>
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
