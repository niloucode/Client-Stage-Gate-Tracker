"use server";

import { prisma } from "@/lib/prisma";
import {
	clientSchema,
	clientCreateSchema,
	type ClientType,
	type ClientCreateType,
} from "@/shared/schemas";
import type { Clients } from "@/lib/generated/prisma";

type ClientMutationResult =
	{ success: true; data: Clients } | { success: false; error: string };

export async function clientSelectAll() {
	// No catch here: a thrown error lets React Query retry (cachePolicy
	// retry: 1) and surface isError instead of silently degrading to [].
	return prisma.clients.findMany({
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
				},
			},
		},
	});
}

export async function clientSelectByNameTin(
	clientName: string,
	clientTin: string,
) {
	try {
		return await prisma.clients.findFirst({
			where: {
				client_name: clientName,
				tin: clientTin,
			},
		});
	} catch (error) {
		console.error("Failed to fetch client:", error);
		return null;
	}
}

export async function clientCreate(
	client: ClientCreateType,
): Promise<ClientMutationResult> {
	try {
		// Validate before trusting the payload (schema lives in shared/schemas)
		clientCreateSchema.parse(client);

		const newClient = await prisma.clients.create({
			data: {
				client_name: client.client_name,
				tin: client.tin,
				billing_address: client.billing_address,
				email: client.email,
				phone: client.phone,
			},
		});
		return { success: true, data: newClient };
	} catch (error) {
		// Clients_tin_key is a global unique — surface the actionable case.
		if (
			error &&
			typeof error === "object" &&
			"code" in error &&
			error.code === "P2002"
		) {
			return {
				success: false,
				error: "A client with this TIN already exists.",
			};
		}
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
		if (
			error &&
			typeof error === "object" &&
			"code" in error &&
			error.code === "P2002"
		) {
			return {
				success: false,
				error: "A client with this TIN already exists.",
			};
		}
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
