'use server'

import { prisma } from "@/lib/prisma";
import { clientSchema, type ClientType } from "@/shared/schemas";
import type { Clients } from "@/lib/generated/prisma";

export type ClientMutationResult =
	| { success: true; data: Clients }
	| { success: false; error: string };

export async function clientSelectAll(){
    try {
        return await prisma.clients.findMany({
            where: { is_deleted: false },
            orderBy: { client_name: "asc" },
            include: {
                Profiles: {
                    where: { is_deleted: false },
                    select: {
                        profile_id: true,
                        first_name: true,
                        last_name: true,
                        email: true,
                        phone: true,
                    }
                }
            },
        })
    } catch (error) {
        console.error("Failed to fetch clients:", error);
        return [];
    }
}

export async function clientSelectByNameTin(clientName: string, clientTin: string){
    try {
        return await prisma.clients.findFirst({
            where: {
                client_name: clientName,
                tin: clientTin,
            }
        })
    } catch (error) {
        console.error("Failed to fetch client:", error);
        return null;
    }
}

export async function clientCreate(
	client: ClientType,
): Promise<ClientMutationResult> {
    try {
        // Validate before trusting the payload (schema lives in shared/schemas)
        clientSchema.omit({ client_id: true }).parse(client);

        const newClient = await prisma.clients.create({
            data: {
                client_name: client.client_name,
                tin: client.tin,
                billing_address: client.billing_address,
                email: client.email,
                phone: client.phone,
            }
        });
        return { success: true, data: newClient };
    } catch (error) {
        console.error("Failed to create client:", error);
        return { success: false, error: "Failed to create client." };
    }
}

export async function clientUpdate(
	client: ClientType,
): Promise<ClientMutationResult> {
    try {
        clientSchema.parse(client);

        const updated = await prisma.clients.update({
            where: { client_id: client.client_id },
            data: {
                client_name: client.client_name,
                tin: client.tin,
                billing_address: client.billing_address,
                email: client.email,
                phone: client.phone,
            },
        });
        return { success: true, data: updated };
    } catch (error) {
        console.error("Failed to update client:", error);
        return { success: false, error: "Failed to update client." };
    }
}

export async function clientDeleteByID(
	clientID: string,
): Promise<ClientMutationResult> {
    try {
        // Soft delete, matching every other domain entity
        const deleted = await prisma.clients.update({
            where: { client_id: clientID },
            data: { is_deleted: true, deleted_at: new Date() },
        });
        return { success: true, data: deleted };
    } catch (error) {
        console.error("Failed to delete client:", error);
        return { success: false, error: "Failed to delete the client." };
    }
}
