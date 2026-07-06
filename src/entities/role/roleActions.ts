"use server";
import { prisma } from "@/lib/prisma";

export async function getRoleNameById(roleId: string){
    return await prisma.roles.findFirst({
        where:{
            role_id: roleId
        }
    })

}