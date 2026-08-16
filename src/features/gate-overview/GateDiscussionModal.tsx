"use client";

import { useMemo, useRef, useState } from "react";
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
import { toast } from "@/components/ui/toast";
import { Paperclip, X, Send } from "lucide-react";
import ImageLightbox from "@/shared/ui/image-lightbox";
import { createClient } from "@/lib/supabase/client";
import { useCreateGateComment, useGateComments } from "@/entities/gate";

export interface GateDiscussionModalProps {
	/** The gate whose discussion is shown; null closes the modal. */
	gateId: string | null;
	stageId: string;
	/** Only the latest gate accepts new comments (spec 8). */
	canComment: boolean;
	onClose: () => void;
}

interface CommentRow {
	commentId: string;
	date: string;
	description: string;
	profileName: string;
	images: { image_src: string }[];
}

function getInitials(name: string): string {
	return name
		.split(" ")
		.map((part) => part[0])
		.filter(Boolean)
		.slice(0, 2)
		.join("")
		.toUpperCase();
}

export function GateDiscussionModal({
	gateId,
	stageId,
	canComment,
	onClose,
}: GateDiscussionModalProps) {
	const {
		data: comments = [],
		isLoading,
		isError,
	} = useGateComments(gateId ?? undefined);
	const createCommentMutation = useCreateGateComment(
		gateId ?? undefined,
		stageId,
	);

	const [text, setText] = useState("");
	const [files, setFiles] = useState<File[]>([]);
	const [previews, setPreviews] = useState<string[]>([]);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);
	const fileInputRef = useRef<HTMLInputElement>(null);

	const isOpen = gateId !== null;
	const rows: CommentRow[] = useMemo(
		() =>
			comments.map((c) => ({
				commentId: c.commentId,
				date: c.date,
				description: c.description,
				profileName: c.profileName,
				images: c.images,
			})),
		[comments],
	);

	function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
		const selected = e.target.files;
		if (!selected || selected.length === 0) return;
		const nextFiles: File[] = [];
		const nextPreviews: string[] = [];
		for (const file of Array.from(selected)) {
			if (file.size > 5 * 1024 * 1024) {
				toast.add({
					title: "File Too Large",
					description: `"${file.name}" must be under 5MB.`,
					type: "error",
				});
				continue;
			}
			nextFiles.push(file);
			nextPreviews.push(URL.createObjectURL(file));
		}
		if (nextFiles.length > 0) {
			setFiles((prev) => [...prev, ...nextFiles]);
			setPreviews((prev) => [...prev, ...nextPreviews]);
		}
		e.target.value = "";
	}

	function removePreview(index: number) {
		URL.revokeObjectURL(previews[index]);
		setFiles((prev) => prev.filter((_, i) => i !== index));
		setPreviews((prev) => prev.filter((_, i) => i !== index));
	}

	function resetForm() {
		previews.forEach((url) => URL.revokeObjectURL(url));
		setText("");
		setFiles([]);
		setPreviews([]);
	}

	async function handleSubmit(e: React.SyntheticEvent) {
		e.preventDefault();
		if (!gateId || isSubmitting) return;
		const trimmed = text.trim();
		if (!trimmed && files.length === 0) return;
		setIsSubmitting(true);

		// All-or-nothing image upload (ticket-board pattern), then comment.
		const uploadedPaths: string[] = [];
		const imageUrls: string[] = [];
		let uploadError: string | null = null;
		const supabase = createClient();
		for (const file of files) {
			try {
				const fileExt = file.name.split(".").pop();
				const fileName = `${crypto.randomUUID()}.${fileExt}`;
				const filePath = `gates/${fileName}`;
				const { error } = await supabase.storage
					.from("images")
					.upload(filePath, file, { cacheControl: "3600", upsert: false });
				if (error) {
					uploadError = `Failed to upload image: ${error.message}`;
					break;
				}
				uploadedPaths.push(filePath);
				const { data: publicUrl } = supabase.storage
					.from("images")
					.getPublicUrl(filePath);
				imageUrls.push(publicUrl.publicUrl);
			} catch (err) {
				uploadError =
					err instanceof Error ? err.message : "Failed to upload images.";
				break;
			}
		}

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
			await createCommentMutation.mutateAsync({
				description: trimmed,
				imageUrls,
			});
			toast.add({
				title: "Comment Added",
				description: "Your comment was added to the gate discussion.",
				type: "success",
			});
			resetForm();
		} catch (error) {
			if (uploadedPaths.length > 0) {
				await supabase.storage.from("images").remove(uploadedPaths);
			}
			toast.add({
				title: "Comment Failed",
				description:
					error instanceof Error ? error.message : "Please try again.",
				type: "error",
			});
		} finally {
			setIsSubmitting(false);
		}
	}

	return (
		<>
			<Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
				<DialogContent className="max-w-xl">
					<DialogHeader>
						<DialogTitle>Gate Discussion</DialogTitle>
						<DialogDescription>
							Further comments from the client and the project team.
							{!canComment &&
								" New comments are only allowed on the latest gate."}
						</DialogDescription>
					</DialogHeader>

					<div className="max-h-[50vh] overflow-y-auto space-y-3 pr-1">
						{isLoading ? (
							<p className="py-8 text-center text-sm text-muted-foreground">
								Loading comments…
							</p>
						) : isError ? (
							<p className="py-8 text-center text-sm text-destructive">
								Failed to load the discussion.
							</p>
						) : rows.length === 0 ? (
							<p className="py-8 text-center text-sm text-muted-foreground">
								No further comments yet.
							</p>
						) : (
							rows.map((row) => (
								<div
									key={row.commentId}
									className="rounded-md border border-border bg-neutral-surface p-3"
								>
									<div className="flex items-center gap-2.5">
										<span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-600 text-[10px] font-semibold text-brand-50">
											{getInitials(row.profileName)}
										</span>
										<span className="text-xs font-semibold text-foreground">
											{row.profileName}
										</span>
										<span className="text-[11px] text-muted-foreground">
											{row.date}
										</span>
									</div>
									<p className="mt-2 text-xs leading-relaxed text-foreground/90">
										{row.description}
									</p>
									{row.images.length > 0 && (
										<div className="mt-2 flex flex-wrap gap-2">
											{row.images.map((img) => (
												<button
													key={img.image_src}
													type="button"
													onClick={() => setLightboxSrc(img.image_src)}
													className="overflow-hidden rounded-md border border-border"
												>
													{/* eslint-disable-next-line @next/next/no-img-element -- stored attachment; next/image migration tracked */}
													<img
														src={img.image_src}
														alt="Comment attachment"
														className="h-14 w-14 object-cover"
													/>
												</button>
											))}
										</div>
									)}
								</div>
							))
						)}
					</div>

					{canComment && gateId && (
						<form
							onSubmit={handleSubmit}
							className="space-y-3 border-t border-border pt-3"
						>
							<Textarea
								value={text}
								onChange={(e) => setText(e.target.value)}
								placeholder="Add a comment…"
								rows={3}
								className="resize-none text-xs"
							/>

							{previews.length > 0 && (
								<div className="flex flex-wrap gap-2">
									{previews.map((preview, idx) => (
										<div key={idx} className="relative inline-block">
											{/* eslint-disable-next-line @next/next/no-img-element -- object-URL preview */}
											<img
												src={preview}
												alt={`Attachment ${idx + 1}`}
												className="h-12 w-12 rounded-md border border-border object-cover"
											/>
											<button
												type="button"
												onClick={() => removePreview(idx)}
												aria-label="Remove image"
												className="absolute -top-1.5 -right-1.5 flex size-4 items-center justify-center rounded-full bg-slate-800 text-[10px] text-white hover:bg-red-600"
											>
												<X className="size-3" />
											</button>
										</div>
									))}
								</div>
							)}

							<div className="flex items-center justify-between">
								<button
									type="button"
									onClick={() => fileInputRef.current?.click()}
									className="inline-flex items-center gap-1.5 text-xs font-medium text-brand-600 hover:text-brand-700"
								>
									<Paperclip className="size-3.5" />
									Attach Images
								</button>
								<input
									ref={fileInputRef}
									type="file"
									accept="image/jpeg,image/png,image/webp"
									multiple
									onChange={handleImageChange}
									className="sr-only"
								/>
								<Button
									type="submit"
									size="sm"
									disabled={
										isSubmitting || (!text.trim() && files.length === 0)
									}
								>
									<Send className="size-3.5" />
									{isSubmitting ? "Posting…" : "Post Comment"}
								</Button>
							</div>
						</form>
					)}

					<DialogFooter showCloseButton={false}>
						<Button type="button" variant="ghost" onClick={onClose}>
							Close
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{lightboxSrc && (
				<ImageLightbox
					src={lightboxSrc}
					alt="Comment attachment"
					onClose={() => setLightboxSrc(null)}
				/>
			)}
		</>
	);
}
