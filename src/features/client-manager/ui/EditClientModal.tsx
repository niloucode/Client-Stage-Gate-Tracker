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
import { clientUpdate } from "@/entities/client";
import { getFieldErrors } from "@/shared/lib/zod";
import { clientSchema } from "@/shared/schemas";

const CLIENT_NAME_MAX = 40;

interface ClientData {
	clientName: string;
	tin: string;
	email: string;
	contactNumber: string;
	billingAddress: string;
}

interface EditClientModalProps {
	isOpen: boolean;
	clientId?: string;
	initialData?: Partial<ClientData>;
	onClose: () => void;
}

export default function EditClientModal({
	isOpen,
	clientId,
	initialData,
	onClose,
}: EditClientModalProps) {
	const [clientName, setClientName] = useState(initialData?.clientName ?? "");
	const [tin, setTin] = useState(initialData?.tin ?? "");
	const [email, setEmail] = useState(initialData?.email ?? "");
	const [contactNumber, setContactNumber] = useState(
		initialData?.contactNumber ?? "",
	);
	const [billingAddress, setBillingAddress] = useState(
		initialData?.billingAddress ?? "",
	);
	const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

	return (
		<Dialog
			open={isOpen}
			onOpenChange={(open) => {
				if (!open) onClose();
			}}
		>
			<DialogContent className="sm:max-w-lg">
				<DialogHeader>
					<DialogTitle>Edit Client Details</DialogTitle>
					<DialogDescription>
						Update the client information below.
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
							onChange={(value) => setContactNumber(value ?? "")}
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
						<Button
							onClick={async () => {
								if (!clientId) return;
								const result = clientSchema.safeParse({
									client_id: clientId,
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
								await clientUpdate(result.data);
								onClose();
							}}
						>
							Save Changes
						</Button>
					</div>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
