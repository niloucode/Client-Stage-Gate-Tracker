"use client";

import type { ProjectWithStatus, ProjectStatus } from "@/entities/project";
import { PendingIcon, ActiveIcon, CompletedIcon } from "./ProjectCard";

interface ProjectSectionProps {
	title: string;
	status: ProjectStatus;
	projects: ProjectWithStatus[];
	isExpanded: boolean;
	onToggle: () => void;
	children: React.ReactNode;
}

const STATUS_CONFIG: Record<ProjectStatus, { color: string; bg: string; emptyText: string; icon: React.ComponentType<{ size?: number }> }> = {
	PENDING: {
		color: "text-yellow-700",
		bg: "bg-yellow-50",
		emptyText: "No pending projects.",
		icon: PendingIcon,
	},
	ACTIVE: {
		color: "text-indigo-700",
		bg: "bg-indigo-50",
		emptyText: "No active projects.",
		icon: ActiveIcon,
	},
	COMPLETED: {
		color: "text-green-700",
		bg: "bg-green-50",
		emptyText: "No completed projects yet.",
		icon: CompletedIcon,
	},
};

export function ProjectSection({
	title,
	status,
	projects,
	isExpanded,
	onToggle,
	children,
}: ProjectSectionProps) {
	const config = STATUS_CONFIG[status];
	const IconComponent = config.icon;

	return (
		<div className="bg-white rounded-xl border border-[#E2E8F0]">
			{/* Section Header */}
			<button
				onClick={onToggle}
				className="w-full flex items-center justify-between px-5 py-4 hover:bg-[#F8FAFC] transition-colors"
			>
				<div className="flex items-center gap-2">
					<IconComponent />
					<h2 className="text-base font-semibold text-[#0F172A]">{title}</h2>
					<span
						className={`text-xs font-semibold px-2 py-0.5 rounded-full ${config.color} ${config.bg}`}
					>
						{projects.length}
					</span>
				</div>
				<svg
					width="16"
					height="16"
					viewBox="0 0 16 16"
					fill="none"
					className={`transform transition-transform ${isExpanded ? "rotate-180" : ""}`}
				>
					<path
						d="M4 6L8 10L12 6"
						stroke="#64748B"
						strokeWidth="2.5"
						strokeLinecap="round"
						strokeLinejoin="round"
					/>
				</svg>
			</button>

			{/* Content */}
			{isExpanded && (
				<div className="border-t border-[#E2E8F0]">
					{projects.length === 0 ? (
						<p className="text-sm text-[#94A3B8] px-5 py-8 text-center">
							{config.emptyText}
						</p>
					) : (
						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">{children}</div>
					)}
				</div>
			)}
		</div>
	);
}
