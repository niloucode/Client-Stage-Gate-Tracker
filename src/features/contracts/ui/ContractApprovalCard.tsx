"use client";

import { useState } from "react";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Clock3 } from "lucide-react";
import { toast } from "@/components/ui/toast";
import { useApproveContract } from "@/entities/contract";
import { ConfirmTextModal } from "./ConfirmTextModal";

const CONFIRM_PHRASE = "Yes, I'm Sure";

export interface ContractApprovalCardProps {
	projectId: string;
	/** Which party THIS user is: owner (roleAssignment) or client (contract client_id). */
	variant: "owner" | "client";
	/** Whether the OTHER party has already approved. */
	otherPartyApproved: boolean;
	/** Whether THIS user's side is already approved. */
	alreadyApproved: boolean;
	contractName: string;
	onSuccess: () => void;
}

export function ContractApprovalCard({
	projectId,
	variant,
	otherPartyApproved,
	alreadyApproved,
	contractName,
	onSuccess,
}: ContractApprovalCardProps) {
	const [confirmOpen, setConfirmOpen] = useState(false);
	const approveMutation = useApproveContract();

	const roleLabel = variant === "owner" ? "Project Owner" : "Client";
	const otherRoleLabel = variant === "owner" ? "Client" : "Project Owner";

	// Derive individual party approval states
	const clientApproved =
		variant === "client" ? alreadyApproved : otherPartyApproved;
	const ownerApproved =
		variant === "owner" ? alreadyApproved : otherPartyApproved;
	const bothApproved = clientApproved && ownerApproved;

	const handleApprove = async () => {
		return approveMutation.mutateAsync({ projectId, role: variant });
	};

	const handleApproved = () => {
		toast.add({
			title: "Contract Approved",
			description: `Your approval as the ${roleLabel} has been recorded.`,
			type: "success",
		});
		onSuccess();
	};

	return (
		<Card className="gap-0 p-0 bg-neutral-surface border border-border rounded-md shadow-xs">
			<CardHeader className="px-5 py-4 border-b border-border gap-1">
				<CardTitle>
					Approve Contract
				</CardTitle>
				<CardDescription className="text-xs text-muted-foreground">
					Both the Project Owner and the Client must approve before the
					project can begin.
				</CardDescription>
			</CardHeader>

			<CardContent className="p-5 flex flex-col gap-4">
				{/* 1. Both Parties' Status Breakdown */}
				<div className="flex flex-col gap-2">
					{/* Client Status */}
					<div
						className={`flex items-center justify-between rounded-md border px-3.5 py-2.5 text-xs  ${
							clientApproved
								? "border-emerald-200 bg-emerald-50 text-emerald-800"
								: "border-amber-200 bg-amber-50 text-amber-800"
						}`}
					>
						<div className="flex items-center gap-2">
							{clientApproved ? (
								<CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
							) : (
								<Clock3 className="h-4 w-4 shrink-0 text-amber-600" />
							)}
							<span>Client Status:</span>
						</div>
						<span className="">
							{clientApproved ? "Approved" : "Pending"}
						</span>
					</div>

					{/* Project Owner Status */}
					<div
						className={`flex items-center justify-between rounded-md border px-3.5 py-2.5 text-xs  ${
							ownerApproved
								? "border-emerald-200 bg-emerald-50 text-emerald-800"
								: "border-amber-200 bg-amber-50 text-amber-800"
						}`}
					>
						<div className="flex items-center gap-2">
							{ownerApproved ? (
								<CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
							) : (
								<Clock3 className="h-4 w-4 shrink-0 text-amber-600" />
							)}
							<span>Project Owner Status:</span>
						</div>
						<span className="">
							{ownerApproved ? "Approved" : "Pending"}
						</span>
					</div>
				</div>

				{/* 2. Outcome Banner or Action Button */}
				{bothApproved ? (
					<div className="flex items-center gap-2.5 rounded-md border border-emerald-200 bg-emerald-50 px-3.5 py-3 text-xs  text-emerald-800">
						<CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
						<span>Both parties have approved.</span>
					</div>
				) : alreadyApproved ? (
					<div className="flex items-center gap-2.5 rounded-md border border-border bg-neutral-subtle px-3.5 py-3 text-xs  text-muted-foreground">
						<Clock3 className="h-4 w-4 shrink-0 text-muted-foreground" />
						<span>
							You have approved. Awaiting {otherRoleLabel} approval.
						</span>
					</div>
				) : (
					<div className="space-y-3 pt-1">
						<p className="text-xs text-muted-foreground leading-relaxed">
							Please review the document and confirm your approval as the{" "}
							<strong className=" text-foreground">
								{roleLabel}
							</strong>
							.
						</p>
						<Button
							onClick={() => setConfirmOpen(true)}
							className="w-full h-10 text-xs  cursor-pointer"
						>
							Approve as {roleLabel}
						</Button>
					</div>
				)}
			</CardContent>

			<ConfirmTextModal
				open={confirmOpen}
				onClose={() => setConfirmOpen(false)}
				noParamFunc={handleApprove}
				confirmPhrase={CONFIRM_PHRASE}
				displayText={`You are about to approve the contract "${contractName}" as the ${roleLabel}. To confirm your agreement, type "${CONFIRM_PHRASE}" below.`}
				displayTitle="Confirm Contract Approval"
				buttonText={`Approve as ${roleLabel}`}
				onSuccess={handleApproved}
			/>
		</Card>
	);
}