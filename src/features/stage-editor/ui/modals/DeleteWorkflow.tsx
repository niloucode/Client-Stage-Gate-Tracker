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

interface DeleteWorkflowProps {
	isOpen: boolean;
	workflowLabel?: string;
	onConfirm: () => void;
	onCancel: () => void;
}

export function DeleteWorkflow({
	isOpen,
	workflowLabel,
	onConfirm,
	onCancel,
}: DeleteWorkflowProps) {
	return (
		<AlertDialog open={isOpen} onOpenChange={(open) => { if (!open) onCancel() }}>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>Delete {workflowLabel ?? "Workflow"}</AlertDialogTitle>
					<AlertDialogDescription>
						Are you sure you want to delete this workflow? This action cannot be
						undone.
					</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel onClick={onCancel}>Cancel</AlertDialogCancel>
					<AlertDialogAction onClick={onConfirm} icon="delete" className="bg-destructive hover:bg-destructive/90">
						Delete Workflow
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}
