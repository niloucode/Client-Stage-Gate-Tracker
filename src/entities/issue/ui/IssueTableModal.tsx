"use client";

import React, { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useProjectIssues } from "../queries";
import { IssueBox } from "./IssueBox";
import { IssueDetailsModal } from "./IssueDetailsModal";
import type { IssueItem } from "../types";

export interface IssueTableModalProps {
	/** Controls if the popup modal is visible. */
	open: boolean;
	/** Callback fired when closing the modal. */
	onOpenChange: (open: boolean) => void;
	/** Project whose issues are listed (issue-reporting spec: project-scoped). */
	projectId?: string;
/**
 * Callback fired when an issue is linked by clicking its "Link" button.
 * @returns The result.
 */
	onSelectIssue?: (issue: IssueItem) => void;
}

/**
 * Real issue picker for the ticket editor (1-to-1 spec): lists only
 * UNLINKED issues of the project, so every pick is a valid link target.
 * @returns The result.
 */
export const IssueTableModal: React.FC<IssueTableModalProps> = ({
	open,
	onOpenChange,
	projectId,
	onSelectIssue,
}) => {
	const { data: issues = [], isLoading } = useProjectIssues(projectId);
	const [selectedIssue, setSelectedIssue] = useState<IssueItem | null>(null);

	// 1-to-1: linked/resolved issues are already claimed — only unlinked show.
	const unlinkedIssues = issues.filter((i) => i.status === "unlinked");

	const handleLinkIssue = (issue: IssueItem) => {
		onSelectIssue?.(issue);
		onOpenChange(false);
	};

	return (
		<>
			<Dialog open={open} onOpenChange={onOpenChange}>
				<DialogContent className="max-w-5xl p-0 gap-0 border-none bg-card rounded-md overflow-hidden shadow-2xl">
					{isLoading ? (
						<div className="p-10 text-center text-muted-foreground text-sm">
							Loading issues…
						</div>
					) : (
						<IssueBox
							title="Project Issues"
							issues={unlinkedIssues}
							itemsPerPage={5}
							onLinkIssue={handleLinkIssue}
							onIssueClick={(issue) => setSelectedIssue(issue)}
							className="border-none shadow-none rounded-none bg-transparent"
						/>
					)}
				</DialogContent>
			</Dialog>

			<IssueDetailsModal
				issue={selectedIssue}
				open={Boolean(selectedIssue)}
				onClose={() => setSelectedIssue(null)}
			/>
		</>
	);
};
