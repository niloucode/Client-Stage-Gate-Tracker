import type { Tag } from "@/entities/types";

import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog"

import { TagBadge } from "@/shared/ui"

export default function TagModalDelete({
	tag,
	isOpen,
	onClose,
	onConfirm,
}: {
	tag: Tag;
	isOpen?: boolean;
	onClose: () => void;
	onConfirm: (tag_id: string) => void;
}) {
	function handleConfirm() {
		onConfirm(tag.tag_id);
	}

	return (
		<AlertDialog open={isOpen ?? true} onOpenChange={(open) => { if (!open) onClose() }}>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle> Delete Tag</AlertDialogTitle>
					<AlertDialogDescription>
						Are you sure you want to delete the tag, <TagBadge tag={tag} />? This action cannot be undone.
					</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
                    <AlertDialogCancel onClick={onClose}>Cancel</AlertDialogCancel>
					<AlertDialogAction onClick={handleConfirm} icon="delete" className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}
