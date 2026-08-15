"use client";

import React from "react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Link as LinkIcon, Calendar, Monitor } from "lucide-react";
import { bugTypeLabel } from "../lib/constants";
import type { IssueItem } from "../types";

export interface IssueDetailsModalProps {
	issue: IssueItem | null;
	open: boolean;
	onClose: () => void;
}

export const IssueDetailsModal: React.FC<IssueDetailsModalProps> = ({
	issue,
	open,
	onClose,
}) => {
	if (!issue) return null;

	return (
		<Dialog open={open} onOpenChange={(val) => !val && onClose()}>
			<DialogContent className="max-w-2xl bg-card border-border rounded-md shadow-2xl">
				<DialogHeader>
					<div className="flex items-center gap-3">
						<DialogTitle className="text-foreground font-bold">
							Issue Details
						</DialogTitle>
						{issue.ticketName && (
							<Badge
								variant="secondary"
								className="bg-brand-500 text-primary-foreground gap-1.5 px-2.5 py-1 text-xs"
							>
								<LinkIcon className="w-3 h-3" />
								{issue.ticketName}
							</Badge>
						)}
					</div>
				</DialogHeader>

				<div className="space-y-4 max-h-[40rem] overflow-y-auto pr-1">
					<div className="grid grid-cols-3 gap-4">
						<div>
							<span className="text-xs font-semibold text-muted-foreground block">
								Name
							</span>
							<p className="text-sm font-semibold text-foreground mt-1">
								{issue.name}
							</p>
						</div>
						<div>
							<span className="text-xs font-semibold text-muted-foreground block">
								Type
							</span>
							<p className="text-sm font-semibold text-foreground mt-1 capitalize">
								{bugTypeLabel(issue.type)}
							</p>
						</div>
						<div>
							<span className="text-xs font-semibold text-muted-foreground block">
								Urgency
							</span>
							<div className="flex items-center gap-2 mt-1">
								<span
									className={`h-2.5 w-2.5 rounded-full ${
										issue.urgency === "high"
											? "bg-red-600"
											: issue.urgency === "medium"
												? "bg-yellow-500"
												: "bg-green-600"
									}`}
								/>
								<span className="text-sm font-semibold capitalize text-foreground">
									{issue.urgency}
								</span>
							</div>
						</div>
					</div>

					<Separator className="bg-border" />

					<div className="grid grid-cols-2 gap-4">
						<div>
							<span className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
								<Calendar className="w-3.5 h-3.5" /> Time Encountered
							</span>
							<p className="text-sm text-foreground mt-1">
								{issue.timeOfError}
							</p>
						</div>
						<div>
							<span className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
								<Monitor className="w-3.5 h-3.5" /> System Environment
							</span>
							<p className="text-sm text-foreground mt-1">
								{issue.systemEnv || "Not specified"}
							</p>
						</div>
					</div>

					<Separator className="bg-border" />

					<div className="space-y-1.5">
						<span className="text-xs font-semibold text-muted-foreground block">
							Description
						</span>
						<p className="text-sm leading-relaxed bg-brand-10 p-3 rounded-md border border-border text-foreground">
							{issue.description || "No description provided."}
						</p>
					</div>

					{issue.steps && issue.steps.length > 0 && (
						<>
							<Separator className="bg-border" />
							<div className="space-y-3">
								<span className="text-xs font-semibold text-muted-foreground block">
									Steps to Reproduce
								</span>
								<div className="space-y-2.5">
									{issue.steps.map((step, idx) => (
										<div
											key={step.id || idx}
											className="flex items-center gap-3 bg-brand-10/80 p-3 rounded-md border border-border"
										>
											<div className="w-6 h-6 rounded-full bg-brand-500 text-primary-foreground text-xs font-semibold flex items-center justify-center shrink-0">
												{idx + 1}
											</div>
											<div className="flex-1 text-xs mt-0.5 text-foreground">
												{step.description}
												{step.image && (
													// eslint-disable-next-line @next/next/no-img-element -- entity-level display of user-uploaded attachment; next/image migration tracked
													<img
														src={step.image}
														alt="Attachment"
														className="mt-2 h-16 w-16 object-cover rounded border border-border"
													/>
												)}
											</div>
										</div>
									))}
								</div>
							</div>
						</>
					)}
				</div>
			</DialogContent>
		</Dialog>
	);
};
