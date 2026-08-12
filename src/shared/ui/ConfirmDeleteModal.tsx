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

interface ConfirmDeleteModalProps {
	isOpen: boolean;
	/** The thing being deleted, e.g. "Phase" — drives default copy. */
	noun: string;
	/** Overrides the default title (`Delete {noun}`). */
	title?: string;
	/** Overrides the default description text. */
	description?: ReactNode;
	/** Overrides the default confirm button label (`Delete {noun}`). */
	confirmLabel?: string;
	onConfirm: () => void;
	onCancel: () => void;
}

/**
 * Generic destructive-confirmation dialog on top of shadcn AlertDialog.
 * Replaces the hand-rolled DeletePhase / DeleteWorkflow / TagModalDelete modals.
 */
export function ConfirmDeleteModal({
	isOpen,
	noun,
	title,
	description,
	confirmLabel,
	onConfirm,
	onCancel,
}: ConfirmDeleteModalProps) {
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
					{/* Cancel: no onClick — Radix closes the dialog, onOpenChange handles onCancel once. */}
					<AlertDialogCancel>Cancel</AlertDialogCancel>
					<AlertDialogAction
						onClick={() => {
							confirmedRef.current = true;
							onConfirm();
						}}
						className="bg-destructive hover:bg-destructive/90"
					>
						{confirmLabel ?? `Delete ${noun}`}
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}
