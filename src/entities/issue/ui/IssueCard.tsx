"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Link as LinkIcon } from "lucide-react";
import { bugTypeLabel } from "../lib/constants";
import type { IssueItem } from "../types";

export interface IssueCardProps {
	issue: IssueItem;
	onClick?: () => void;
	onLinkClick?: (issue: IssueItem) => void;
	className?: string;
}

export const IssueCard: React.FC<IssueCardProps> = ({
	issue,
	onClick,
	onLinkClick,
	className = "",
}) => {
	const urgencyDotColor =
		issue.urgency === "high"
			? "bg-red-600"
			: issue.urgency === "medium"
				? "bg-orange-500"
				: "bg-yellow-600";

	const formattedType = bugTypeLabel(issue.type);

	return (
		<div
			onClick={onClick}
			className={`flex items-center justify-between p-3.5 bg-card border border-border rounded-md hover:border-brand-200 hover:bg-brand-10/50 cursor-pointer transition-all group ${className}`}
		>
			<div className="flex items-center gap-3.5 min-w-0">
				{issue.status !== "resolved" && (
					<span
						className={`h-2.5 w-2.5 rounded-full shrink-0 ${urgencyDotColor}`}
					/>
				)}
				<div className="space-y-0.5 min-w-0">
					<h4 className="text-sm font-bold text-foreground truncate group-hover:text-brand-500 transition-colors">
						{issue.name}
					</h4>
					<p className="text-xs text-muted-foreground truncate">
						{formattedType} • Reported By {issue.clientName} on{" "}
						{issue.reportedAt}
					</p>
				</div>
			</div>

			<div className="flex items-center gap-2 shrink-0 ml-4">
				{onLinkClick && (
					<Button
						type="button"
						size="sm"
						variant="outline"
						onClick={(e) => {
							e.stopPropagation();
							onLinkClick(issue);
						}}
						className="h-8 gap-1.5 text-xs font-semibold text-brand-600 border-brand-200 hover:bg-brand-50 hover:text-brand-700 rounded-md"
					>
						<LinkIcon className="w-3.5 h-3.5" />
						<span>Link</span>
					</Button>
				)}
			</div>
		</div>
	);
};
