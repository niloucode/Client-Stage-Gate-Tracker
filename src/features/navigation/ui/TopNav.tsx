"use client"

import { usePathname } from "next/navigation"
import { useProject } from "@/entities/project"
import { Breadcrumbs, type BreadcrumbItem } from "./Breadcrumbs"
import { AccountMenu } from "./AccountMenu"

const SECTION_LABELS: Record<string, string> = {
	gates: "Gates",
	phases: "Phases",
	modules: "Modules",
	stages: "Stages",
	workflows: "Workflows",
	contracts: "Contracts",
	analytics: "Analytics",
	credentials: "Credentials",
	"dashboard-analytics": "Dashboard Analytics",
	issues: "Issues",
}

/**
 * Derives real breadcrumbs from the current route: for /projects/[id]/…
 * it shows Projects → <project name> → <section>, fetching the project name
 * from the API instead of rendering placeholder text.
 */
function useRealBreadcrumbs(): BreadcrumbItem[] {
	const pathname = usePathname()
	const match = pathname.match(/^\/projects\/([^/]+)(?:\/([^/]+))?/)
	const { data: project } = useProject(match?.[1] ?? null)

	if (match) {
		const crumbs: BreadcrumbItem[] = [{ label: "Projects", href: "/projects" }]
		if (project) {
			crumbs.push({
				label: project.name,
				href: `/projects/${match[1]}`,
			})
		}
		const section = match[2]
		if (section) {
			crumbs.push({
				label:
					SECTION_LABELS[section] ??
					section.charAt(0).toUpperCase() + section.slice(1),
			})
		}
		return crumbs
	}

	const segments = pathname.split("/").filter(Boolean)
	if (segments.length === 0) return [{ label: "Dashboard" }]
	return segments.map((seg, idx) => {
		const isLast = idx === segments.length - 1
		return {
			label: SECTION_LABELS[seg] ?? seg.charAt(0).toUpperCase() + seg.slice(1),
			href: isLast ? undefined : `/${segments.slice(0, idx + 1).join("/")}`,
		}
	})
}

export default function TopNav() {
	const breadcrumbs = useRealBreadcrumbs()

	return (
		<header className="bg-neutral-surface relative flex items-center justify-between px-8 py-3 border-b border-brand-100 shrink-0">
			<Breadcrumbs items={breadcrumbs} />

			<div className="flex items-center gap-3">
				<div className="w-px h-5 bg-gray-200" />
				<AccountMenu />
			</div>
		</header>
	)
}