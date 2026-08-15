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
import { toast } from "@/components/ui/toast";

interface ConfirmTextModalProps {
	confirmPhrase: string;
	open: boolean;
	onClose: () => void;
	noParamFunc?: () => Promise<unknown>;
	displayText: string;
	displayTitle: string;
	buttonText: string;
	onSuccess: () => void;
}

export function ConfirmTextModal({
	open,
	onClose,
	noParamFunc,
	confirmPhrase,
	displayText,
	displayTitle,
	buttonText,
	onSuccess,
}: ConfirmTextModalProps) {
	const [confirmText, setConfirmText] = useState("");
	const canConfirm = confirmText === confirmPhrase;

	const handleConfirm = async () => {
		if (!canConfirm) return;

		try {
			const result = await noParamFunc?.();

			// Actions return { success:false, error } instead of throwing —
			// surface the error and keep the modal open (no silent success).
			const outcome = result as
				| { success?: boolean; error?: string }
				| undefined;
			if (outcome && outcome.success === false) {
				toast.add({
					title: "Action Failed",
					description: outcome.error ?? "Please try again.",
					type: "error",
				});
				return;
			}

			onSuccess();
			handleClose();
		} catch (error) {
			console.error("Confirm action failed:", error);
			toast.add({
				title: "Action Failed",
				description:
					error instanceof Error ? error.message : "Please try again.",
				type: "error",
			});
		}
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
					className="px-6 pl-10 py-5 h-28 flex justify-center"
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

