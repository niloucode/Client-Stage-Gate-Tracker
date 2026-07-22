"use client";

import { useState, useMemo } from "react";
import {
	useOwnedProjects,
	useCreateProject,
	useUpdateProject,
	useDeleteProject,
	type ProjectStatus,
	type ProjectWithStatus,
} from "@/entities/project";
import { EditProjectModal } from "@/features/project-manager/ui/modals/EditProjectModal";
import { ManageMembersModal } from "@/features/project-manager/ui/modals/ManageMembersModal";
import { DeleteProjectModal } from "@/features/project-manager/ui/modals/DeleteProjectModal";
import { ProjectSection } from "./ProjectSection";
import { ProjectCard } from "./ProjectCard";
import type { ProjectCreateInput, ProjectUpdateInput } from "@/shared/schemas";

interface ModalState {
	project_id: string;
	name: string;
	description?: string | null;
	client_id?: string | null;
	start_date?: Date | null;
	deadline_date?: Date | null;
}

export function ProjectDashboard() {
	const { data: projects, isLoading, error } = useOwnedProjects();
	const createMutation = useCreateProject();
	const updateMutation = useUpdateProject();
	const deleteMutation = useDeleteProject();

	const [expandedSections, setExpandedSections] = useState<Set<ProjectStatus>>(
		new Set(["PENDING", "ACTIVE", "COMPLETED"]),
	);
	const [showAddModal, setShowAddModal] = useState(false);
	const [editProject, setEditProject] = useState<ModalState | null>(null);
	const [manageMembersProjectId, setManageMembersProjectId] = useState<string | null>(null);
	const [deleteProject, setDeleteProject] = useState<{ project_id: string; name: string } | null>(null);

	// Group projects by status
	const grouped = useMemo(() => {
		const empty: { PENDING: ProjectWithStatus[]; ACTIVE: ProjectWithStatus[]; COMPLETED: ProjectWithStatus[] } = {
			PENDING: [], ACTIVE: [], COMPLETED: [],
		};
		if (!projects) return empty;
		return {
			PENDING: projects.filter((p) => p.project_status === "PENDING"),
			ACTIVE: projects.filter((p) => p.project_status === "ACTIVE"),
			COMPLETED: projects.filter((p) => p.project_status === "COMPLETED"),
		};
	}, [projects]);

	const sections: { title: string; status: ProjectStatus; projects: ProjectWithStatus[] }[] = [
		{ title: "Active Projects", status: "ACTIVE", projects: grouped.ACTIVE },
		{ title: "Pending Projects", status: "PENDING", projects: grouped.PENDING },
		{ title: "Completed Projects", status: "COMPLETED", projects: grouped.COMPLETED },
	];

	const handleToggle = (status: ProjectStatus) => {
		setExpandedSections((prev) => {
			const next = new Set(prev);
			if (next.has(status)) {
				next.delete(status);
			} else {
				next.add(status);
			}
			return next;
		});
	};

	const handleCreate = async (data: ProjectCreateInput) => {
		const result = await createMutation.mutateAsync(data);
		if (result.success && result.data) {
			setShowAddModal(false);
			// Auto-open Manage Members for the new project
			setManageMembersProjectId(result.data.project_id);
		}
	};

	const handleUpdate = async (data: ProjectUpdateInput) => {
		const result = await updateMutation.mutateAsync(data);
		if (result.success) setEditProject(null);
	};

	const handleDelete = async () => {
		if (!deleteProject) return;
		const result = await deleteMutation.mutateAsync({
			projectId: deleteProject.project_id,
			confirmationName: deleteProject.name,
		});
		if (result.success) setDeleteProject(null);
	};

	if (isLoading) {
		return (
			<div className="p-8 max-w-[1400px] mx-auto">
				<div className="animate-pulse space-y-6">
					<div className="h-8 bg-[#F1F5F9] rounded w-48" />
					<div className="h-4 bg-[#F1F5F9] rounded w-72" />
					{[1, 2, 3].map((i) => (
						<div key={i} className="h-24 bg-[#F1F5F9] rounded-xl" />
					))}
				</div>
			</div>
		);
	}

	if (error) {
		return (
			<div className="p-8 max-w-[1400px] mx-auto">
				<p className="text-sm text-red-500">Failed to load projects. Please try again.</p>
			</div>
		);
	}

	return (
		<div className="p-8 max-w-[1400px] mx-auto">
			{/* Page Header */}
			<div className="flex justify-between items-end pb-6 mb-6 border-b border-[#E2E8F0]">
				<div>
					<h1 className="text-2xl font-bold text-[#0F172A] tracking-tight">Projects</h1>
					<p className="text-sm text-[#64748B] mt-1">
						Manage and track the projects assigned to you.
					</p>
				</div>
				<button
					onClick={() => setShowAddModal(true)}
					className="flex items-center gap-2 px-4 py-2 bg-[#4F46E5] text-white rounded-lg hover:bg-[#4338CA] transition-all shadow-sm"
				>
					<svg width="14" height="14" viewBox="0 0 14 14" fill="none">
						<path d="M7 1V13M1 7H13" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
					</svg>
					<span className="font-semibold text-sm">Add Project</span>
				</button>
			</div>

			{/* Project Sections */}
			<div className="space-y-4">
				{sections.map(({ title, status, projects: sectionProjects }) => (
					<ProjectSection
						key={status}
						title={title}
						status={status}
						projects={sectionProjects}
						isExpanded={expandedSections.has(status)}
						onToggle={() => handleToggle(status)}
					>
						{sectionProjects.map((project) => {
							const projectForEdit: ModalState = {
								project_id: project.project_id,
								name: project.name,
								description: project.description,
								client_id: project.client_id,
								start_date: project.start_date,
								deadline_date: project.deadline_date,
							};
							return (
								<ProjectCard
									key={project.project_id}
									project={project}
									onEdit={() => setEditProject(projectForEdit)}
									onManageMembers={() =>
										setManageMembersProjectId(project.project_id)
									}
									onDelete={() =>
										setDeleteProject({
											project_id: project.project_id,
											name: project.name,
										})
									}
								/>
							);
						})}
					</ProjectSection>
				))}
			</div>

			{/* Modals */}
			<EditProjectModal
				isOpen={showAddModal}
				project={null}
				onClose={() => setShowAddModal(false)}
				onSubmit={handleCreate}
			/>

			<EditProjectModal
				isOpen={editProject !== null}
				project={editProject}
				onClose={() => setEditProject(null)}
				onSubmit={(data) =>
					handleUpdate({ ...data, project_id: editProject!.project_id })
				}
			/>

			<ManageMembersModal
				isOpen={manageMembersProjectId !== null}
				projectId={manageMembersProjectId ?? ""}
				onClose={() => setManageMembersProjectId(null)}
			/>

			<DeleteProjectModal
				isOpen={deleteProject !== null}
				projectName={deleteProject?.name ?? ""}
				onClose={() => setDeleteProject(null)}
				onConfirm={handleDelete}
			/>
		</div>
	);
}
