"use client"

import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import type { VariableItem } from "../model/types"

interface VariableNotesModalProps {
	isOpen: boolean
	variable: VariableItem | null
	onClose: () => void
}

export function VariableNotesModal({
	isOpen,
	variable,
	onClose,
}: VariableNotesModalProps) {
	if (!variable) return null

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
						<Label>
							Notes to the Team
						</Label>
						<div className="p-3 rounded-md bg-neutral-surface border border-brand-100 min-h-16 text-xs leading-relaxed text-foreground whitespace-pre-wrap">
							{variable.notesTeam || (
								<span className="text-muted-foreground italic">No team notes provided.</span>
							)}
						</div>
					</div>

					{/* Client Notes */}
					<div className="space-y-1.5">
						<Label>
							Notes to the Client
						</Label>
						<div className="p-3 rounded-md bg-neutral-surface border border-brand-100 min-h-16 text-xs leading-relaxed text-foreground whitespace-pre-wrap">
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
	)
}