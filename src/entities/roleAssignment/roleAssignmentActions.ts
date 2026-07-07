"use server";
import { prisma } from "@/lib/prisma";

export async function getRoleAssignmentByProfileId(profileId: string){
    return await prisma.roleAssignments.findFirst({
        where: {
            user_id: profileId
        },
        include: {
          Users: true,
          Roles: true
        }
    })
}

export async function getRoleAssignmentByProfileProjectId(profileId: string, projectId: string){
    return await prisma.roleAssignments.findFirst({
        where: {
            user_id: profileId,
            project_id: projectId
        },
        include: {
          Users: true,
          Roles: true
        }
    })
}

export async function getClientByProjectId(projectId: string) {
  return prisma.roleAssignments.findFirst({
    where: {
      project_id: projectId,
      Roles: { name: 'Client Viewer' },
      Users: { is_deleted: false }
    },
    include: {
      Users: true,
      Roles: true
    }
  })
}

export async function getProjectOwnerByProjectId(projectId: string) {
  return prisma.roleAssignments.findFirst({
    where: {
      project_id: projectId,
      Roles: { name: 'Project Owner' },
      Users: { is_deleted: false }
    },
    include: {
      Users: true,
      Roles: true
    }
  })
}