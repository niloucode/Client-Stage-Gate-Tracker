"use client";

import type { ProjectWithStatus, ProjectStatus } from "@/entities/project";

function PendingIcon({ size = 18 }: { size?: number }) {
	const currentColor = '#410004'
	return (
        <svg width={size} height={size} viewBox="0 0 14 14" fill="none">
            {/* Outer Circle */}
            <circle 
                cx="7" 
                cy="7" 
                r="5.8" 
                stroke={currentColor} 
                strokeWidth="1.2" 
            />
            
            {/* Inner Dots */}
            <circle cx="4.2" cy="7" r="0.85" fill={currentColor} />
            <circle cx="7" cy="7" r="0.85" fill={currentColor} />
            <circle cx="9.8" cy="7" r="0.85" fill={currentColor} />
        </svg>
	);
}

function ActiveIcon({ size = 18 }: { size?: number }) {
	const currentColor = '#4F46E5'
	return (
		<svg width={size} height={size} viewBox="0 0 14 14" fill="none">
            {/* Top Window - Solid Header Bar */}
            <path 
                d="M 5.5 2.5 C 5.5 1.8 6.0 1.2 6.8 1.2 H 11.7 C 12.5 1.2 13 1.8 13 2.5 V 4 H 5.5 V 2.5 Z" 
                fill={currentColor} 
            />
            
            {/* Top Window - Card Border */}
            <rect 
                x="5.5" 
                y="1.2" 
                width="7.5" 
                height="5.8" 
                rx="1.3" 
                stroke={currentColor}  
                strokeWidth="1.2" 
            />

            {/* Middle Layer */}
            <path 
                d="M 3.2 4.2 V 8.3 C 3.2 9.0 3.7 9.5 4.4 9.5 H 8.5" 
                stroke={currentColor}  
                strokeWidth="1.2" 
                strokeLinecap="round" 
            />

            {/* Bottom Layer */}
            <path 
                d="M 1 6.8 V 10.9 C 1 11.6 1.5 12.1 2.2 12.1 H 6.3" 
                stroke={currentColor}  
                strokeWidth="1.2" 
                strokeLinecap="round" 
            />
        </svg>
	);
}

function CompletedIcon({ size = 18 }: { size?: number }) {
	const currentColor = '#00714D';
	return (
		<svg width={size} height={size} viewBox="0 0 14 14" fill="none">
            {/* Outer Circle (identical to MoreCircleIcon) */}
            <circle 
                cx="7" 
                cy="7" 
                r="5.8" 
                stroke={currentColor} 
                strokeWidth="1.2" 
            />
            
            {/* Inner Checkmark */}
            <path 
                d="M 4.3 7.2 L 6.1 9 L 9.7 5.2" 
                stroke={currentColor} 
                strokeWidth="1.2" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
            />
        </svg>
	);
}

const STATUS_ICONS = {
	PENDING: PendingIcon,
	ACTIVE: ActiveIcon,
	COMPLETED: CompletedIcon,
} as const;

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
		color: "text-[#410004]",
		bg: "bg-[#FFDAD7]",
		emptyText: "No pending projects.",
		icon: PendingIcon,
	},
	ACTIVE: {
		color: "text-[#DAD7FF]",
		bg: "bg-[#4F46E5]",
		emptyText: "No active projects.",
		icon: ActiveIcon,
	},
	COMPLETED: {
		color: "text-[#00714D]",
		bg: "bg-[#BAE9D4]",
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
		<div>
			{/* Section Header */}
			<button
				onClick={onToggle}
				className="rounded-xl border border-[#C7C4D8] w-full flex items-center justify-between px-5 py-3 bg-[#EFF4FF] transition-colors"
			>
				<div className="flex items-center gap-2">
					<IconComponent />
					<h2 className="text-[23px] font-semibold text-[#0F172A]">{title}</h2>
					<span
						className={`text-xs font-semibold w-[35px] px-2 py-0.5 rounded-full ${config.color} ${config.bg}`}
					>
						{projects.length}
					</span>
				</div>
				<svg
					width="20"
					height="20"
					viewBox="0 0 20 20"
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
				<div className="">
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
