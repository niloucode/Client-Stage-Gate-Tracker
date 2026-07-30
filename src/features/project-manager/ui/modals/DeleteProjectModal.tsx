"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

interface DeleteProjectModalProps {
	isOpen: boolean;
	projectName: string;
	onClose: () => void;
	onConfirm: () => void;
}

export function DeleteProjectModal({
	isOpen,
	projectName,
	onClose,
	onConfirm,
}: DeleteProjectModalProps) {
	const [typedName, setTypedName] = useState("");
	const [hasAttempted, setHasAttempted] = useState(false);

	const namesMatch = typedName === projectName;

	// Reset state when the modal opens/closes or project changes
	const handleClose = () => {
		setTypedName("");
		setHasAttempted(false);
		onClose();
	};

	// Reset input when modal opens with a new project
	useEffect(() => {
		if (isOpen && projectName) {
			const id = setTimeout(() => {
				setTypedName("");
				setHasAttempted(false);
			}, 0);
			return () => clearTimeout(id);
		}
	}, [isOpen, projectName]);

	const handleConfirm = () => {
		setHasAttempted(true);
		if (!namesMatch) return;
		onConfirm();
	};

	return (
		<Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose() }}>
			<DialogContent>
				<DialogHeader><DialogTitle>Delete Project</DialogTitle></DialogHeader>
				<div className="px-6 space-y-4">
					<p className="text-sm text-neutral-border">
						This action cannot be undone. Please type{" "}
						<span className="font-bold text-foreground">{projectName}</span>
						 to confirm.
					</p>
					<div>
						<input
							type="text"
							value={typedName}
							onChange={(e) => {
								setTypedName(e.target.value);
								setHasAttempted(false);
							}}
							placeholder="Project Name"
							className={`w-full px-3 py-2 bg-neutral-surface border rounded-lg text-sm text-[#0F172A] focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all mt-1.5 ${
								hasAttempted && !namesMatch
									? "border-red-400 focus:ring-red-400"
									: "border-brand-100"
							}`}
						/>
						{hasAttempted && !namesMatch && (
							<p className="text-xs text-destructive mt-1">
								Project name does not match.
							</p>
						)}
					</div>
				</div>
		<DialogFooter>
				<Button
					onClick={handleConfirm}
					disabled={!namesMatch}
					variant="destructive"
					icon="delete">
						Delete Project
					</Button>
			</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
