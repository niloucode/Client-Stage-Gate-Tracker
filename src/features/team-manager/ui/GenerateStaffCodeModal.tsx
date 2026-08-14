"use client";

import { useState } from "react";
import { Copy, Key } from "lucide-react";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogDescription,
	DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { generateStaffInviteCode } from "@/entities/department";
import { toast } from "@/components/ui/toast";

interface GenerateStaffCodeModalProps {
	isOpen: boolean;
	onClose: () => void;
}

export function GenerateStaffCodeModal({
	isOpen,
	onClose,
}: GenerateStaffCodeModalProps) {
	const [department, setDepartment] = useState<
		"Project Team" | "Project Owner"
	>("Project Team");
	const [generatedCode, setGeneratedCode] = useState<string | null>(null);
	const [isGenerating, setIsGenerating] = useState(false);
	const [error, setError] = useState<string | null>(null);

	// Track previous isOpen state to handle resetting state when modal opens
	const [prevIsOpen, setPrevIsOpen] = useState(isOpen);

	// Reset state during render when opening; retains content during closing transition
	if (isOpen !== prevIsOpen) {
		setPrevIsOpen(isOpen);
		if (isOpen) {
			setGeneratedCode(null);
			setError(null);
		}
	}

	const handleGenerate = async () => {
		setIsGenerating(true);
		setError(null);

		const result = await generateStaffInviteCode(department);
		setIsGenerating(false);

		if (!result.success || !result.inviteCode) {
			const errMsg = result.error ?? "Failed to generate invite code.";
			setError(errMsg);
			toast.add({
				title: "Generation Failed",
				description: errMsg,
				type: "error",
			});
			return;
		}

		setGeneratedCode(result.inviteCode);
		toast.add({
			title: "Invite Code Generated",
			description: `Code for ${department} created successfully.`,
			type: "success",
		});
	};

	const handleCopy = () => {
		if (!generatedCode) return;
		void navigator.clipboard.writeText(generatedCode);
		toast.add({
			title: "Copied to Clipboard",
			description: "Invite code copied to your clipboard.",
			type: "success",
		});
	};

	const handleClose = () => {
		onClose();
	};

	return (
		<Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2">
						<Key className="h-5 w-5 text-brand-600" />
						<span>Generate Invite Code</span>
					</DialogTitle>
					<DialogDescription className="min-h-10 leading-snug">
						{generatedCode
							? "This invite code is shown ONCE. Share it with the new team member to let them register."
							: "Choose the department role for this invite code."}
					</DialogDescription>
				</DialogHeader>

				{generatedCode ? (
					<div className="flex min-h-40 flex-col justify-between">
						<div className="space-y-1.5">
							<Label>{department} Invite Code</Label>
							<div className="flex items-center justify-between gap-2 rounded-md border border-brand-100 bg-neutral-subtle px-4 py-3">
								<span className="font-mono text-lg tracking-[0.25em] text-foreground select-all">
									{generatedCode}
								</span>
								<Button
									variant="ghost"
									size="icon-sm"
									aria-label="Copy invite code"
									onClick={handleCopy}
									className="shrink-0"
								>
									<Copy className="h-4 w-4" />
								</Button>
							</div>
						</div>

						<DialogFooter className="pt-2">
							<Button onClick={handleClose}>Done</Button>
						</DialogFooter>
					</div>
				) : (
					<div className="flex min-h-40 flex-col justify-between py-2">
						<div className="space-y-2">
							<Label>Target Department</Label>
							<Select
								value={department}
								onValueChange={(val) =>
									setDepartment(val as "Project Team" | "Project Owner")
								}
							>
								<SelectTrigger className="w-full">
									<SelectValue placeholder="Select Department" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="Project Owner">Project Owner</SelectItem>
									<SelectItem value="Project Team">Project Team</SelectItem>
								</SelectContent>
							</Select>

							{error && (
								<p className="text-xs text-destructive bg-red-50 p-2.5 rounded-md border border-red-200">
									{error}
								</p>
							)}
						</div>

						<DialogFooter className="pt-2">
							<Button variant="ghost" onClick={handleClose}>
								Cancel
							</Button>
							<Button onClick={handleGenerate} disabled={isGenerating}>
								{isGenerating ? "Generating…" : "Generate Code"}
							</Button>
						</DialogFooter>
					</div>
				)}
			</DialogContent>
		</Dialog>
	);
}