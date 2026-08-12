"use server";
import { prisma } from "@/lib/prisma";

export async function getRoleAssignmentByProfileId(profileId: string) {
	return await prisma.roleAssignments.findFirst({
		where: {
			user_id: profileId,
		},
		include: {
			Profile: true,
			Roles: true,
		},
	});
}

export async function getRoleAssignmentByProfileProjectId(
	profileId: string,
	projectId: string,
) {
	return await prisma.roleAssignments.findFirst({
		where: {
			user_id: profileId,
			project_id: projectId,
		},
		include: {
			Profile: true,
			Roles: true,
		},
	});
}

export async function getClientByProjectId(projectId: string) {
	return await prisma.roleAssignments.findFirst({
		where: {
			project_id: projectId,
			Roles: { name: "Client Viewer" },
			Profile: { is_deleted: false },
		},
		include: {
			Profile: true,
			Roles: true,
		},
	});
}

export async function getProjectOwnerByProjectId(projectId: string) {
	return await prisma.roleAssignments.findFirst({
		where: {
			project_id: projectId,
			Roles: { name: "Project Owner" },
			Profile: { is_deleted: false },
		},
		include: {
			Profile: true,
			Roles: true,
		},
	});
}

export async function createClientRoleAssignment(
	profileId: string,
	projectId: string,
) {
	//get the role id for Client Viewer
	const clientRole = await prisma.roles.findFirst({
		where: {
			name: "Client Viewer",
		},
	});

	//error check
	if (!clientRole?.role_id) return;

	//insert into RoleAssignments table
	await prisma.roleAssignments.create({
		data: {
			role_id: clientRole.role_id,
			user_id: profileId,
			project_id: projectId,
		},
	});
}

export async function updateClientRoleAssignment(
	profileId: string,
	projectId: string,
) {
	//get the role id for Client Viewer
	const clientRole = await prisma.roles.findFirst({
		where: {
			name: "Client Viewer",
		},
	});

	//error check
	if (!clientRole?.role_id) return;

	//insert into RoleAssignments table
	await prisma.roleAssignments.update({
		where: {
			role_id_user_id_project_id: {
				role_id: clientRole.role_id,
				user_id: profileId,
				project_id: projectId,
			},
		},
		data: {
			user_id: profileId,
		},
	});
}

export async function deleteClientRoleAssignment(
	profileId: string,
	projectId: string,
) {
	//get the role id for Client Viewer
	const clientRole = await prisma.roles.findFirst({
		where: {
			name: "Client Viewer",
		},
	});

	//error check
	if (!clientRole?.role_id) return;

	//insert into RoleAssignments table
	await prisma.roleAssignments.delete({
		where: {
			role_id_user_id_project_id: {
				role_id: clientRole.role_id,
				user_id: profileId,
				project_id: projectId,
			},
		},
	});
}
