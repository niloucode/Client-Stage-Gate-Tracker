"use client";

import { Suspense } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useProject } from "@/entities/project";
import { useStageTree } from "@/entities/stage/queries";
import { getWorkflowById } from "@/entities/workflow";
import { Breadcrumbs, type BreadcrumbItem } from "./Breadcrumbs";
import { AccountMenu } from "./AccountMenu";

const SECTION_LABELS: Record<string, string> = {
	gates: "Gates",
	gate: "Gate",
	phases: "Phases",
	modules: "Modules",
	stages: "Stages",
	workflows: "Workflows",
	contract: "Contract",
	contracts: "Contracts",
	analytics: "Analytics",
	credentials: "Credentials",
	variables: "Project Variables",
	"dashboard-analytics": "Dashboard Analytics",
	issues: "Issues",
	team: "Project Team",
	clients: "Clients",
	dashboard: "Dashboard",
	projects: "Projects",
};

/**
 * Fetches workflow details (including parent Module, Phase, and Stage ID)
 * when on a workflow board route.
 */
function useWorkflowData(workflowId: string | null | undefined) {
	return useQuery({
		queryKey: ["workflow", "detail", workflowId],
		queryFn: async () => {
			if (!workflowId) return null;
			const res = await getWorkflowById(workflowId, "active");
			return res.success && res.data ? res.data : null;
		},
		enabled: !!workflowId,
	});
}

/**
 * Derives full, real-time hierarchical breadcrumbs from the route structure.
 */
function useRealBreadcrumbs(): BreadcrumbItem[] {
	const pathname = usePathname();
	const searchParams = useSearchParams();

	// 1. Check for Workflow Board Route: /projects/[projectId]/workflows/[workflowId]
	const workflowMatch = pathname.match(
		/^\/projects\/([^/]+)\/workflows\/([^/]+)/,
	);
	const wfProjectId = workflowMatch?.[1];
	const workflowId = workflowMatch?.[2];

	// 2. Check for Stage Route: /projects/[projectId]/stages/[stageId](/[subSection])?
	const stageMatch = pathname.match(
		/^\/projects\/([^/]+)\/stages\/([^/]+)(?:\/([^/]+))?/,
	);
	const stageProjectId = stageMatch?.[1];
	const stageRouteId = stageMatch?.[2];
	const stageSubSection = stageMatch?.[3]; // e.g. "gate"

	// 3. Check for generic Project Route: /projects/[projectId](/[subSection])?
	const projectMatch = pathname.match(/^\/projects\/([^/]+)(?:\/([^/]+))?/);
	const baseProjectId = projectMatch?.[1];
	const baseSubSection = projectMatch?.[2];

	// Determine effective IDs to query
	const projectId = wfProjectId || stageProjectId || baseProjectId || null;
	const { data: project } = useProject(projectId);
	const { data: workflow } = useWorkflowData(workflowId);

	// Resolve stageId from either route param or parent workflow relations
	const resolvedStageId =
		stageRouteId || workflow?.Modules?.Phases?.stage_id || undefined;
	const { data: stageTree } = useStageTree(resolvedStageId);

	// --- A. Workflow / Ticket Board Route ---
	if (workflowId && projectId) {
		const crumbs: BreadcrumbItem[] = [
			{ label: "Projects", href: "/projects" },
			{
				label: project?.name || "Project",
				href: `/projects/${projectId}`,
			},
		];

		const stageId = workflow?.Modules?.Phases?.stage_id;
		const phaseNumber = workflow?.Modules?.Phases?.number;
		const phaseName = workflow?.Modules?.Phases?.name;
		const moduleName = workflow?.Modules?.name;
		const workflowName = workflow?.name;

		if (stageId && stageTree?.name) {
			crumbs.push({
				label: stageTree.name,
				href: `/projects/${projectId}/stages/${stageId}`,
			});
		}

		if (stageId && phaseName) {
			crumbs.push({
				label: phaseName,
				href: `/projects/${projectId}/stages/${stageId}${
					phaseNumber ? `?phase=${phaseNumber}` : ""
				}`,
			});
		}

		if (stageId && moduleName) {
			crumbs.push({
				label: moduleName,
				href: `/projects/${projectId}/stages/${stageId}${
					phaseNumber ? `?phase=${phaseNumber}` : ""
				}`,
			});
		}

		if (workflowName) {
			crumbs.push({
				label: workflowName,
				href: `/projects/${projectId}/workflows/${workflowId}`,
			});
		}

		// Hardcoded non-clickable terminal item for Tickets
		crumbs.push({
			label: "Tickets",
		});

		return crumbs;
	}

	// --- B. Stage Editor & Gate Route ---
	if (stageRouteId && projectId) {
		const crumbs: BreadcrumbItem[] = [
			{ label: "Projects", href: "/projects" },
			{
				label: project?.name || "Project",
				href: `/projects/${projectId}`,
			},
		];

		if (stageSubSection === "gate") {
			if (stageTree?.name) {
				crumbs.push({
					label: stageTree.name,
					href: `/projects/${projectId}/stages/${stageRouteId}`,
				});
			}
			crumbs.push({ label: "Gate" });
			return crumbs;
		}

		// Check if a specific phase is selected via query params (?phase=1)
		const phaseParam = searchParams.get("phase");
		const phaseNumber = phaseParam ? Number(phaseParam) : null;
		const selectedPhase = phaseNumber
			? stageTree?.phases?.find((p) => p.number === phaseNumber)
			: null;

		if (selectedPhase) {
			crumbs.push({
				label: stageTree?.name || "Stage",
				href: `/projects/${projectId}/stages/${stageRouteId}`,
			});
			crumbs.push({
				label: selectedPhase.name || `Phase ${phaseNumber}`,
			});
		} else {
			crumbs.push({
				label: stageTree?.name || "Stage",
			});
		}

		return crumbs;
	}

	// --- C. Standard Project Subpages (Contract, Issues, Variables, etc.) ---
	if (projectId) {
		const crumbs: BreadcrumbItem[] = [{ label: "Projects", href: "/projects" }];

		if (baseSubSection) {
			crumbs.push({
				label: project?.name || "Project",
				href: `/projects/${projectId}`,
			});
			crumbs.push({
				label:
					SECTION_LABELS[baseSubSection] ??
					baseSubSection.charAt(0).toUpperCase() + baseSubSection.slice(1),
			});
		} else {
			crumbs.push({
				label: project?.name || "Project",
			});
		}

		return crumbs;
	}

	// --- D. Top-level Pages (Dashboard, Team, Clients, Projects list) ---
	const segments = pathname.split("/").filter(Boolean);
	if (segments.length === 0) return [{ label: "Dashboard" }];

	return segments.map((seg, idx) => {
		const isLast = idx === segments.length - 1;
		return {
			label: SECTION_LABELS[seg] ?? seg.charAt(0).toUpperCase() + seg.slice(1),
			href: isLast ? undefined : `/${segments.slice(0, idx + 1).join("/")}`,
		};
	});
}

function TopNavBreadcrumbs() {
	const breadcrumbs = useRealBreadcrumbs();
	return <Breadcrumbs items={breadcrumbs} />;
}

export default function TopNav() {
	return (
		<header className="bg-neutral-surface relative flex items-center justify-between px-8 py-3 border-b border-brand-100 shrink-0">
			<Suspense fallback={<nav aria-label="Breadcrumb" className="h-5" />}>
				<TopNavBreadcrumbs />
			</Suspense>

			<div className="flex items-center gap-3">
				<div className="w-px h-5 bg-gray-200" />
				<AccountMenu />
			</div>
		</header>
	);
}
