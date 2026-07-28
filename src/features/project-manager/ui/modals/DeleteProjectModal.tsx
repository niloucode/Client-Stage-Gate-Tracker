"use client";

import { useState, useEffect } from "react";
import { Label } from "@/shared/ui/label";
import { Backdrop } from "@/shared/ui/backdrop"
import { Modal } from "@/shared/ui/modal"
import { Button } from "@/shared/ui/button"

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

	const namesMatch =
		typedName.trim() === projectName && typedName.trim().length > 0;

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

	if (!isOpen) return null;

	return (
		<Modal 
			isOpen={isOpen}
			onClose={onClose}
			title="Delete Project"
			footer={<Button
					onClick={handleConfirm}
					disabled={!namesMatch}
					variant={namesMatch ? "red" : "disabled"}>
						Delete Project
					</Button>}>
			<p className="text-sm text-neutral-border">
					This action cannot be undone. Please type{" "}
					<span className="font-bold text-foreground">{projectName}</span> to
					confirm.
				</p>
				<div className="">
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
							<p className="text-xs text-red-500 mt-1">
								Project name does not match.
							</p>
						)}
					</div>
				</div>
		</Modal>
	);
}
