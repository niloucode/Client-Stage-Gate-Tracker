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
	/** Whether the OTHER party has already approved (the only status this user may see). */
	otherPartyApproved: boolean;
	/** Whether THIS user's side is already approved. */
	alreadyApproved: boolean;
	contractName: string;
	onSuccess: () => void;
}

/**
 * 2026-08-15 spec: button-based contract approval (replaces the OTP flow).
 * Owners see their own button + the client's status; clients see their own
 * button + the owner's status; project team members see neither (the page
 * renders this card only for signers).
 */
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
	const otherLabel = variant === "owner" ? "the client" : "the Project Owner";

	const handleApprove = async () => {
		// Returns the action result — ConfirmTextModal surfaces failures.
		return approveMutation.mutateAsync({ projectId, role: variant });
	};

	const handleApproved = () => {
		toast.add({
			title: "Contract Approved",
			description: "Your approval has been recorded.",
			type: "success",
		});
		onSuccess();
	};

	return (
		<Card className="gap-0 p-0 bg-neutral-surface border border-border rounded-md shadow-xs">
			<CardHeader className="px-5 py-4 border-b border-border gap-1">
				<CardTitle className="text-base text-foreground">
					Approve Contract
				</CardTitle>
				<CardDescription className="text-xs">
					Both the Project Owner and the client must approve before the
					project can start.
				</CardDescription>
			</CardHeader>

			<CardContent className="p-5 flex flex-col gap-4">
				{/* Other party's status — the only cross-party status visible */}
				<div
					className={`flex items-center gap-2 rounded-md border px-3 py-2.5 text-xs font-medium ${
						otherPartyApproved
							? "border-emerald-200 bg-emerald-50 text-emerald-700"
							: "border-amber-200 bg-amber-50 text-amber-700"
					}`}
				>
					{otherPartyApproved ? (
						<CheckCircle2 className="h-4 w-4 shrink-0" />
					) : (
						<Clock3 className="h-4 w-4 shrink-0" />
					)}
					<span>
						{otherLabel} approval:{" "}
						{otherPartyApproved ? "Approved" : "Pending"}
					</span>
				</div>

				{alreadyApproved ? (
					<div className="flex items-center gap-2 rounded-md bg-[#ECFDF3] px-3 py-2.5 text-sm font-medium text-green-700">
						<CheckCircle2 className="h-4 w-4 shrink-0" />
						You have approved this contract as the {roleLabel}.
					</div>
				) : (
					<>
						<p className="text-xs text-muted-foreground">
							As the {roleLabel}, approve this contract to proceed.
						</p>
						<Button
							onClick={() => setConfirmOpen(true)}
							className="w-full h-10 text-xs font-semibold"
						>
							Approve Contract
						</Button>
					</>
				)}
			</CardContent>

			<ConfirmTextModal
				open={confirmOpen}
				onClose={() => setConfirmOpen(false)}
				noParamFunc={handleApprove}
				confirmPhrase={CONFIRM_PHRASE}
				displayText={`You are about to approve the contract "${contractName}" as the ${roleLabel}. To confirm, type "${CONFIRM_PHRASE}" below.`}
				displayTitle="Confirm Contract Approval"
				buttonText="Approve Contract"
				onSuccess={handleApproved}
			/>
		</Card>
	);
}
