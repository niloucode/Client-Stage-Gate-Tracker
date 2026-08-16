"use client";

import { useState } from "react";
import { Key, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogDescription,
	DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "@/components/ui/toast";

interface ClientCodeModalProps {
	isOpen: boolean;
	onClose: () => void;
	clientName?: string;
	newInviteCode: string | null;
	isRegenerating: boolean;
	error: string | null;
}

/** One-time display of a client invite code (copy-to-clipboard). */
export function ClientCodeModal({
	isOpen,
	onClose,
	clientName,
	newInviteCode,
	isRegenerating,
	error,
}: ClientCodeModalProps) {
	const [copied, setCopied] = useState(false);

	const handleCopy = () => {
		if (!newInviteCode) return;
		void navigator.clipboard?.writeText(newInviteCode);
		setCopied(true);
		toast.add({
			title: "Copied",
			description: "Invite code copied to clipboard.",
			type: "success",
		});
		setTimeout(() => setCopied(false), 4000);
	};

	return (
		<Dialog
			open={isOpen}
			onOpenChange={(open) => {
				if (!open) onClose();
			}}
		>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2">
						<Key className="h-5 w-5 text-brand-600" />
						<span>Generate Invite Code</span>
					</DialogTitle>
					<DialogDescription className="min-h-10 leading-snug">
						{newInviteCode
							? "This code is shown ONCE. Share it with the client's employees so they can create their accounts."
							: (error ??
								(isRegenerating
									? "Generating a new code… (the previous code is invalidated)"
									: "A new code will invalidate the previous one."))}
					</DialogDescription>
				</DialogHeader>
				<div className="flex min-h-40 flex-col justify-between">
					<div className="space-y-1.5">
						<div className="flex justify-between items-center w-full">
							<Label>{clientName} Invite Code</Label>

							<div className="h-4">
								{copied && (
									<p className="text-xs text-emerald-600 font-medium text-start ml-auto">
										✓ Copied to clipboard!
									</p>
								)}
							</div>
						</div>
						<div className="flex items-center justify-between gap-2 rounded-md border border-brand-100 bg-neutral-subtle px-4 py-3">
							<span className="font-mono text-lg tracking-[0.25em] text-foreground select-all">
								{newInviteCode ?? ""}
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
						<Button onClick={onClose}>Done</Button>
					</DialogFooter>
				</div>
			</DialogContent>
		</Dialog>
	);
}
