"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { Backdrop } from "@/shared/ui/backdrop";

const CLIENT_NAME_MAX = 40;

interface ClientData {
	clientName: string;
	tin: string;
	email: string;
	contactNumber: string;
	billingAddress: string;
}

interface EditClientModalProps {
	isOpen: boolean
	initialData?: Partial<ClientData>;
	onClose?: () => void;
	onSubmit?: (data: ClientData) => void;
}

function RequiredLabel({ children }: { children: string }) {
	return (
		<label className="text-base font-normal" style={{ color: "#464555" }}>
			{children}
			<span className="text-red-500">*</span>
		</label>
	);
}

export default function EditClientModal({
	isOpen,
	initialData,
	onClose,
	onSubmit,
}: EditClientModalProps) {
	const [clientName, setClientName] = useState(
		initialData?.clientName ?? "Acme Corp",
	);

	return (
		<Backdrop isOpen={isOpen} onClose={onClose}>
			<div
				className="w-full max-w-[512px] overflow-hidden rounded-xl shadow-xl"
				style={{ backgroundColor: "#f9f9ff" }}
			>
				{/* Header */}
				<div
					className="flex items-center justify-between px-6 py-5"
					style={{
						backgroundColor: "#f0f3ff",
						borderBottom: "1px solid #c7c4d8",
					}}
				>
					<h3 className="text-base font-bold" style={{ color: "#151c27" }}>
						Edit Client Details
					</h3>
					<button
						onClick={onClose}
						className="flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-foreground/10"
						aria-label="Close"
					>
						<X className="h-4 w-4" style={{ color: "#464555" }} />
					</button>
				</div>

				{/* Body */}
				<div className="flex flex-col gap-5 px-6 py-6">
					{/* Client Name */}
					<div className="flex flex-col gap-2">
						<RequiredLabel>Client Name</RequiredLabel>
						<input
							type="text"
							maxLength={CLIENT_NAME_MAX}
							value={clientName}
							onChange={(e) => setClientName(e.target.value)}
							className="w-full rounded-md bg-neutral-surface px-4 py-3 text-base outline-none focus:ring-1 focus:ring-brand-500"
							style={{ border: "1px solid #c7c4d8", color: "#151c27" }}
						/>
						<span className="text-base" style={{ color: "#737280" }}>
							{clientName.length}/{CLIENT_NAME_MAX}
						</span>
					</div>

					{/* TIN + Email */}
					<div className="flex gap-4">
						<div className="flex flex-1 flex-col gap-2">
							<RequiredLabel>TIN</RequiredLabel>
							<input
								type="text"
								defaultValue={initialData?.tin ?? "4444444444"}
								className="w-full rounded-md bg-neutral-surface px-4 py-3 text-base outline-none focus:ring-1 focus:ring-brand-500"
								style={{ border: "1px solid #c7c4d8", color: "#151c27" }}
							/>
						</div>
						<div className="flex flex-1 flex-col gap-2">
							<RequiredLabel>Email</RequiredLabel>
							<input
								type="email"
								defaultValue={initialData?.email ?? "contact@client.com"}
								className="w-full rounded-md bg-neutral-surface px-4 py-3 text-base outline-none focus:ring-1 focus:ring-brand-500"
								style={{ border: "1px solid #c7c4d8", color: "#151c27" }}
							/>
						</div>
					</div>

					{/* Contact Number */}
					<div className="flex flex-col gap-2">
						<RequiredLabel>Contact Number</RequiredLabel>
						<input
							type="tel"
							defaultValue={initialData?.contactNumber ?? "+1 (555) 000-0000"}
							className="w-full rounded-md bg-neutral-surface px-4 py-3 text-base outline-none focus:ring-1 focus:ring-brand-500"
							style={{ border: "1px solid #c7c4d8", color: "#151c27" }}
						/>
					</div>

					{/* Billing Address */}
					<div className="flex flex-col gap-2">
						<RequiredLabel>Billing Address</RequiredLabel>
						<textarea
							defaultValue={initialData?.billingAddress ?? "4050 Oz Street"}
							rows={4}
							className="w-full resize-none rounded-md bg-neutral-surface px-4 py-3 text-base outline-none focus:ring-1 focus:ring-brand-500"
							style={{ border: "1px solid #c7c4d8", color: "#151c27" }}
						/>
					</div>
				</div>

				{/* Footer */}
				<div
					className="flex items-center justify-end gap-3 px-6 py-5"
					style={{ backgroundColor: "#f0f3ff", borderTop: "1px solid #c7c4d8" }}
				>
					<button
						onClick={onClose}
						className="rounded-md px-5 py-3 text-base font-bold transition-colors hover:bg-foreground/5"
						style={{ border: "1px solid #c7c4d8", color: "#464555" }}
					>
						Cancel
					</button>
					<button
						className="rounded-xl px-5 py-3 text-base font-bold text-neutral-surface transition-colors hover:opacity-90"
						style={{ backgroundColor: "#4f46e5" }}
					>
						Save Changes
					</button>
				</div>
			</div>
		</Backdrop>
	);
}
