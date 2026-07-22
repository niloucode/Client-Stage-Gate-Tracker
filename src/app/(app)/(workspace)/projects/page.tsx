"use client";

import Sidebar from "@/shared/ui/sidebar";
import TopNav from "@/shared/ui/TopNav";
import { ProjectDashboard } from "@/features/project-dashboard";

export default function ProjectsPage() {
	return (
		<div className="bg-[#F8FAFC] min-h-screen">
			<Sidebar>
				<TopNav breadcrumbs={["Acesoft", "Projects"]} />
				<ProjectDashboard />
			</Sidebar>
		</div>
	);
}
