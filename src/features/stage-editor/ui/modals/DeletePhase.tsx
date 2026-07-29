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

interface DeletePhaseProps {
	isOpen: boolean;
	phaseLabel?: string;
	onConfirm: () => void;
	onCancel: () => void;
}

export function DeletePhase({
	isOpen,
	phaseLabel,
	onConfirm,
	onCancel,
}: DeletePhaseProps) {
	return (
		<AlertDialog open={isOpen} onOpenChange={(open) => { if (!open) onCancel() }}>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>Delete {phaseLabel ?? "Phase"}</AlertDialogTitle>
					<AlertDialogDescription>
						Are you sure you want to delete this phase? This action cannot be
						undone.
					</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel onClick={onCancel}>Cancel</AlertDialogCancel>
					<AlertDialogAction onClick={onConfirm} icon="delete" className="bg-destructive hover:bg-destructive/90">
						Delete {phaseLabel ?? "Phase"}
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}
