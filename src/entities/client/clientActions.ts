"use server";

import { prisma } from "@/lib/prisma";
import {
	clientSchema,
	clientCreateSchema,
	type ClientType,
	type ClientCreateType,
} from "@/shared/schemas";
import type { Clients } from "@/lib/generated/prisma";
import { generateInviteCode, hashInviteCode } from "@/shared/lib/inviteCode";
import { getCurrentUserId } from "@/lib/auth/projectAccess";

type ClientMutationResult =
	| { success: true; data: Clients; inviteCode?: string }
	| { success: false; error: string };

/**
 * Owner-only gate for client management (create/update/rotate). Client
 * employees and Project Team members are rejected — only the Project Owner
 * department may mutate the client registry. The department is matched by
 * NAME (unique in the DB) so no UUIDs are hardcoded.
 * @returns `{ ok: true }` or `{ ok: false, error }`.
 */
async function requireProjectOwner(): Promise<
	{ ok: true } | { ok: false; error: string }
> {
	const userId = await getCurrentUserId();
	if (!userId) return { ok: false, error: "Authentication required." };
	const profile = await prisma.profiles.findUnique({
		where: { profile_id: userId },
		include: { Department: { select: { name: true } } },
	});
	if (
		!profile ||
		profile.client_id !== null ||
		profile.Department?.name !== "Project Owner"
	) {
		return {
			ok: false,
			error: "Only the project owner can manage clients.",
		};
	}
	return { ok: true };
}

/**
 * Staff-only gate for READ access to the client registry. Client employees
 * (and unauthenticated callers) must never receive the full client list.
 * @returns `{ ok: true }` or `{ ok: false, error }`.
 */
async function requireStaff(): Promise<
	{ ok: true } | { ok: false; error: string }
> {
	const userId = await getCurrentUserId();
	if (!userId) return { ok: false, error: "Authentication required." };
	const profile = await prisma.profiles.findUnique({
		where: { profile_id: userId },
		select: { client_id: true },
	});
	if (!profile || profile.client_id !== null) {
		return { ok: false, error: "Only staff can view clients." };
	}
	return { ok: true };
}

/**
 * Staff-only: the full client registry with member profiles.
 * @returns The result.
 */
export async function clientSelectAll() {
	// Staff-only: the registry (names, TINs, emails, billing) must never be
	// reachable by client profiles or unauthenticated callers. Throwing lets
	// React Query surface isError for legitimate staff consumers.
	const auth = await requireStaff();
	if (!auth.ok) throw new Error(auth.error);

	// No catch here: a thrown error lets React Query retry (cachePolicy
	// retry: 1) and surface isError instead of silently degrading to [].
	const clients = await prisma.clients.findMany({
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
	// The invite-code HASH must never leave the server: expose only whether
	// a code exists.
	return clients.map(({ invite_code_hash, ...client }) => ({
		...client,
		has_invite_code: invite_code_hash !== null,
	}));
}

/**
 * The signed-in user's OWN client row (for company lookups in the account
 * menu). Staff have no client — returns null. Client profiles get exactly
 * their own company, never the registry.
 * @returns The caller's client row, or null.
 */
export async function clientSelectOwn() {
	const userId = await getCurrentUserId();
	if (!userId) return null;
	const profile = await prisma.profiles.findUnique({
		where: { profile_id: userId },
		select: { client_id: true },
	});
	if (!profile?.client_id) return null;
	return prisma.clients.findUnique({
		where: { client_id: profile.client_id, is_deleted: false },
		select: { client_id: true, client_name: true },
	});
}

/**
 * Creates the Clients row with a freshly generated invite code, retrying on
 * the vanishingly rare hash collision (P2002 on invite_code_hash, ~2^-60).
 * Any other error propagates to the caller. The plain code is returned
 * exactly once — only its hash is persisted.
 * @param client - The validated client payload.
 * @returns The created row plus the plain invite code.
 */
async function createClientWithInviteCode(
	client: ClientCreateType,
): Promise<{ client: Clients; inviteCode: string }> {
	for (let attempt = 0; attempt < 3; attempt++) {
		const inviteCode = generateInviteCode();
		try {
			const newClient = await prisma.clients.create({
				data: {
					client_name: client.client_name,
					tin: client.tin,
					billing_address: client.billing_address,
					email: client.email,
					phone: client.phone,
					invite_code_hash: hashInviteCode(inviteCode),
				},
			});
			return { client: newClient, inviteCode };
		} catch (error) {
			const meta = (error as { code?: unknown; meta?: { target?: unknown } })
				.meta;
			const isCollision =
				error &&
				typeof error === "object" &&
				"code" in error &&
				error.code === "P2002" &&
				Array.isArray(meta?.target) &&
				(meta.target as string[]).includes("invite_code_hash");
			if (!isCollision) throw error;
		}
	}
	throw new Error("Could not allocate a unique invite code.");
}

/**
 * Owner-only: creates a client with a fresh invite code.
 * @param client
 * @returns The result.
 */
export async function clientCreate(
	client: ClientCreateType,
): Promise<ClientMutationResult> {
	try {
		// Owner-only: creating clients is a registry mutation.
		const auth = await requireProjectOwner();
		if (!auth.ok) return { success: false, error: auth.error };

		// Validate before trusting the payload (schema lives in shared/schemas)
		clientCreateSchema.parse(client);

		const { client: newClient, inviteCode } =
			await createClientWithInviteCode(client);
		return { success: true, data: newClient, inviteCode };
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

/**
 * Rotate a client's invite code (invalidates the old one). Returns the new
 * plain code exactly once. STAFF ONLY: client employees must never read or
 * rotate codes — the guard rejects any profile linked to a client.
 * @param clientId - The client whose code is rotated.
 * @returns The updated row plus the new plain code.
 */
export async function regenerateClientInviteCode(
	clientId: string,
): Promise<ClientMutationResult> {
	try {
		// Owner-only: rotating the code hands out access to the client's
		// employees — Project Team members must not see or rotate codes.
		const auth = await requireProjectOwner();
		if (!auth.ok) return { success: false, error: auth.error };

		const inviteCode = generateInviteCode();
		const updated = await prisma.clients.update({
			where: { client_id: clientId },
			data: { invite_code_hash: hashInviteCode(inviteCode) },
		});
		return { success: true, data: updated, inviteCode };
	} catch (error) {
		console.error("Failed to regenerate client invite code:", error);
		return { success: false, error: "Failed to regenerate invite code." };
	}
}

export type InviteResolution =
	| { success: true; client_id: string; client_name: string }
	| { success: false; error: string };

/**
 * Resolve an invitation code to its client. Used by the client signup form so
 * employees can join their company WITHOUT ever seeing the client list.
 * The code is compared case-insensitively via its HMAC hash.
 * @param code - The raw invite code.
 * @returns The client id + name, or a user-facing error.
 */
export async function resolveClientByInviteCode(
	code: string,
): Promise<InviteResolution> {
	if (!code.trim()) {
		return { success: false, error: "Enter your invite code." };
	}
	try {
		const client = await prisma.clients.findUnique({
			where: { invite_code_hash: hashInviteCode(code) },
			select: { client_id: true, client_name: true, is_deleted: true },
		});
		if (!client || client.is_deleted) {
			return {
				success: false,
				error:
					"Invalid invite code. Ask your project owner for the current code.",
			};
		}
		return {
			success: true,
			client_id: client.client_id,
			client_name: client.client_name,
		};
	} catch (error) {
		console.error("Failed to resolve invite code:", error);
		return { success: false, error: "Invalid invite code." };
	}
}

/**
 * Owner-only: updates client registry fields.
 * @param client
 * @returns The result.
 */
export async function clientUpdate(
	client: ClientType,
): Promise<ClientMutationResult> {
	try {
		// Owner-only: editing clients is a registry mutation.
		const auth = await requireProjectOwner();
		if (!auth.ok) return { success: false, error: auth.error };

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
