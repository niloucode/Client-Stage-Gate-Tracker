"use client";

import { useState, useEffect } from "react";
import { Label } from "@/shared/ui/label";
import { Backdrop } from "@/shared/ui/backdrop"

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
		<Backdrop isOpen={isOpen} onClose={onClose}>
			<div className="bg-neutral-surface rounded-xl shadow-xl w-full max-w-md p-6 relative">
				<div className="flex items-center">

					<h2 className="text-xl font-bold text-[#0F172A]">
						Delete Project
					</h2>
					<button
						onClick={handleClose}
						className="ml-auto text-[#94A3B8] hover:text-[#475569] transition-colors"
					>
						<svg width="20" height="20" viewBox="0 0 20 20" fill="none">
							<path
								d="M15 5L5 15M5 5L15 15"
								stroke="currentColor"
								strokeWidth="2"
								strokeLinecap="round"
							/>
						</svg>
					</button>
				</div>
				<div className="h-px bg-[#dde4ee] -mx-6 my-4" />
				<p className="text-sm text-neutral-subtle">
					This action cannot be undone. Please type{" "}
					<strong className="text-[#0F172A]">{projectName}</strong> to
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

				<div className="h-px bg-[#dde4ee] -mx-6 my-4"/>

				<div className="flex justify-end gap-3">
					<button
						onClick={handleConfirm}
						disabled={!namesMatch}
						className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all shadow-sm ${
							namesMatch
								? "bg-[#EF4444] text-neutral-surface hover:bg-[#DC2626]"
								: "bg-[#F1F5F9] text-[#94A3B8] cursor-not-allowed"
						}`}
					>
						Delete Project
					</button>
				</div>
			</div>
		</Backdrop>
	);
}
