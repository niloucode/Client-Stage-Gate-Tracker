"use server";
import { prisma } from "@/lib/prisma";

export async function getRoleAssignmentByProfileId(profileId: string){
    return await prisma.roleAssignments.findFirst({
        where: {
            user_id: profileId
        }
    })
}

export async function getRoleAssignmentByProjectId(profileId: string){
    return await prisma.roleAssignments.findFirst({
        where: {
            user_id: profileId
        }
    })
}

export async function getClientByProjectId(projectId: string) {
  return prisma.roleAssignments.findFirst({
    where: {
      project_id: projectId,
      Roles: { name: 'Client Viewer' }
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
      Roles: { name: 'Project Owner' }
    },
    include: {
      Users: true,
      Roles: true
    }
  })
}