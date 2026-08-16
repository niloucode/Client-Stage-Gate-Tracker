"use client";

import { useRef, useState, type ChangeEvent, type SyntheticEvent } from "react";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "@/components/ui/toast";
import {
	MessageSquare,
	Paperclip,
	X,
	CheckCircle2,
	XCircle,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import {
	collectImages,
	revokeImagePreviews,
	uploadImages,
} from "@/shared/lib/imageUpload";
import { useDecideGate } from "@/entities/gate";

export interface GateFeedbackGiveModalProps {
	isOpen: boolean;
	onClose: () => void;
	decisionVariant?: "approved" | "rejected";
	gateId: string;
	stageId: string;
}

/**
 * Approve/decline dialog: feedback comment + image uploads (client-only).
 * @returns The result.
 */
export function GateFeedbackGiveModal({
	isOpen,
	onClose,
	decisionVariant = "approved",
	gateId,
	stageId,
}: GateFeedbackGiveModalProps) {
	const [feedbackText, setFeedbackText] = useState("");
	const [skipFeedback, setSkipFeedback] = useState(false);
	const [imageFiles, setImageFiles] = useState<File[]>([]);
	const [imagePreviews, setImagePreviews] = useState<string[]>([]);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const fileInputRef = useRef<HTMLInputElement>(null);

	const decideGateMutation = useDecideGate(stageId);
	const isApproved = decisionVariant === "approved";

	function handleImageChange(e: ChangeEvent<HTMLInputElement>) {
		const { images, tooLarge } = collectImages(e.target.files);
		for (const name of tooLarge) {
			toast.add({
				title: "File Too Large",
				description: `"${name}" must be under 5MB.`,
				type: "error",
			});
		}
		if (images.length > 0) {
			setImageFiles((prev) => [...prev, ...images.map((i) => i.file)]);
			setImagePreviews((prev) => [...prev, ...images.map((i) => i.preview)]);
		}
		e.target.value = "";
	}

	function removeImage(index: number) {
		revokeImagePreviews([imagePreviews[index]]);
		setImageFiles((prev) => prev.filter((_, i) => i !== index));
		setImagePreviews((prev) => prev.filter((_, i) => i !== index));
	}

	function handleClose() {
		revokeImagePreviews(imagePreviews);
		setFeedbackText("");
		setSkipFeedback(false);
		setImageFiles([]);
		setImagePreviews([]);
		onClose();
	}

	async function handleSubmit(e: SyntheticEvent) {
		e.preventDefault();
		if (isSubmitting) return;

		const finalFeedback = skipFeedback
			? "No feedback provided."
			: feedbackText.trim();
		if (!skipFeedback && !finalFeedback && imageFiles.length === 0) return;
		setIsSubmitting(true);

		// All-or-nothing image upload (shared helper), then decide.
		const {
			imageUrls,
			uploadedPaths,
			error: uploadError,
		} = await uploadImages(skipFeedback ? [] : imageFiles, "gates");
		const supabase = createClient();

		if (uploadError) {
			if (uploadedPaths.length > 0) {
				await supabase.storage.from("images").remove(uploadedPaths);
			}
			toast.add({
				title: "Upload Failed",
				description: uploadError,
				type: "error",
			});
			setIsSubmitting(false);
			return;
		}

		try {
			await decideGateMutation.mutateAsync({
				gateId,
				decision: isApproved ? "APPROVED" : "REJECTED",
				feedback: finalFeedback,
				imageUrls,
			});
			toast.add({
				title: isApproved ? "Gate Approved" : "Gate Rejected",
				description: skipFeedback
					? `Stage Gate ${decisionVariant} without feedback.`
					: "Feedback and decision submitted successfully.",
				type: isApproved ? "success" : "error",
			});
			handleClose();
		} catch (error) {
			if (uploadedPaths.length > 0) {
				await supabase.storage.from("images").remove(uploadedPaths);
			}
			toast.add({
				title: isApproved ? "Approval Failed" : "Rejection Failed",
				description:
					error instanceof Error ? error.message : "Please try again.",
				type: "error",
			});
		} finally {
			setIsSubmitting(false);
		}
	}

	return (
		<Dialog
			open={isOpen}
			onOpenChange={(open) => {
				if (!open && !isSubmitting) handleClose();
			}}
		>
			<DialogContent className="max-w-xl">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2">
						{isApproved ? (
							<CheckCircle2 className="size-5 text-emerald-600 shrink-0" />
						) : (
							<XCircle className="size-5 text-red-600 shrink-0" />
						)}
						<span>{isApproved ? "Approve" : "Decline"} Gate Feedback</span>
					</DialogTitle>
					<DialogDescription>
						Place your feedback comment and optional image attachments.
					</DialogDescription>
				</DialogHeader>

				{/* Feedback Form */}
				<form onSubmit={handleSubmit} className="space-y-4 py-2">
					<div className="space-y-2">
						<div className="flex items-center justify-between">
							<div className="flex items-center gap-2">
								<MessageSquare className="w-4 h-4 text-brand-600 shrink-0" />
								<span className="text-xs font-bold tracking-wider text-foreground uppercase">
									{isApproved ? "Approval Comment" : "Rejection Feedback"}
								</span>
							</div>
							{imageFiles.length > 0 && (
								<span className="text-xs text-muted-foreground font-medium">
									{imageFiles.length} image(s) attached
								</span>
							)}
						</div>

						<Textarea
							value={skipFeedback ? "" : feedbackText}
							onChange={(e) => setFeedbackText(e.target.value)}
							disabled={skipFeedback}
							placeholder={
								skipFeedback
									? 'Feedback skipped ("I don\'t want to give feedback" is checked)'
									: `Write your feedback or review for ${isApproved ? "approving" : "declining"} this gate...`
							}
							rows={4}
							className="resize-none text-xs"
						/>
					</div>

					{/* Image Attachment Section */}
					{!skipFeedback && (
						<div className="space-y-2">
							<div className="flex items-center justify-between">
								<button
									type="button"
									onClick={() => fileInputRef.current?.click()}
									className="inline-flex items-center gap-1.5 text-xs font-medium text-brand-600 hover:text-brand-700 cursor-pointer"
								>
									<Paperclip className="w-3.5 h-3.5" />
									<span>Attach Images</span>
								</button>
								<span className="text-[11px] text-muted-foreground">
									(JPG, PNG, WebP · Max 5MB)
								</span>
								<input
									ref={fileInputRef}
									type="file"
									accept="image/jpeg,image/png,image/webp"
									multiple
									onChange={handleImageChange}
									className="sr-only"
								/>
							</div>

							{imagePreviews.length > 0 && (
								<div className="flex flex-wrap gap-2 pt-1">
									{imagePreviews.map((preview, idx) => (
										<div key={idx} className="relative inline-block group">
											{/* eslint-disable-next-line @next/next/no-img-element -- object-URL preview; upload happens on submit */}
											<img
												src={preview}
												alt={`Attachment ${idx + 1}`}
												className="h-16 w-16 rounded-md border border-border object-cover"
											/>
											<button
												type="button"
												onClick={() => removeImage(idx)}
												className="absolute -top-1.5 -right-1.5 size-4 rounded-full bg-slate-800 text-white flex items-center justify-center text-[10px] hover:bg-red-600 transition-colors"
												aria-label="Remove image"
											>
												<X className="size-3" />
											</button>
										</div>
									))}
								</div>
							)}
						</div>
					)}

					{/* Skip Feedback Option */}
					<label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
						<Checkbox
							checked={skipFeedback}
							onCheckedChange={(checked) => setSkipFeedback(checked)}
						/>
						I don&rsquo;t want to give feedback
					</label>

					{/* Footer Actions */}
					<DialogFooter className="pt-2 gap-2" showCloseButton={false}>
						<Button
							type="button"
							variant="ghost"
							onClick={handleClose}
							disabled={isSubmitting}
						>
							Cancel
						</Button>
						{isApproved ? (
							<Button
								type="submit"
								variant="default"
								className="bg-emerald-600 hover:bg-emerald-700 text-white"
								disabled={isSubmitting}
							>
								<CheckCircle2 className="size-4" />
								{isSubmitting ? "Submitting…" : "Approve Stage Gate"}
							</Button>
						) : (
							<Button
								type="submit"
								variant="destructive"
								disabled={isSubmitting}
							>
								<XCircle className="size-4" />
								{isSubmitting ? "Submitting…" : "Decline Stage Gate"}
							</Button>
						)}
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
