"use client";

import {
	CircleEllipsis,
	Layers,
	CheckCircle2,
	ChevronDown,
} from "lucide-react";
import type { ComponentType, ReactNode } from "react";
import type { ProjectWithStatus, ProjectStatus } from "@/entities/project";

interface ProjectSectionProps {
	title: string;
	status: ProjectStatus;
	projects: ProjectWithStatus[];
	isExpanded: boolean;
	onToggle: () => void;
	children: ReactNode;
}

const STATUS_CONFIG: Record<
	ProjectStatus,
	{
		icolor: string;
		color: string;
		bg: string;
		emptyText: string;
		icon: ComponentType<{ size?: number; className?: string }>;
	}
> = {
	PENDING: {
		icolor: "text-red-600",
		color: "text-red-600",
		bg: "bg-red-100",
		emptyText: "No pending projects.",
		icon: CircleEllipsis,
	},
	ACTIVE: {
		icolor: "text-brand-500",
		color: "text-brand-100",
		bg: "bg-brand-500",
		emptyText: "No active projects.",
		icon: Layers,
	},
	COMPLETED: {
		icolor: "text-green-600",
		color: "text-green-600",
		bg: "bg-green-100",
		emptyText: "No completed projects yet.",
		icon: CheckCircle2,
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
		<div>
			{/* Section Header */}
			<button
				type="button"
				onClick={onToggle}
				className="rounded-md cursor-pointer select-none border border-brand-100 w-full flex items-center justify-between px-5 py-3 bg-neutral-surface-subtle transition-colors hover:bg-neutral-subtle"
			>
				<div className="flex items-center gap-5 py-1">
					<IconComponent size={24} className={config.icolor} />
					<h2>{title}</h2>
					<span
						className={`text-md font-semibold px-4 py-0.5 rounded-full ${config.color} ${config.bg}`}
					>
						{projects.length}
					</span>
				</div>
				<ChevronDown
					size={24}
					className={`text-neutral-border transform transition-transform duration-300 ease-in-out ${
						isExpanded ? "rotate-180" : ""
					}`}
				/>
			</button>

			{/* Collapsible Animated Container */}
			<div
				className={`grid transition-[grid-template-rows,opacity] duration-300 ease-in-out ${
					isExpanded
						? "grid-rows-[1fr] opacity-100"
						: "grid-rows-[0fr] opacity-0"
				}`}
			>
				<div className="overflow-hidden">
					{projects.length === 0 ? (
						<p className="text-sm text-foreground px-5 py-8 text-center">
							{config.emptyText}
						</p>
					) : (
						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 p-4">
							{children}
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
