"use client"

import type { ProjectWithStatus } from "@/entities/project"
import { Calendar, EllipsisVertical, Pencil, Users, Trash2 } from "lucide-react"

import {
	DropdownMenu,
	DropdownMenuTrigger,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"

interface ProjectCardProps {
	project: ProjectWithStatus
	onEdit: () => void
	onManageMembers: () => void
	onDelete: () => void
}

function formatDateTime(date: Date | null): string {
	if (!date) return "—"
	return date.toLocaleString("en-US", {
		month: "numeric",
		day: "numeric",
		year: "numeric",
		hour: "numeric",
		minute: "numeric"
	})
}



export function ProjectCard({
	project,
	onEdit,
	onManageMembers,
	onDelete,
}: ProjectCardProps) {

	const statusLabel =
		project.project_status === "ACTIVE"
			? "ACTIVE" : 
		project.project_status === "PENDING"
			? "PENDING": "COMPLETED"

	const statusClass =
		project.project_status === "ACTIVE"
			? "bg-brand-500 text-[#DAD7FF]" : 
		project.project_status === "PENDING"
			? "bg-[#FFDAD7] text-[#6d0007]" :
			"bg-[#BAE9D4] text-[#00714D]"

	return (
		<div className="bg-neutral-surface cursor-pointer rounded-xl border border-[#C7C4D8] p-5 hover:shadow-md transition-shadow flex flex-col h-full select-none">
			{/* Project Head: Name left, Status badge top-right */}
			<div className="flex items-start justify-between gap-2 mb-3">
				<h3 className="text-m font-semibold text-[#0F172A] max-w-[80%] break-all line-clamp-2">
					{project.name}
				</h3>
				<span
					className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${statusClass}`}
				>
					{statusLabel}
				</span>
			</div>


			{/* Description — always shown, clamped to 2 lines */}
			<div className="mb-3 h-[2.8rem]">
				<p
					className={`text-xs break-words ${project.description ? "text-[#475569]" : "text-[#94A3B8]"}`}
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

			{/* Client Name — always shown */}
			<div className="mb-2 mt-auto">
				<p className="text-xs text-brand-500">
					{project.client_name ?? "—"}
				</p>
			</div>
			{/* Divider */}
			<div className="border-t border-brand-200 mb-5" />

			{/* Bottom Row: Timeline + Menu */}
			<div className="flex h-[.4rem] items-center justify-between">
				<div className="font-weight-100 flex items-center gap-1.5 text-xs text-[#334155] min-w-0">
						<>
							<Calendar size={12}/>
							<span className="truncate">
								{ project.start_date ? formatDateTime(project.start_date) :'N/A' }
							</span>
							
							<span className="font-weight-100 text-[#94A3B8] flex-shrink-0">—</span>
							
							<Calendar size={12}/>
							
							<span className="truncate">
							{ project.project_status === "PENDING" || project.project_status === "ACTIVE" ? (
									project.deadline_date ? formatDateTime(project.deadline_date):'N/A'
							) : (
									project.finish_date ? formatDateTime(project.deadline_date ?? project.finish_date):'N/A'
							)}
							</span>
						</>
				</div>

				{/* Menu Ellipsis — bottom right */}
				<div className="flex-shrink-0 ml-2">
					<DropdownMenu>
						<DropdownMenuTrigger className="p-1.5 rounded-lg text-[#94A3B8] hover:text-[#475569] hover:bg-[#F1F5F9] transition-colors data-[popup-open]:bg-[#F1F5F9]">
							<EllipsisVertical size={16}/>
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
							<DropdownMenuItem onClick={onDelete} className="text-destructive focus:text-destructive">
								<Trash2 size={16} />
								Delete Project
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				</div>
			</div>
		</div>
	)
}
