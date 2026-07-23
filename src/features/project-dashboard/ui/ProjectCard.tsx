"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import type { ProjectWithStatus } from "@/entities/project";

interface ProjectCardProps {
	project: ProjectWithStatus;
	onEdit: () => void;
	onManageMembers: () => void;
	onDelete: () => void;
}

function CalendarIcon() {
	return (
		<svg width="14" height="14" viewBox="0 0 14 14" fill="none">
			<rect x="1" y="2.5" width="12" height="10.5" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
			<path d="M1 5.5H13" stroke="currentColor" strokeWidth="1.2" />
			<path d="M4.5 1V3.5M9.5 1V3.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
		</svg>
	);
}


function formatDateTime(date: Date | null): string {
	if (!date) return "—";
	return date.toLocaleString("en-US", {
		month: "numeric",
		day: "numeric",
		year: "numeric"
	});
}

export function ProjectCard({
	project,
	onEdit,
	onManageMembers,
	onDelete,
}: ProjectCardProps) {
	const [menuOpen, setMenuOpen] = useState(false);
	const [menuPos, setMenuPos] = useState<{ top: number; right: number } | null>(null);
	const menuBtnRef = useRef<HTMLButtonElement>(null);
	const menuRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (!menuOpen) return;
		const handleClick = (e: MouseEvent) => {
			if (
				menuRef.current &&
				!menuRef.current.contains(e.target as Node) &&
				menuBtnRef.current &&
				!menuBtnRef.current.contains(e.target as Node)
			) {
				setMenuOpen(false);
			}
		};
		document.addEventListener("mousedown", handleClick);
		return () => document.removeEventListener("mousedown", handleClick);
	}, [menuOpen]);

	const handleMenuClick = useCallback(() => {
		if (menuBtnRef.current) {
			const rect = menuBtnRef.current.getBoundingClientRect();
			const dropdownHeight = 200; // approximate dropdown height in px
			const spaceBelow = window.innerHeight - rect.bottom;
			const top = spaceBelow >= dropdownHeight
				? rect.bottom + 4
				: rect.top - dropdownHeight + 50;
			setMenuPos({ top, right: window.innerWidth - rect.right });
		}
		setMenuOpen((prev) => !prev);
	}, []);

	const statusLabel =
		project.project_status === "PENDING"
			? "PENDING"
			: project.project_status === "ACTIVE"
				? "ACTIVE"
				: "COMPLETED";

	const statusClass =
		project.project_status === "PENDING"
			? "bg-[#FFDAD7] text-[#410004]"
			: project.project_status === "ACTIVE"
				? "bg-[#4F46E5] text-[#DAD7FF]"
				: "text-[#00714D] bg-[#BAE9D4]";

	return (
		<div className="bg-[#F8F9FF] rounded-xl border border-[#C7C4D8] p-5 hover:shadow-md transition-shadow flex flex-col h-full">
			{/* Project Head: Name left, Status badge top-right */}
			<div className="flex items-start justify-between gap-2 mb-3 min-h-[2.5rem]">
				<h3 className="text-sm font-semibold text-[#0F172A] break-words max-w-[65%] line-clamp-2">
					{project.name}
				</h3>
				<span
					className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${statusClass}`}
				>
					{statusLabel}
				</span>
			</div>

			{/* Client Name — always shown */}
			<div className="mb-2">
				<p className="text-[10px] font-semibold text-[#334155] uppercase tracking-wide mb-0.5">
					Client
				</p>
				<p className="text-xs text-[#334155]">
					{project.client_name ?? "—"}
				</p>
			</div>

			{/* Description — always shown, clamped to 2 lines */}
			<div className="mb-3 h-[2.8rem]">
				<p className="text-[10px] font-semibold text-[#334155] uppercase tracking-wide mb-0.5">
					Description
				</p>
				<p
					className={`text-xs break-words ${project.description ? "text-[#475569]" : "text-[#94A3B8]"} italic`}
					style={{
						display: "-webkit-box",
						WebkitLineClamp: 2,
						WebkitBoxOrient: "vertical",
						overflow: "hidden",
					}}
				>
					{project.description || "(No description)"}
				</p>
			</div>

			{/* Divider */}
			<div className="border-t border-[#E2E8F0] mb-5" />

			{/* Bottom Row: Timeline + Menu */}
			<div className="flex h-[.4rem] items-center justify-between mt-auto">
				<div className="font-weight-100 flex items-center gap-1.5 text-xs text-[#334155] min-w-0">
						<>
							<CalendarIcon />
							<span className="truncate">
								{ project.start_date ? formatDateTime(project.start_date) :'N/A' }
							</span>
							
							<span className="font-weight-100 text-[#94A3B8] flex-shrink-0">—</span>
							
							<CalendarIcon />
							
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
						className="p-1.5 rounded-lg hover:bg-[#F1F5F9] transition-colors text-[#94A3B8] hover:text-[#475569]"
					>
						<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
							<circle cx="8" cy="3" r="1.5" />
							<circle cx="8" cy="8" r="1.5" />
							<circle cx="8" cy="13" r="1.5" />
						</svg>
					</button>

					{menuOpen && menuPos && (
						<div
							ref={menuRef}
							className="fixed w-56 bg-white rounded-xl shadow-lg border border-[#E2E8F0] py-1 z-[100]"
							style={{ top: menuPos.top, right: menuPos.right }}
						>
							<button
								onClick={() => { setMenuOpen(false); onEdit(); }}
								className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[#0F172A] hover:bg-[#F8FAFC] transition-colors"
							>
								<svg width="16" height="16" viewBox="0 0 16 16" fill="none">
									<path d="M11.5 1.5L14.5 4.5L5.5 13.5L2 14L2.5 10.5L11.5 1.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
								</svg>
								Edit project details
							</button>
							<button
								onClick={() => { setMenuOpen(false); onManageMembers(); }}
								className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[#0F172A] hover:bg-[#F8FAFC] transition-colors"
							>
								<svg width="16" height="16" viewBox="0 0 16 16" fill="none">
									<path d="M8 10C9.933 10 11.5 8.433 11.5 6.5C11.5 4.567 9.933 3 8 3C6.067 3 4.5 4.567 4.5 6.5C4.5 8.433 6.067 10 8 10Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
									<path d="M2 14C3.5 11.5 5.5 10.5 8 10.5C10.5 10.5 12.5 11.5 14 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
								</svg>
								Manage project members
							</button>
							<div className="border-t border-[#F1F5F9] my-1" />
							<button
								onClick={() => { setMenuOpen(false); onDelete(); }}
								className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[#EF4444] hover:bg-[#FEF2F2] transition-colors"
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
	);
}
