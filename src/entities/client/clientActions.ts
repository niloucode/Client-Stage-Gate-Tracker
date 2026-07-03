'use server'

import { prisma } from "@/lib/prisma";
import { ClientType } from "@/shared/types";

export async function clientSelect(){
    return await prisma.clients.findFirst()
}

export async function clientSelectByID(clientID: string){
    return await prisma.clients.findFirst({
        where: {
            client_id: clientID
        }
    })
}

export async function clientSelectByName(clientName: string){
    return await prisma.clients.findFirst({
        where: {
            client_name: clientName
        }
    })
}

export async function clientSelectByTin(clientTin: string){
    return await prisma.clients.findFirst({
        where: {
            tin: clientTin
        }
    })
}

export async function clientSelectByAddress(clientAddress: string){
    return await prisma.clients.findFirst({
        where: {
            billing_address: clientAddress
        }
    })
}

export async function clientSelectByNameTin(clientName: string, clientTin: string){
    return await prisma.clients.findFirst({
        where: {
            client_name: clientName,
            tin: clientTin
        }
    })
}

export async function clientUpdate(client: ClientType){
    return await prisma.clients.update({
        where: {client_id: client.client_id},
        data:{
            client_name: client.client_name,
            tin: client.tin,
            billing_address: client.billing_address,
            is_deleted: client.is_deleted,
            deleted_at: client.deleted_at
        },
    })
}

export async function clientCreate(client: ClientType){
    return await prisma.clients.create({
        data: {
            client_name: client.client_name,
            tin: client.tin,
            billing_address: client.billing_address,
            deleted_at: client.deleted_at
        }
    })
}
