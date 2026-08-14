"use client";

import { useState } from "react";
import { Copy, Check, Key } from "lucide-react";
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
	const [copied, setCopied] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const handleGenerate = async () => {
		setIsGenerating(true);
		setError(null);
		setCopied(false);

		const result = await generateStaffInviteCode(department);
		setIsGenerating(false);

		if (!result.success || !result.inviteCode) {
			setError(result.error ?? "Failed to generate invite code.");
			return;
		}

		setGeneratedCode(result.inviteCode);
	};

	const handleCopy = () => {
		if (!generatedCode) return;
		void navigator.clipboard.writeText(generatedCode);
		setCopied(true);
		setTimeout(() => setCopied(false), 2000);
	};

	const handleClose = () => {
		setGeneratedCode(null);
		setError(null);
		setCopied(false);
		onClose();
	};

	return (
		<Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2">
						<Key className="h-5 w-5 text-brand-600" />
						<span>Generate Team Invite Code</span>
					</DialogTitle>
					<DialogDescription>
						{generatedCode
							? "This invite code is shown ONCE. Share it with the new team member to let them register."
							: "Choose the department role for this invite code."}
					</DialogDescription>
				</DialogHeader>

				{generatedCode ? (
					<div className="space-y-4 py-2">
						<div className="flex flex-col gap-1.5">
							<span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
								{department} Invite Code
							</span>
							<div className="flex items-center justify-between gap-2 rounded-md border border-brand-100 bg-neutral-subtle px-4 py-3">
								<span className="font-mono text-lg font-bold tracking-[0.25em] text-foreground select-all">
									{generatedCode}
								</span>
								<Button
									variant="ghost"
									size="icon-sm"
									aria-label="Copy invite code"
									onClick={handleCopy}
									className="shrink-0"
								>
									{copied ? (
										<Check className="h-4 w-4 text-emerald-600" />
									) : (
										<Copy className="h-4 w-4" />
									)}
								</Button>
							</div>
						</div>

						{copied && (
							<p className="text-xs text-emerald-600 font-medium text-center">
								✓ Copied to clipboard!
							</p>
						)}

						<DialogFooter className="pt-2">
							<Button onClick={handleClose}>Done</Button>
						</DialogFooter>
					</div>
				) : (
					<div className="space-y-5 py-2">
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
						</div>

						{error && (
							<p className="text-xs text-destructive bg-red-50 p-2.5 rounded-md border border-red-200">
								{error}
							</p>
						)}

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
