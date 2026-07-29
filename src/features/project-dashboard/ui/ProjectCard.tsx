"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import type { ProjectWithStatus } from "@/entities/project"
import { Calendar, EllipsisVertical } from "lucide-react"

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
	const [menuOpen, setMenuOpen] = useState(false)
	const [menuPos, setMenuPos] = useState<{ 
		top: number 
		right: number 
	} | null>(null)
	const menuBtnRef = useRef<HTMLButtonElement>(null)
	const menuRef = useRef<HTMLDivElement>(null)

	useEffect(() => {
		if (!menuOpen) return
		const handleClick = (e: MouseEvent) => {
			if (
				menuRef.current &&
				!menuRef.current.contains(e.target as Node) &&
				menuBtnRef.current &&
				!menuBtnRef.current.contains(e.target as Node)
			) {
				setMenuOpen(false)
			}
		}
		document.addEventListener("mousedown", handleClick)
		return () => document.removeEventListener("mousedown", handleClick)
	}, [menuOpen])

	useEffect(() => {
		if (!menuOpen) return

		const handleDismiss = () => {
			setMenuOpen(false)
		}

		window.addEventListener('scroll', handleDismiss, true)
		window.addEventListener('resize', handleDismiss)

		return () => {
			window.removeEventListener('scroll', handleDismiss, true)
			window.removeEventListener('resize', handleDismiss)
		}
	}, [menuOpen])

	const handleMenuClick = useCallback(() => {
		if (menuBtnRef.current) {
			const rect = menuBtnRef.current.getBoundingClientRect()
			const dropdownHeight = 200 // approximate dropdown height in px
			const spaceBelow = window.innerHeight - rect.bottom
			const top = spaceBelow >= dropdownHeight
				? rect.bottom + 4
				: rect.top - dropdownHeight + 50
			setMenuPos({ top, right: window.innerWidth - rect.right })
		}
		setMenuOpen((prev) => !prev)
	}, [])

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
				<div className="relative flex-shrink-0 ml-2">
					<button
						ref={menuBtnRef}
						onClick={handleMenuClick}
						className="cursor-pointer p-1.5 rounded-lg hover:bg-[#F1F5F9] transition-colors text-[#94A3B8] hover:text-[#475569]"
					>
						<EllipsisVertical size={16}/>
					</button>

					{menuOpen && menuPos && (
						<div
							ref={menuRef}
							className="fixed w-56 bg-neutral-surface rounded-xl shadow-lg border border-[#E2E8F0] py-1 z-[100]"
							style={{ top: menuPos.top, right: menuPos.right }}
						>
							<button
								onClick={() => { 
									setMenuOpen(false) 
									onEdit() }}
								className="cursor-pointer  w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[#0F172A] hover:bg-[#F8FAFC] transition-colors"
							>
								<svg width="16" height="16" viewBox="0 0 16 16" fill="none">
									<path d="M11.5 1.5L14.5 4.5L5.5 13.5L2 14L2.5 10.5L11.5 1.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
								</svg>
								Edit project details
							</button>
							<button
								onClick={() => { 
									setMenuOpen(false) 
									onManageMembers() }}
								className="cursor-pointer  w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[#0F172A] hover:bg-[#F8FAFC] transition-colors"
							>
								<svg width="16" height="16" viewBox="0 0 16 16" fill="none">
									<path d="M8 10C9.933 10 11.5 8.433 11.5 6.5C11.5 4.567 9.933 3 8 3C6.067 3 4.5 4.567 4.5 6.5C4.5 8.433 6.067 10 8 10Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
									<path d="M2 14C3.5 11.5 5.5 10.5 8 10.5C10.5 10.5 12.5 11.5 14 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
								</svg>
								Manage project members
							</button>
							<div className="border-t border-[#F1F5F9] my-1" />
							<button
								onClick={() => { 
									setMenuOpen(false) 
									onDelete() }}
								className="cursor-pointer  w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[#EF4444] hover:bg-[#FEF2F2] transition-colors"
							>
								<svg width="16" height="16" viewBox="0 0 16 16" fill="none">
									<path d="M2 4H14M5 4V2.5C5 2.22386 5.22386 2 5.5 2H10.5C10.7761 2 11 2.22386 11 2.5V4M6.5 7V11.5M9.5 7V11.5M3.5 4L4.5 13.5C4.5 13.7761 4.72386 14 5 14H11C11.2761 14 11.5 13.7761 11.5 13.5L12.5 4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
								</svg>
								Delete Project
							</button>
						</div>
					)}
				</div>
			</div>
		</div>
	)
}
