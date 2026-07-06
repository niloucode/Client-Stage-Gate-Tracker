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