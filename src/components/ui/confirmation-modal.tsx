"use client";

import {
	AlertDialog,
	AlertDialogContent,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogCancel,
	AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { useRef } from "react";
import type { ReactNode } from "react";

export interface ConfirmationModalProps {
	isOpen: boolean;
	noun?: string;
	title?: string;
	description?: ReactNode;
	confirmLabel?: string;
	cancelLabel?: string;
	variant?: "default" | "destructive";
	onConfirm: () => void;
	onCancel: () => void;
}

/**
 * Generic confirmation dialog on top of Shadcn / Radix AlertDialog.
 * Supports delete confirmations, unsaved changes prompts, and action confirmations.
 */
export function ConfirmationModal({
	isOpen,
	noun = "Item",
	title,
	description,
	confirmLabel,
	cancelLabel = "Cancel",
	variant = "destructive",
	onConfirm,
	onCancel,
}: ConfirmationModalProps) {
	// Radix closes the dialog on both Cancel and Action clicks, which also
	// fires onOpenChange(false). Track a confirmed click so onCancel is not
	// invoked when the dialog closes because the user confirmed.
	const confirmedRef = useRef(false);

	return (
		<AlertDialog
			open={isOpen}
			onOpenChange={(open) => {
				if (!open && !confirmedRef.current) onCancel();
				confirmedRef.current = false;
			}}
		>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>{title ?? `Delete ${noun}`}</AlertDialogTitle>
					<AlertDialogDescription>
						{description ??
							`Are you sure you want to delete this ${noun.toLowerCase()}? This action cannot be undone.`}
					</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel onClick={onCancel}>
						{cancelLabel}
					</AlertDialogCancel>
					<AlertDialogAction
						onClick={() => {
							confirmedRef.current = true;
							onConfirm();
						}}
						className={
							variant === "destructive"
								? "bg-destructive hover:bg-destructive/90 text-destructive-foreground"
								: ""
						}
					>
						{confirmLabel ?? (variant === "destructive" ? `Delete ${noun}` : "Confirm")}
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}

// Alias for backward compatibility
export const ConfirmDeleteModal = ConfirmationModal;
export default ConfirmationModal;