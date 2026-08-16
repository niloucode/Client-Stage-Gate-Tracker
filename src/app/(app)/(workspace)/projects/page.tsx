"use client";

import { ProjectDashboard } from "@/features/project-dashboard";

/**
 * Projects list route.
 * @returns The rendered component.
 */
export default function ProjectsPage() {
	return (
		<div className="min-h-screen">
			<ProjectDashboard />
		</div>
	);
}
