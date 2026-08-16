"use client";

import { useState } from "react";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { MessageSquare } from "lucide-react";
import ImageLightbox from "@/shared/ui/image-lightbox";
import type { GateFeedbackEntry } from "@/entities/gate";

export interface GateFeedbackModalProps {
	isOpen: boolean;
	onClose: () => void;
	entries: GateFeedbackEntry[];
	/** Opens the discussion modal for a gate (spec 7). */
	onCommentClick?: (entry: GateFeedbackEntry) => void;
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

function GateFeedbackCard({
	entry,
	onCommentClick,
}: {
	entry: GateFeedbackEntry;
	onCommentClick?: (entry: GateFeedbackEntry) => void;
}) {
	const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);
	const headerBg =
		entry.variant === "approved"
			? "bg-emerald-50"
			: entry.variant === "rejected"
				? "bg-red-50"
				: "bg-amber-50";
	const bodyBg =
		entry.variant === "approved"
			? "bg-emerald-50/40"
			: entry.variant === "rejected"
				? "bg-red-50/40"
				: "bg-amber-50/30";

	return (
		<div className="overflow-hidden shadow-2xs">
			{/* Row Header */}
			<div
				className={`grid grid-cols-[40px_130px_1fr] items-center px-4 py-3 text-sm text-foreground ${headerBg}`}
			>
				<h4>#{entry.number}</h4>
				<h4>{entry.date ?? "—"}</h4>
				<div className="flex items-center gap-2.5 min-w-0">
					{entry.reviewer ? (
						<>
							<Avatar className="h-7 w-7">
								<AvatarFallback className="bg-brand-600 text-[10px] font-semibold text-brand-50">
									{getInitials(entry.reviewer.name)}
								</AvatarFallback>
							</Avatar>
							<h4 className="truncate">{entry.reviewer.name}</h4>
						</>
					) : (
						<Badge
							variant="secondary"
							className="bg-amber-100 text-amber-800 text-[10px] font-semibold"
						>
							Pending Review
						</Badge>
					)}
				</div>
			</div>

			{/* Feedback Body */}
			<div className={`space-y-2 p-4 border-t border-brand-100/30 ${bodyBg}`}>
				{entry.feedback ? (
					<>
						<p className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
							GATE FEEDBACK
						</p>
						<p className="text-xs italic leading-relaxed text-foreground/90">
							&ldquo;{entry.feedback}&rdquo;
						</p>
					</>
				) : (
					<p className="text-xs italic text-muted-foreground">
						Awaiting the client&rsquo;s decision.
					</p>
				)}

				{entry.images.length > 0 && (
					<div className="flex flex-wrap gap-2 pt-1">
						{entry.images.map((src) => (
							<button
								key={src}
								type="button"
								onClick={() => setLightboxSrc(src)}
								className="overflow-hidden rounded-md border border-border"
								title="View attachment"
							>
								{/* eslint-disable-next-line @next/next/no-img-element -- stored attachment; next/image migration tracked */}
								<img
									src={src}
									alt="Gate feedback attachment"
									className="h-16 w-16 object-cover"
								/>
							</button>
						))}
					</div>
				)}

				{onCommentClick && (
					<div className="flex items-center justify-between pt-1">
						<span className="text-[11px] text-muted-foreground">
							{entry.commentCount > 0
								? `${entry.commentCount} further comment${entry.commentCount === 1 ? "" : "s"}`
								: "No further comments"}
						</span>
						<Button
							type="button"
							variant="outline"
							size="sm"
							onClick={() => onCommentClick(entry)}
							className="h-7 gap-1.5 text-xs"
						>
							<MessageSquare className="size-3.5" />
							Comment
						</Button>
					</div>
				)}
			</div>

			{lightboxSrc && (
				<ImageLightbox
					src={lightboxSrc}
					alt="Gate feedback attachment"
					onClose={() => setLightboxSrc(null)}
				/>
			)}
		</div>
	);
}

export function GateFeedbackModal({
	isOpen,
	onClose,
	entries,
	onCommentClick,
}: GateFeedbackModalProps) {
	return (
		<Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
			<DialogContent className="max-w-2xl">
				<DialogHeader>
					<DialogTitle>Gate Feedback</DialogTitle>
					<DialogDescription>
						Review client comments and feedback entries for this stage&rsquo;s
						gates. Newest gates first.
					</DialogDescription>
				</DialogHeader>

				<div className="-m-5 -mb-11">
					{/* Table Column Headers */}
					<div className="grid grid-cols-[40px_130px_1fr] px-4 py-2.5 text-[11px] font-bold tracking-wider text-muted-foreground uppercase bg-neutral-subtle">
						<span>#</span>
						<span>DATE</span>
						<span>REVIEWER</span>
					</div>

					{/* Feedback Entries List */}
					<div className="max-h-[60vh] overflow-y-auto">
						{entries.length === 0 ? (
							<p className="py-10 text-center text-sm text-muted-foreground">
								No gates yet.
							</p>
						) : (
							entries.map((entry) => (
								<GateFeedbackCard
									key={entry.gateId}
									entry={entry}
									onCommentClick={onCommentClick}
								/>
							))
						)}
					</div>
				</div>

				<DialogFooter className="mt-6" showCloseButton={false}>
					<Button type="button" variant="ghost" onClick={onClose}>
						Cancel
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
