"use client";

import Link from "next/link";
import type { ProjectWithStatus } from "@/entities/project";
import { format } from "date-fns";
import {
	Calendar,
	EllipsisVertical,
	Pencil,
	Users,
	Trash2,
} from "lucide-react";

import {
	DropdownMenu,
	DropdownMenuTrigger,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

interface ProjectCardProps {
	project: ProjectWithStatus;
	href?: string;
	/** Renders the edit/members/delete ellipsis menu — Project Owners only. */
	isOwner?: boolean;
	onEdit: () => void;
	onManageMembers: () => void;
	onDelete: () => void;
}

function formatProjectDate(date: Date | null | undefined): string {
	if (!date) return "N/A";
	const d = new Date(date);
	if (isNaN(d.getTime())) return "N/A";
	return format(d, "MMM d, yyyy");
}

export function ProjectCard({
	project,
	href,
	isOwner = false,
	onEdit,
	onManageMembers,
	onDelete,
}: ProjectCardProps) {
	const statusLabel =
		project.project_status === "ACTIVE"
			? "ACTIVE"
			: project.project_status === "PENDING"
				? "PENDING"
				: "COMPLETED";

	const statusClass =
		project.project_status === "ACTIVE"
			? "bg-brand-50 text-brand-500"
			: project.project_status === "PENDING"
				? "bg-red-100 text-red-700"
				: "bg-emerald-100 text-emerald-900"

	const targetHref = href ?? `/projects/${project.project_id}`;

	const endDate =
		project.project_status === "PENDING" || project.project_status === "ACTIVE"
			? project.planEnd
				? new Date(project.planEnd)
				: undefined
			: project.actualEnd
				? new Date(project.planEnd ?? project.actualEnd)
				: undefined;

	return (
		<div className="relative hover:-translate-y-0.5 hover:border-brand-300 transition-all duration-150 @container bg-neutral-surface-subtle rounded-md border border-[#C7C4D8] gap-4 p-5 flex flex-col justify-between h-full select-none">
			<Link
				href={targetHref}
				className="absolute inset-0 rounded-md"
				aria-label={`Open project ${project.name}`}
			/>

			{/* Client Name — always shown */}
			<div
				aria-hidden
				className="relative flex justify-between items-center w-full"
			>
				<p className="text-xs text-brand-500 truncate pointer-events-none">
					{project.client_name ?? "—"}
				</p>
				<span
					className={`pointer-events-none inline-flex items-center gap-1 text-[10px] px-2 py-0.5 shrink-0 ${statusClass}`}
				>
					{statusLabel}
				</span>
			</div>

			<div aria-hidden className="relative pointer-events-none">
				<h3 className="w-3/4 text-m text-slate-900 max-w-[80%] break-all line-clamp-2">
					{project.name}
				</h3>
				{/* Description — always shown, clamped to 3 lines */}
				<p
					className={`w-3/4 text-xs wrap-break-word ${project.description ? "text-slate-600" : "text-slate-400"}`}
					style={{
						display: "-webkit-box",
						WebkitLineClamp: 3,
						WebkitBoxOrient: "vertical",
						overflow: "hidden",
					}}
				>
					{project.description}
				</p>
			</div>

			{/* Bottom Row: Responsive Timeline */}
			<div
				aria-hidden
				className="relative flex items-end justify-between gap-2 pt-3 border-t border-brand-100 pointer-events-none"
			>
				<div className="flex flex-col @[300px]:flex-row @[300px]:items-center gap-1 text-xs text-slate-600 min-w-0">
					{/* Date 1 + dash */}
					<div className="flex items-center gap-1.5 min-w-0">
						<Calendar size={13} className="text-slate-400 shrink-0" />
						<span className="truncate">
							{formatProjectDate(project.planStart)}
						</span>
						<span className="text-slate-300 shrink-0 mx-0.5">—</span>
					</div>

					{/* Date 2 */}
					<div className="flex items-center gap-1.5 min-w-0">
						<Calendar size={13} className="text-slate-400 shrink-0" />
						<span className="truncate">{formatProjectDate(endDate)}</span>
					</div>
				</div>
			</div>

			{/* Menu Ellipsis — Project Owners only. Sibling of the Link (not
			 * nested inside it): interactive elements must not nest (a11y). */}
			{isOwner && (
				<div className="absolute bottom-3 right-3 z-10">
					<DropdownMenu>
						<DropdownMenuTrigger className="p-1.5 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors data-popup-open:bg-slate-100">
							<EllipsisVertical size={16} />
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end" className="w-56">
							<DropdownMenuItem onClick={onEdit}>
								<Pencil size={16} />
								Edit project details
							</DropdownMenuItem>
							<DropdownMenuItem onClick={onManageMembers}>
								<Users size={16} />
								Manage project members
							</DropdownMenuItem>
							<DropdownMenuSeparator />
							<DropdownMenuItem
								onClick={onDelete}
								className="text-destructive focus:text-destructive"
							>
								<Trash2 size={16} />
								Delete Project
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				</div>
			)}
		</div>
	);
}
