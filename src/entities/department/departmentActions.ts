'use server'

import { prisma } from "@/lib/prisma";

export async function departmentSelect(){
    return await prisma.department.findMany()
}

export async function departmentSelectByName(deptName: string){
    return await prisma.department.findFirst({
        where: {
            name: deptName
        }
    })
}

export async function getDepartmentById(departmentId?: string) {
  if (!departmentId) return null;

  try {
    return await prisma.department.findUnique({
      where: {
        department_id: departmentId,
      },
      select: {
        department_id: true,
        name: true, // Direct property on the departments table
      },
    });
  } catch (error) {
    console.error("Failed to fetch department:", error);
    return null; // Return null instead of [] on error
  }
}