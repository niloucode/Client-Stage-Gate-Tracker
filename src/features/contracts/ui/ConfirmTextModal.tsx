"use client";

import { useState } from "react";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
// import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export interface ClientOption {
	id: string;
	name: string;
	email: string;
}

export interface ContractDetails {
	id: string;
	name: string;
}

interface ConfirmTextModalProps {
	confirmPhrase: string;
	open: boolean;
	onClose: () => void;
	noParamFunc?: () => Promise<void>;
	twoParamFunc?: (profileId: string, projectId: string) => Promise<void>;
	client?: ClientOption | null;
	contractDetails: ContractDetails;
	displayText: string;
	displayTitle: string;
	buttonText: string;
	onSuccess: () => void;
	setSelectedClient?: (selectedClient: ClientOption | null) => void;
}

// function initialsFor(name: string) {
// 	return name
// 		.split(" ")
// 		.map((p) => p[0])
// 		.filter(Boolean)
// 		.slice(0, 2)
// 		.join("")
// 		.toUpperCase();
// }

export function ConfirmTextModal({
	open,
	onClose,
	noParamFunc,
	twoParamFunc,
	client,
	contractDetails,
	confirmPhrase,
	displayText,
	displayTitle,
	buttonText,
	onSuccess,
	setSelectedClient,
}: ConfirmTextModalProps) {
	const [confirmText, setConfirmText] = useState("");
	const canConfirm = confirmText === confirmPhrase;

	const handleConfirm = async () => {
		//error check
		if (!canConfirm || !client?.id) return;

		if (twoParamFunc) await twoParamFunc?.(client?.id, contractDetails.id);
		else if (noParamFunc) await noParamFunc?.();
		onSuccess();

		//reset after changing client
		setSelectedClient?.(null);
		handleClose();
	};

	const handleClose = () => {
		setConfirmText("");
		onClose();
	};

	return (
		<Dialog open={open} onOpenChange={handleClose}>
			<DialogContent className="max-w-[480px] gap-0 overflow-hidden p-0 border border-[#C7C4D84D]">
				{/* Header */}
				<DialogHeader
					className="px-6 py-5"
					style={{
						backgroundColor: "#EEEEEC",
						borderBottom: "1px solid #c7c4d8",
					}}
				>
					<DialogTitle className="text-base font-bold text-[#151c27]">
						{displayTitle}
					</DialogTitle>
				</DialogHeader>

				{/* Body */}
				<div className="flex flex-col gap-5 px-6 py-6">
					{/* Warning text */}
					<p className="text-sm leading-relaxed text-[#464555]">
						{displayText}
					</p>

					{/* Confirm input */}
					<Input
						value={confirmText}
						onChange={(e) => setConfirmText(e.target.value)}
						placeholder={confirmPhrase}
					/>
				</div>

				{/* Footer */}
				<DialogFooter
					className="px-10 pb-8"
					style={{
						backgroundColor: "#EEEEEC",
						borderTop: "1px solid #c7c4d8",
					}}
				>
					{/* <Button variant="outline" onClick={handleClose}>
						Cancel
					</Button> */}
					<Button
						disabled={!canConfirm}
						onClick={handleConfirm}
						style={{ backgroundColor: canConfirm ? "#6b1fa8" : undefined }}
					>
						{buttonText}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

export default ConfirmTextModal;
