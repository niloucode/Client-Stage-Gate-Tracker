"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { clientCreate } from "@/entities/client"

const CLIENT_NAME_MAX = 40

interface AddClientModalProps {
	isOpen: boolean
	onClose: () => void
}

export default function AddClientModal({
	isOpen,
	onClose,
}: AddClientModalProps) {
	const [clientName, setClientName] = useState("")
	const [tin, setTin] = useState("")
	const [email, setEmail] = useState("")
	const [contactNumber, setContactNumber] = useState("")
	const [billingAddress, setBillingAddress] = useState("")

	const handleSubmit = async () => {
		await clientCreate({
			client_id: crypto.randomUUID(),
			client_name: clientName,
			tin,
			billing_address: billingAddress,
			is_deleted: false,
		})
		onClose()
	}

	return (
		<Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose() }}>
			<DialogContent className="sm:max-w-lg">
				<DialogHeader>
					<DialogTitle>Add Client</DialogTitle>
					<DialogDescription>Fill in the details to add a new client.</DialogDescription>
				</DialogHeader>

				<div className="flex flex-col gap-5 px-6 py-6">
					{/* Client Name */}
					<div className="flex flex-col gap-2">
						<Label required>Client Name</Label>
						<Input
							type="text"
							maxLength={CLIENT_NAME_MAX}
							placeholder="Acme Corp"
							value={clientName}
							onChange={(e) => setClientName(e.target.value)}
						/>
						<span className="text-sm text-muted-foreground">
							{clientName.length}/{CLIENT_NAME_MAX}
						</span>
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
						</div>
						<div className="flex flex-1 flex-col gap-2">
							<Label required>Email</Label>
							<Input
								type="email"
								placeholder="contact@client.com"
								value={email}
								onChange={(e) => setEmail(e.target.value)}
							/>
						</div>
					</div>

					{/* Contact Number */}
					<div className="flex flex-col gap-2">
						<Label required>Contact Number</Label>
						<Input
							type="tel"
							placeholder="+1 (555) 000-0000"
							value={contactNumber}
							onChange={(e) => setContactNumber(e.target.value)}
						/>
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
					</div>
				</div>

				<DialogFooter className="bg-muted/50 border-t p-6">
					<div className="flex items-center justify-end gap-3 w-full">
						<Button variant="ghost" onClick={onClose}>
							Cancel
						</Button>
						<Button icon="add" onClick={handleSubmit}>
							Add Client
						</Button>
					</div>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	)
}
