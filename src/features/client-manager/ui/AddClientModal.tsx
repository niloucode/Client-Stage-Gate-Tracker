"use client";

import { useState } from "react";
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
import { clientCreate } from "@/entities/client";
import { getFieldErrors } from "@/shared/lib/zod";
import { clientSchema } from "@/shared/schemas";

const CLIENT_NAME_MAX = 40;

interface AddClientModalProps {
	isOpen: boolean;
	onClose: () => void;
}

export default function AddClientModal({
	isOpen,
	onClose,
}: AddClientModalProps) {
	const [clientName, setClientName] = useState("");
	const [tin, setTin] = useState("");
	const [email, setEmail] = useState("");
	const [contactNumber, setContactNumber] = useState("");
	const [billingAddress, setBillingAddress] = useState("");
	const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

	const handleSubmit = async () => {
		const result = clientSchema.safeParse({
			client_id: crypto.randomUUID(),
			client_name: clientName,
			tin,
			email,
			phone: contactNumber,
			billing_address: billingAddress,
			is_deleted: false,
		});
		if (!result.success) {
			const mapped = getFieldErrors(result);
			setFieldErrors(mapped);
			return;
		}
		setFieldErrors({});
		await clientCreate(result.data);
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
					<DialogTitle>Add Client</DialogTitle>
					<DialogDescription>
						Fill in the details to add a new client.
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
						<span className="absolute bottom-1.5 right-2 text-[10px] text-muted-foreground pointer-events-none">
							{clientName.length}/{CLIENT_NAME_MAX}
						</span>
					</div>
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
							<p className="text-xs text-destructive mt-1">{fieldErrors.tin}</p>
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
						<p className="text-xs text-destructive mt-1">{fieldErrors.phone}</p>
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

				<DialogFooter className="bg-muted/50 border-t p-6">
					<div className="flex items-center justify-end gap-3 w-full">
						<Button variant="ghost" onClick={onClose}>
							Cancel
						</Button>
						<Button onClick={handleSubmit}>Add Client</Button>
					</div>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
