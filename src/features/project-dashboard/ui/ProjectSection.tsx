"use client"

import { CircleEllipsis, Layers, CheckCircle2, ChevronDown } from "lucide-react"
import type { ProjectWithStatus, ProjectStatus } from "@/entities/project"

interface ProjectSectionProps {
    title: string
    status: ProjectStatus
    projects: ProjectWithStatus[]
    isExpanded: boolean
    onToggle: () => void
    children: React.ReactNode
}

const STATUS_CONFIG: Record<
    ProjectStatus,
    {
        icolor: string
        color: string
        bg: string
        emptyText: string
        icon: React.ComponentType<{ size?: number; className?: string }>
    }
> = {
    PENDING: {
        icolor: "text-[#6d0007]",
        color: "text-[#6d0007]",
        bg: "bg-[#FFDAD7]",
        emptyText: "No pending projects.",
        icon: CircleEllipsis,
    },
    ACTIVE: {
        icolor: "text-[#4F46E5]",
        color: "text-[#DAD7FF]",
        bg: "bg-[#4F46E5]",
        emptyText: "No active projects.",
        icon: Layers,
    },
    COMPLETED: {
        icolor: "text-[#00714D]",
        color: "text-[#00714D]",
        bg: "bg-[#BAE9D4]",
        emptyText: "No completed projects yet.",
        icon: CheckCircle2,
    },
}

export function ProjectSection({
    title,
    status,
    projects,
    isExpanded,
    onToggle,
    children,
}: ProjectSectionProps) {
    const config = STATUS_CONFIG[status]
    const IconComponent = config.icon

    return (
        <div>
            {/* Section Header */}
            <button
                type="button"
                onClick={onToggle}
                className="cursor-pointer select-none rounded-xl border border-[#C7C4D8] w-full flex items-center justify-between px-5 py-3 bg-[#EFF4FF] transition-colors hover:bg-[#e4ebfc]"
            >
                <div className="flex items-center gap-2">
                    <IconComponent size={18} className={config.icolor} />
                    <h2 className="text-[23px] font-semibold text-[#0F172A]">{title}</h2>
                    <span
                        className={`text-xs font-semibold px-2 py-0.5 rounded-full ${config.color} ${config.bg}`}
                    >
                        {projects.length}
                    </span>
                </div>
                <ChevronDown
                    size={20}
                    className={`text-[#64748B] transform transition-transform duration-300 ease-in-out ${
                        isExpanded ? "rotate-180" : ""
                    }`}
                />
            </button>

            {/* Collapsible Animated Container */}
            <div
                className={`grid transition-[grid-template-rows,opacity] duration-300 ease-in-out ${
                    isExpanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                }`}
            >
                <div className="overflow-hidden">
                    {projects.length === 0 ? (
                        <p className="text-sm text-[#94A3B8] px-5 py-8 text-center">
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
    )
}	