"use client";

import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { VariableItem } from "../model/types";

interface VariableNotesModalProps {
	isOpen: boolean;
	variable: VariableItem | null;
	onClose: () => void;
}

export function VariableNotesModal({
	isOpen,
	variable,
	onClose,
}: VariableNotesModalProps) {
	if (!variable) return null;

	return (
		<Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
			<DialogContent className="sm:max-w-lg">
				<DialogHeader>
					<div className="flex items-center gap-2.5">
						<DialogTitle>Variable Notes</DialogTitle>
						{/* <Badge variant="secondary" className="capitalize text-[10px]">
							{variable.type}
						</Badge> */}
					</div>
				</DialogHeader>

				<div className="space-y-4 py-2">
					{/* Team Notes */}
					<div className="space-y-1.5">
						<span className="text-xs text-neutral-border uppercase tracking-wider">
							Notes to the Team
						</span>
						<div className="p-3 rounded-md bg-neutral-subtle/70 border border-border min-h-16 text-xs leading-relaxed text-foreground whitespace-pre-wrap">
							{variable.notesTeam || (
								<span className="text-muted-foreground italic">No team notes provided.</span>
							)}
						</div>
					</div>

					{/* Client Notes */}
					<div className="space-y-1.5">
						<span className="text-xs text-neutral-border uppercase tracking-wider">
							Notes to the Client
						</span>
						<div className="p-3 rounded-md bg-neutral-subtle/70 border border-border min-h-16 text-xs leading-relaxed text-foreground whitespace-pre-wrap">
							{variable.notesClient || (
								<span className="text-muted-foreground italic">No client notes provided.</span>
							)}
						</div>
					</div>
				</div>

				{/* <DialogFooter className="pt-2">
					<Button onClick={onClose}>Close</Button>
				</DialogFooter> */}
			</DialogContent>
		</Dialog>
	);
}