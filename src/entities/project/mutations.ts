"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { projectKeys } from "@/shared/query/keys";
import {
	createProject,
	updateProject,
	softDeleteProject,
	addProjectMember,
	removeProjectMember,
} from "./projectActions";
import type { ProjectCreateInput, ProjectUpdateInput } from "@/shared/schemas";

export function useCreateProject() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (data: ProjectCreateInput) => createProject(data),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: projectKeys.lists() });
		},
	});
}

export function useUpdateProject() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (data: ProjectUpdateInput) => updateProject(data),
		onSuccess: (_data, variables) => {
			queryClient.invalidateQueries({ queryKey: projectKeys.lists() });
			queryClient.invalidateQueries({
				queryKey: projectKeys.detail(variables.project_id),
			});
		},
	});
}

export function useDeleteProject() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({
			projectId,
			confirmationName,
		}: {
			projectId: string;
			confirmationName: string;
		}) => softDeleteProject(projectId, confirmationName),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: projectKeys.lists() });
		},
	});
}

export function useAddProjectMember() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({
			projectId,
			profileId,
			roleName,
		}: {
			projectId: string;
			profileId: string;
			roleName: string;
		}) => addProjectMember(projectId, profileId, roleName),
		onSuccess: (_data, variables) => {
			queryClient.invalidateQueries({
				queryKey: projectKeys.members(variables.projectId),
			});
		},
	});
}

export function useRemoveProjectMember() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({
			projectId,
			profileId,
		}: {
			projectId: string;
			profileId: string;
		}) => removeProjectMember(projectId, profileId),
		onMutate: async ({ projectId, profileId }) => {
			await queryClient.cancelQueries({
				queryKey: projectKeys.members(projectId),
			});

			const previousMembers = queryClient.getQueryData(
				projectKeys.members(projectId),
			);

			queryClient.setQueryData(
				projectKeys.members(projectId),
				(old: unknown[] | undefined) => {
					if (!old) return old;
					return old.filter(
						(m: unknown) =>
							(m as { user_id: string }).user_id !== profileId,
					);
				},
			);

			return { previousMembers, projectId };
		},
		onError: (_err, _vars, context) => {
			if (context?.previousMembers) {
				queryClient.setQueryData(
					projectKeys.members(context.projectId),
					context.previousMembers,
				);
			}
		},
		onSettled: (_data, _error, variables) => {
			queryClient.invalidateQueries({
				queryKey: projectKeys.members(variables.projectId),
			});
		},
	});
}
