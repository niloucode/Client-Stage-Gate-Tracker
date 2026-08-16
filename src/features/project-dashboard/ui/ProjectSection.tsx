"use client";

import {
	CircleEllipsis,
	Layers,
	CheckCircle2,
	ChevronDown,
} from "lucide-react";
import type { ComponentType, ReactNode } from "react";
import type { ProjectWithStatus, ProjectStatus } from "@/entities/project";
import { Badge } from "@/components/ui";

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
		iconColor: string;
		badgeText: string;
		badgeBg: string;
		emptyText: string;
		icon: ComponentType<{ size?: number; className?: string }>;
	}
> = {
	PENDING: {
		iconColor: "text-red-600",
		badgeText: "text-red-600",
		badgeBg: "bg-red-100",
		emptyText: "No pending projects.",
		icon: CircleEllipsis,
	},
	ACTIVE: {
		iconColor: "text-brand-500",
		// Dark badge (brand-500) with light text for contrast — verified
		// against the design tokens (--color-brand-500 #6B1FA8).
		badgeText: "text-brand-500",
		badgeBg: "bg-brand-50",
		emptyText: "No active projects.",
		icon: Layers,
	},
	COMPLETED: {
		iconColor: "text-green-600",
		badgeText: "text-green-600",
		badgeBg: "bg-green-100",
		emptyText: "No completed projects yet.",
		icon: CheckCircle2,
	},
};

/** Collapsible project section grouped by status. */
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
					<IconComponent size={24} className={config.iconColor} />
					{/* span, not h2: a heading inside the toggle <button> is
					 * invalid flow content (buttons allow phrasing only). */}
					<Badge
						className={config.badgeBg}
					>
						<h3 className={`${config.badgeText}!`}>{projects.length}</h3>
					</Badge>
					<h3>{title}</h3>
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
