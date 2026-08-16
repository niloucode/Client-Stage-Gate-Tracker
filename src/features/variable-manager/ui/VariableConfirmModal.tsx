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
import { useResetOnOpen } from "@/shared/hooks/useResetOnOpen";

interface VariableConfirmModalProps {
	isOpen: boolean;
	title: string;
	description: string;
	confirmName: string;
	actionLabel: string;
	variant?: "default" | "destructive";
	onClose: () => void;
	onConfirm: () => void;
}

export function VariableConfirmModal({
	isOpen,
	title,
	description,
	confirmName,
	actionLabel,
	variant = "default",
	onClose,
	onConfirm,
}: VariableConfirmModalProps) {
	const [typedName, setTypedName] = useState("");
	const [hasAttempted, setHasAttempted] = useState(false);

	useResetOnOpen(isOpen, () => {
		setTypedName("");
		setHasAttempted(false);
	});

	const isMatch = typedName.trim() === confirmName.trim();

	const handleConfirm = () => {
		setHasAttempted(true);
		if (!isMatch) return;
		onConfirm();
		onClose();
	};

	return (
		<Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>{title}</DialogTitle>
				</DialogHeader>

				<div className="space-y-4 py-2">
					<p className="text-xs text-muted-foreground leading-relaxed">
						{description}
					</p>

					<div className="space-y-1.5">
						<label
							htmlFor="confirm-variable-name"
							className="text-xs text-foreground"
						>
							Type the variable name to confirm:
						</label>
						<Input
							id="confirm-variable-name"
							value={typedName}
							onChange={(e) => {
								setTypedName(e.target.value);
								setHasAttempted(false);
							}}
							placeholder={confirmName}
							className="h-10"
						/>
						{hasAttempted && !isMatch && (
							<p className="text-xs text-destructive">
								The entered name does not match.
							</p>
						)}
					</div>
				</div>

				<DialogFooter className="pt-2">
					<Button type="button" variant="ghost" onClick={onClose}>
						Cancel
					</Button>
					<Button
						type="button"
						variant={variant}
						disabled={!isMatch}
						onClick={handleConfirm}
					>
						{actionLabel}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
