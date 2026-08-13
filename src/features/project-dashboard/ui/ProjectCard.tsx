"use client";

import Link from "next/link";
import type { ProjectWithStatus } from "@/entities/project";
import { format } from "date-fns";
import { Calendar, EllipsisVertical, Pencil, Users, Trash2 } from "lucide-react";

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
			? "bg-brand-500 text-[#DAD7FF]"
			: project.project_status === "PENDING"
				? "bg-[#FFDAD7] text-[#6d0007]"
				: "bg-[#BAE9D4] text-[#00714D]";

	const targetHref = href ?? `/projects/${project.project_id}`;

	const endDate =
		project.project_status === "PENDING" ||
		project.project_status === "ACTIVE"
			? project.deadline_date
				? new Date(project.deadline_date)
				: undefined
			: project.finish_date
				? new Date(project.deadline_date ?? project.finish_date)
				: undefined;

	return (
		<Link
			href={targetHref}
			className="@container bg-neutral-surface-subtle cursor-pointer rounded-md border border-[#C7C4D8] gap-4 p-5 hover:shadow-md transition-shadow flex flex-col justify-between h-full select-none"
		>
			{/* Client Name — always shown */}
			<div className="flex justify-between items-center w-full">
				<p className="text-xs text-brand-500 truncate">
					{project.client_name ?? "—"}
				</p>
				<span
					className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full shrink-0 ${statusClass}`}
				>
					{statusLabel}
				</span>
			</div>

			<div>
				<h3 className="w-3/4 text-m text-slate-900 max-w-[80%] break-all line-clamp-2">
					{project.name}
				</h3>
				{/* Description — always shown, clamped to 3 lines */}
				<p
					className={`w-3/4 text-xs break-words ${project.description ? "text-slate-600" : "text-slate-400"}`}
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

			{/* Bottom Row: Responsive Timeline + Menu */}
			<div className="flex items-end justify-between gap-2 pt-3 border-t border-brand-100">
				<div className="flex flex-col @[300px]:flex-row @[300px]:items-center gap-1 text-xs text-slate-600 min-w-0">
					{/* Date 1 + dash */}
					<div className="flex items-center gap-1.5 min-w-0">
						<Calendar size={13} className="text-slate-400 shrink-0" />
						<span className="truncate">
							{formatProjectDate(project.start_date)}
						</span>
						<span className="text-slate-300 shrink-0 mx-0.5">—</span>
					</div>

					{/* Date 2 */}
					<div className="flex items-center gap-1.5 min-w-0">
						<Calendar size={13} className="text-slate-400 shrink-0" />
						<span className="truncate">
							{formatProjectDate(endDate)}
						</span>
					</div>
				</div>

				{/* Menu Ellipsis — bottom right */}
				<div
					className="shrink-0 ml-2"
					onClick={(e) => {
						e.preventDefault();
						e.stopPropagation();
					}}
				>
					<DropdownMenu>
						<DropdownMenuTrigger className="p-1.5 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors data-[popup-open]:bg-slate-100">
							<EllipsisVertical size={16} />
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end" className="w-56">
							<DropdownMenuItem
								onClick={(e) => {
									e.stopPropagation();
									onEdit();
								}}
							>
								<Pencil size={16} />
								Edit project details
							</DropdownMenuItem>
							<DropdownMenuItem
								onClick={(e) => {
									e.stopPropagation();
									onManageMembers();
								}}
							>
								<Users size={16} />
								Manage project members
							</DropdownMenuItem>
							<DropdownMenuSeparator />
							<DropdownMenuItem
								onClick={(e) => {
									e.stopPropagation();
									onDelete();
								}}
								className="text-destructive focus:text-destructive"
							>
								<Trash2 size={16} />
								Delete Project
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				</div>
			</div>
		</Link>
	);
}