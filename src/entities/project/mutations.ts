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

/**
 * Hook to create a new project.
 * Invalidates the project list on success.
 */
export function useCreateProject() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (data: ProjectCreateInput) => createProject(data),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: projectKeys.lists() });
		},
	});
}

/**
 * Hook to update an existing project.
 * Invalidates both the list and the specific project detail on success.
 */
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

/**
 * Hook to soft-delete a project.
 * Invalidates the project list on success.
 */
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

/**
 * Hook to add a member to a project.
 * Invalidates the project members list on success.
 */
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

/**
 * Hook to remove a member from a project.
 * Uses optimistic update: removes the row from cache immediately,
 * restores on error.
 */
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
			// Cancel any outgoing refetches
			await queryClient.cancelQueries({
				queryKey: projectKeys.members(projectId),
			});

			// Snapshot the current cache
			const previousMembers = queryClient.getQueryData(
				projectKeys.members(projectId),
			);

			// Optimistically remove the member from cache
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
			// Restore the previous cache state on error
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
