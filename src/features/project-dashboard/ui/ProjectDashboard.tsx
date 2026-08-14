"use client";

import { useState, useMemo } from "react";
import {
	useProjectsForMember,
	useCreateProject,
	useUpdateProject,
	useDeleteProject,
	type ProjectStatus,
	type ProjectWithStatus,
} from "@/entities/project";
import { useCurrentUser } from "@/entities/profile";

import { EditProjectModal } from "./modals/ProjectModals";
import { ManageMembersModal } from "./modals/ManageMembersModal";
import { DeleteProjectModal } from "./modals/DeleteProjectModal";

import { ProjectSection } from "./ProjectSection";
import { ProjectCard } from "./ProjectCard";

import { toast } from "@/components/ui/toast";

import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import type { ProjectCreateInput } from "@/shared/schemas";

interface ModalState {
	project_id: string;
	name: string;
	description?: string | null;
	client_id?: string | null;
	start_date?: Date | null;
	deadline_date?: Date | null;
}

export function ProjectDashboard() {
	const { data: projects, isLoading, error } = useProjectsForMember();
	const { data: profile } = useCurrentUser();
	// "+ Add Project" is owner-only, with one bootstrap exception: a staff
	// user who owns no projects yet (no role assignments anywhere) must be
	// able to create their first project — createProject auto-assigns the
	// creator as Project Owner. Clients (Profiles.client_id set) never see
	// it, and team members who are not owners never see it.
	const isClientProfile = !!profile?.client_id;
	const canManage =
		!isClientProfile &&
		((projects ?? []).length === 0 || (projects ?? []).some((p) => p.is_owner));
	const createMutation = useCreateProject();
	const updateMutation = useUpdateProject();
	const deleteMutation = useDeleteProject();

	const [expandedSections, setExpandedSections] = useState<Set<ProjectStatus>>(
		new Set(["PENDING", "ACTIVE", "COMPLETED"]),
	);
	const [showAddModal, setShowAddModal] = useState(false);
	const [editProject, setEditProject] = useState<ModalState | null>(null);
	const [manageMembersProjectId, setManageMembersProjectId] = useState<
		string | null
	>(null);
	const [deleteProject, setDeleteProject] = useState<{
		project_id: string;
		name: string;
	} | null>(null);

	// Group projects by status
	const grouped = useMemo(() => {
		const empty: {
			PENDING: ProjectWithStatus[];
			ACTIVE: ProjectWithStatus[];
			COMPLETED: ProjectWithStatus[];
		} = {
			PENDING: [],
			ACTIVE: [],
			COMPLETED: [],
		};
		if (!projects) return empty;
		return {
			PENDING: projects.filter((p) => p.project_status === "PENDING"),
			ACTIVE: projects.filter((p) => p.project_status === "ACTIVE"),
			COMPLETED: projects.filter((p) => p.project_status === "COMPLETED"),
		};
	}, [projects]);

	const sections: {
		title: string;
		status: ProjectStatus;
		projects: ProjectWithStatus[];
	}[] = [
		{ title: "Active Projects", status: "ACTIVE", projects: grouped.ACTIVE },
		{ title: "Pending Projects", status: "PENDING", projects: grouped.PENDING },
		{
			title: "Completed Projects",
			status: "COMPLETED",
			projects: grouped.COMPLETED,
		},
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
		if (!data.client_id) return;
		const result = await createMutation.mutateAsync({
			name: data.name,
			description: data.description,
			client_id: data.client_id,
			start_date: data.start_date,
			deadline_date: data.deadline_date,
		});
		if (result.success && result.data) {
			setShowAddModal(false);
			setManageMembersProjectId(result.data.project_id);

			// TOAST CALLER
			toast.add({
				title: "Project Added",
				description: "Project successfully added",
				type: "success",
			});
		}
	};

	const handleUpdate = async (
		data: ProjectCreateInput & { project_id: string },
	) => {
		const result = await updateMutation.mutateAsync({
			project_id: data.project_id,
			name: data.name,
			description: data.description,
			client_id: data.client_id ?? undefined,
			start_date: data.start_date,
			deadline_date: data.deadline_date,
		});
		if (result.success) {
			setEditProject(null);

			// TOAST CALLER
			toast.add({
				title: "Project Edited",
				description: "Project successfully edited",
				type: "success",
			});
		}
	};

	const handleDelete = async () => {
		if (!deleteProject) return;
		const result = await deleteMutation.mutateAsync({
			projectId: deleteProject.project_id,
			confirmationName: deleteProject.name,
		});
		if (result.success) {
			setDeleteProject(null);
			toast.add({
				title: "Project Deleted",
				description: "Project successfully deleted",
				type: "delete",
			});
		}
	};

	if (isLoading) {
		return (
			<div className="p-8 max-w-387.5 mx-auto">
				<div className="animate-pulse space-y-6">
					<div className="h-8 bg-slate-100 rounded w-48" />
					<div className="h-4 bg-slate-100 rounded w-72" />
					{[1, 2, 3].map((i) => (
						<div key={i} className="h-24 bg-slate-100 rounded-md" />
					))}
				</div>
			</div>
		);
	}

	if (error) {
		return (
			<div className="min-h-[40vw] flex items-center justify-center">
				<p className="text-sm text-red-500">
					Failed to load projects. Please try again.
				</p>
			</div>
		);
	}

	return (
		<div>
			{/* Page Header */}
			<div className="flex justify-between items-end mb-6">
				<div>
					<h1>Projects</h1>
					<p className="subtitle">
						Manage and track the projects assigned to you.
					</p>
				</div>
				{canManage && (
					<Button onClick={() => setShowAddModal(true)}>
						<Plus />
						Add Project
					</Button>
				)}
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
									isOwner={project.is_owner}
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
