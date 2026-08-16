"use client";

import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import type { VariableItem } from "@/entities/variable";

interface VariableNotesModalProps {
	isOpen: boolean;
	variable: VariableItem | null;
	/** Client viewers see ONLY their own (client) notes — team notes never render. */
	clientView?: boolean;
	onClose: () => void;
}

/** Team/owner notes viewer for a variable (hidden for clients). */
export function VariableNotesModal({
	isOpen,
	variable,
	clientView = false,
	onClose,
}: VariableNotesModalProps) {
	if (!variable) return null;

	return (
		<Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
			<DialogContent className="sm:max-w-lg">
				<DialogHeader>
					<DialogTitle>Variable Notes</DialogTitle>
				</DialogHeader>

				<div className="space-y-4 py-2">
					{!clientView && (
						<div className="space-y-1.5">
							<Label>Notes to the Team</Label>
							<div className="p-3 rounded-md bg-neutral-surface border border-brand-100 min-h-16 text-xs leading-relaxed text-foreground whitespace-pre-wrap">
								{variable.notesTeam || (
									<span className="text-muted-foreground italic">
										No team notes provided.
									</span>
								)}
							</div>
						</div>
					)}

					<div className="space-y-1.5">
						<Label>Notes to the Client</Label>
						<div className="p-3 rounded-md bg-neutral-surface border border-brand-100 min-h-16 text-xs leading-relaxed text-foreground whitespace-pre-wrap">
							{variable.notesClient || (
								<span className="text-muted-foreground italic">
									No client notes provided.
								</span>
							)}
						</div>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}
