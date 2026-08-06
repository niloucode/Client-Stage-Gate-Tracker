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
	return (
		<AlertDialog
			open={isOpen}
			onOpenChange={(open) => {
				if (!open) onCancel();
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
					<AlertDialogCancel onClick={onCancel}>Cancel</AlertDialogCancel>
					<AlertDialogAction
						onClick={onConfirm}
						icon="delete"
						className="bg-destructive hover:bg-destructive/90"
					>
						{confirmLabel ?? `Delete ${noun}`}
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}
