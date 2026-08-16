"use client";

import React, { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertCircle } from "lucide-react";
import {
	ChevronRight,
	ChevronLeft,
	ArrowUpDown,
	ArrowDown,
	ArrowUp,
	Filter,
} from "lucide-react";
import { URGENCY_WEIGHT } from "../lib/constants";
import { IssueCard } from "./IssueCard";
import type { IssueItem, UrgencyLevel } from "../types";

export type UrgencyFilterOption = UrgencyLevel | "all";

export type SortOrder = "desc" | "asc" | "none";

export interface IssueBoxProps {
	title?: string;
	issues: IssueItem[];
	totalSystemCount?: number;
	itemsPerPage?: number;
	defaultSortOrder?: SortOrder;
	defaultUrgencyFilter?: UrgencyFilterOption;
	onIssueClick?: (issue: IssueItem) => void;
	onLinkIssue?: (issue: IssueItem) => void;
	className?: string;
}

export const IssueBox: React.FC<IssueBoxProps> = ({
	title = "Unlinked Issues",
	issues,
	totalSystemCount,
	itemsPerPage = 5,
	defaultSortOrder = "desc",
	defaultUrgencyFilter = "all",
	onIssueClick,
	onLinkIssue,
	className = "",
}) => {
	const [currentPage, setCurrentPage] = useState<number>(1);
	const [sortByUrgency, setSortByUrgency] =
		useState<SortOrder>(defaultSortOrder);
	const [urgencyFilter, setUrgencyFilter] =
		useState<UrgencyFilterOption>(defaultUrgencyFilter);

	const filteredByUrgency = useMemo(() => {
		if (urgencyFilter === "all") return issues;
		return issues.filter((iss) => iss.urgency === urgencyFilter);
	}, [issues, urgencyFilter]);

	const sortedIssues = useMemo(() => {
		if (sortByUrgency === "none") return filteredByUrgency;

		return [...filteredByUrgency].sort((a, b) => {
			const weightA = URGENCY_WEIGHT[a.urgency];
			const weightB = URGENCY_WEIGHT[b.urgency];

			return sortByUrgency === "desc" ? weightB - weightA : weightA - weightB;
		});
	}, [filteredByUrgency, sortByUrgency]);

	const totalPages = Math.ceil(sortedIssues.length / itemsPerPage) || 1;
	const validPage = Math.min(currentPage, totalPages);
	const startIndex = (validPage - 1) * itemsPerPage;
	const paginatedIssues = sortedIssues.slice(
		startIndex,
		startIndex + itemsPerPage,
	);

	const totalCountDenominator = totalSystemCount ?? issues.length;

	const toggleSortOrder = () => {
		setCurrentPage(1);
		setSortByUrgency((prev) => {
			if (prev === "desc") return "asc";
			if (prev === "asc") return "none";
			return "desc";
		});
	};

	const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
		setUrgencyFilter(e.target.value as UrgencyFilterOption);
		setCurrentPage(1);
	};

	return (
		<Card
			className={`shadow-xs rounded-md border border-border overflow-hidden bg-card ${className}`}
		>
			<div className="px-5 py-2.5 pr-12 border-b border-border flex items-center justify-between flex-wrap gap-2.5">
				<div className="flex items-center gap-2.5 flex-wrap">
					<h3 className="text-base font-bold capitalize text-foreground">
						{title}
					</h3>
					<Badge
						variant="secondary"
						className="bg-brand-50 text-brand-500 dark:bg-brand-900 dark:text-brand-100 font-semibold rounded-full px-2.5 py-0.5 text-xs border-none"
					>
						{filteredByUrgency.length} / {totalCountDenominator}
					</Badge>

					<div className="flex items-center gap-1.5 border border-border bg-card rounded-md px-2.5 h-8 text-xs font-medium text-foreground hover:bg-neutral-subtle transition-colors">
						<Filter className="w-3.5 h-3.5 text-muted-foreground" />
						<select
							value={urgencyFilter}
							onChange={handleFilterChange}
							className="bg-transparent text-xs font-medium text-foreground focus:outline-none cursor-pointer pr-1"
						>
							<option value="all" className="bg-card text-foreground">
								All Urgencies
							</option>
							<option value="high" className="bg-card text-foreground">
								High Urgency
							</option>
							<option value="medium" className="bg-card text-foreground">
								Medium Urgency
							</option>
							<option value="low" className="bg-card text-foreground">
								Low Urgency
							</option>
						</select>
					</div>

					<Button
						variant="outline"
						size="sm"
						onClick={toggleSortOrder}
						className="text-xs h-8 gap-1.5 font-medium rounded-md border-border bg-card hover:bg-neutral-subtle text-foreground"
					>
						{sortByUrgency === "desc" && (
							<ArrowDown className="w-3.5 h-3.5 text-red-600" />
						)}
						{sortByUrgency === "asc" && (
							<ArrowUp className="w-3.5 h-3.5 text-green-600" />
						)}
						{sortByUrgency === "none" && (
							<ArrowUpDown className="w-3.5 h-3.5 text-muted-foreground" />
						)}
						<span>
							Urgency:{" "}
							{sortByUrgency === "desc"
								? "High → Low"
								: sortByUrgency === "asc"
									? "Low → High"
									: "Default"}
						</span>
					</Button>
				</div>
			</div>

			<CardContent className="space-y-2.5 p-4">
				{paginatedIssues.length === 0 ? (
					<div className="py-10 text-center text-muted-foreground flex flex-col items-center justify-center space-y-2">
						<AlertCircle className="w-8 h-8 text-muted-foreground/40" />
						<p className="text-sm">
							No issues match the selected urgency criteria.
						</p>
					</div>
				) : (
					paginatedIssues.map((issue) => (
						<IssueCard
							key={issue.id}
							issue={issue}
							onClick={() => onIssueClick && onIssueClick(issue)}
							onLinkClick={onLinkIssue}
						/>
					))
				)}
			</CardContent>

			<div className="px-5 py-3 border-t border-border flex items-center justify-center gap-2 text-xs text-muted-foreground font-medium">
				<Button
					variant="ghost"
					size="icon"
					onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
					disabled={validPage <= 1}
					aria-label="Previous page"
					className="h-7 w-7 text-muted-foreground hover:text-foreground disabled:opacity-30"
				>
					<ChevronLeft className="w-4 h-4" />
				</Button>
				<span>
					Page {validPage} of {totalPages}
				</span>
				<Button
					variant="ghost"
					size="icon"
					onClick={() =>
						setCurrentPage((prev) => Math.min(prev + 1, totalPages))
					}
					disabled={validPage >= totalPages}
					aria-label="Next page"
					className="h-7 w-7 text-muted-foreground hover:text-foreground disabled:opacity-30"
				>
					<ChevronRight className="w-4 h-4" />
				</Button>
			</div>
		</Card>
	);
};
