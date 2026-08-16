"use client";

import type { ReactNode } from "react";
import { ArrowUpDown, ChevronUp, ChevronDown } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { departmentBadgeStyle } from "@/shared/lib/colors";
import { getInitials } from "@/shared/lib/strings";
import type { TeamMember, TeamSortField, SortDirection } from "../model/types";

interface TeamTableHeaderProps {
	onSort: (field: TeamSortField) => void;
	getSortIcon: (field: TeamSortField) => ReactNode;
}

function TeamTableHeader({ onSort, getSortIcon }: TeamTableHeaderProps) {
	const columns: { key: TeamSortField; label: string; width: string }[] = [
		{ key: "name", label: "NAME", width: "w-[26%]" },
		{ key: "email", label: "EMAIL", width: "w-[24%]" },
		{ key: "phone", label: "CONTACT", width: "w-[18%]" },
		{ key: "jobTitle", label: "JOB TITLE", width: "w-[18%]" },
		{ key: "department", label: "DEPARTMENT", width: "w-[14%]" },
	];

	return (
		<thead className="sticky top-0 z-10 border-b border-brand-100/50 bg-neutral-subtle text-[11px] font-normal uppercase text-muted-foreground">
			<tr>
				{columns.map((col) => (
					<th key={col.key} className={`${col.width} px-6 py-3`}>
						<button
							type="button"
							onClick={() => onSort(col.key)}
							className="flex items-center gap-1 text-[11px] font-normal uppercase text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
						>
							<span>{col.label}</span>
							{getSortIcon(col.key)}
						</button>
					</th>
				))}
			</tr>
		</thead>
	);
}

function TeamRow({ member }: { member: TeamMember }) {
	return (
		<tr className="transition-colors hover:bg-muted/50">
			<td className="px-6 py-3.5 align-middle text-[13px] font-normal text-foreground">
				<div className="flex items-center gap-3 min-w-0">
					<Avatar className="h-8 w-8 shrink-0">
						<AvatarFallback className="bg-brand-600 text-xs font-semibold text-white">
							{getInitials(member.fullName)}
						</AvatarFallback>
					</Avatar>
					<span className="truncate font-medium">{member.fullName}</span>
				</div>
			</td>
			<td className="px-6 py-3.5 align-middle text-[13px] font-normal text-muted-foreground break-all">
				{member.email}
			</td>
			<td className="px-6 py-3.5 align-middle text-[13px] font-normal text-muted-foreground break-all">
				{member.phone || "—"}
			</td>
			<td className="px-6 py-3.5 align-middle text-[13px] font-normal text-muted-foreground truncate">
				{member.jobTitle || "—"}
			</td>
			<td className="px-6 py-3.5 align-middle text-[13px]">
				{member.department ? (
					<span
						className={`inline-block px-2.5 py-0.5 rounded-md text-xs font-medium ${departmentBadgeStyle(
							member.department,
						)}`}
					>
						{member.department}
					</span>
				) : (
					<span className="text-muted-foreground">—</span>
				)}
			</td>
		</tr>
	);
}

export interface TeamTableProps {
	members: TeamMember[];
	sortField: TeamSortField;
	sortDirection: SortDirection;
	onSort: (field: TeamSortField) => void;
}

/** Sortable team-member table with role/department columns. */
export function TeamTable({
	members,
	sortField,
	sortDirection,
	onSort,
}: TeamTableProps) {
	const getSortIcon = (field: TeamSortField) => {
		if (sortField !== field) {
			return (
				<ArrowUpDown className="h-3 w-3 shrink-0 opacity-40 hover:opacity-100" />
			);
		}
		return sortDirection === "asc" ? (
			<ChevronUp className="h-3 w-3 shrink-0 text-brand-600" />
		) : (
			<ChevronDown className="h-3 w-3 shrink-0 text-brand-600" />
		);
	};

	return (
		<div className="flex flex-col overflow-hidden rounded-md border border-brand-100 bg-neutral-surface">
			<div className="max-h-[calc(65vh)] overflow-auto">
				<table className="w-full min-w-240 border-collapse text-left">
					<TeamTableHeader onSort={onSort} getSortIcon={getSortIcon} />
					<tbody className="divide-y divide-brand-100/50 bg-neutral-surface">
						{members.length === 0 ? (
							<tr>
								<td
									colSpan={5}
									className="py-12 text-center text-sm text-muted-foreground"
								>
									No team members found.
								</td>
							</tr>
						) : (
							members.map((member) => (
								<TeamRow key={member.id} member={member} />
							))
						)}
					</tbody>
				</table>
			</div>
		</div>
	);
}
