"use server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/adminClient";
import { prisma } from "@/lib/prisma";
import { contractSignedStart } from "@/shared/lib/scheduling/stageSchedule";
import {
	contractUploadSchema,
	contractApproveSchema,
} from "@/shared/schemas";
import { deriveInitials } from "@/shared/lib/contractRules";
import {
	getCurrentUserId,
	requireProjectOwner,
} from "@/lib/auth/projectAccess";

// ── UPLOAD ────────────────────────────────────────────────────────────────────

/**
 * Server-side PDF magic-byte check. A PDF starts with "%PDF-"
 * (0x25 0x50 0x44 0x46 0x2D). `File.type` is browser-supplied metadata and
 * cannot be trusted (Task 2.7).
 */
export async function isPdfFile(file: File): Promise<boolean> {
	const head = new Uint8Array(await file.slice(0, 5).arrayBuffer());
	return (
		head.length === 5 &&
		head[0] === 0x25 &&
		head[1] === 0x50 &&
		head[2] === 0x44 &&
		head[3] === 0x46 &&
		head[4] === 0x2d
	);
}

export async function uploadContract(formData: FormData) {
	const projectId = formData.get("projectId") as string;
	const file = formData.get("file") as File;
	const contractName = formData.get("contractName") as string;
	try {
		// Authorization: owner-only (2026-08-15 spec)
		const userId = await getCurrentUserId();
		if (!userId) return { success: false, error: "Authentication required." };
		if (!(await requireProjectOwner(projectId, userId))) {
			return {
				success: false,
				error: "Only the Project Owner can upload the contract.",
			};
		}

		const parsed = contractUploadSchema.safeParse({
			projectId,
			contractName,
		});
		if (!parsed.success) {
			return {
				success: false,
				error: parsed.error.issues.map((i) => i.message).join(" "),
			};
		}

		// Server-side file validation — never trust the client's accept attr
		// or the browser-reported MIME type. The contract flow is PDF-only
		// (see ContractViewer's accept attr and the .pdf storage path).
		const MAX_FILE_SIZE = 15 * 1024 * 1024; // 15 MB
		if (!file || file.size === 0) {
			return { success: false, error: "No file was provided." };
		}
		if (file.size > MAX_FILE_SIZE) {
			return { success: false, error: "File is too large (max 15 MB)." };
		}
		// Magic-byte sniffing: a PDF starts with "%PDF-" — `file.type` is
		// browser-supplied metadata and cannot be trusted (Task 2.7).
		if (!(await isPdfFile(file))) {
			return { success: false, error: "Only PDF files are allowed." };
		}

		const supabaseAdmin = createAdminClient();

		// The contract row always exists (created atomically with the project,
		// client_id NOT NULL — project rule). Restore it if it was soft-deleted.
		const existingContract = await prisma.contracts.findFirst({
			where: { project_id: projectId },
		});
		if (!existingContract) {
			return {
				success: false,
				error: "Contract not found for this project.",
			};
		}
		const updatedContract = await prisma.contracts.update({
			where: { contract_id: existingContract.contract_id },
			data: {
				is_deleted: false,
				deleted_at: null,
			},
		});

		const rawName =
			contractName.trim() === ""
				? updatedContract.contract_id
				: contractName.trim();
		// Storage paths must stay flat under <projectId>/ — strip slashes and
		// backslashes so every uploaded path matches the deleteContract guard.
		const fileName = rawName.replace(/[\\/]+/g, "-");
		const filePath = `${projectId}/${fileName}.pdf`;

		const { error: uploadError } = await supabaseAdmin.storage
			.from("contracts")
			.upload(filePath, file, {
				contentType: "application/pdf",
				upsert: true,
			});

		if (uploadError) {
			// Rollback: delete the Prisma record if it was just created
			if (!updatedContract.file_path) {
				await prisma.contracts.delete({
					where: { contract_id: updatedContract.contract_id },
				});
			}
			return { success: false, error: uploadError.message };
		}

		const finalContract = await prisma.contracts.update({
			where: { contract_id: updatedContract.contract_id },
			data: {
				file_path: filePath,
				contract_name: contractName.trim() || null,
				is_deleted: false,
				deleted_at: null,
			},
		});

		return { success: true, data: finalContract };
	} catch (error) {
		console.error("Failed to upload contract:", error);
		return {
			success: false,
			error:
				error instanceof Error ? error.message : "Failed to upload contract.",
		};
	}
}

// ── GET SIGNED URL ────────────────────────────────────────────────────────────

export async function getContractUrl(filePath: string) {
	try {
		if (!filePath) {
			return { success: false, error: "No file path provided." };
		}

		const supabase = await createClient();
		// getPublicUrl is synchronous in supabase-js v2 — no await (TS80007).
		const { data } = supabase.storage.from("contracts").getPublicUrl(filePath);

		if (!data?.publicUrl) {
			return { success: false, error: "Failed to generate public URL." };
		}

		return { success: true, data: data.publicUrl };
	} catch (error) {
		console.error("Failed to get contract URL:", error);
		return {
			success: false,
			error:
				error instanceof Error ? error.message : "Failed to get contract URL.",
		};
	}
}

// ── SOFT DELETE ───────────────────────────────────────────────────────────────
export async function deleteContract(projectId: string, filePath: string) {
	try {
		// Authorization: owner-only (2026-08-15 spec)
		const userId = await getCurrentUserId();
		if (!userId) return { success: false, error: "Authentication required." };
		if (!(await requireProjectOwner(projectId, userId))) {
			return {
				success: false,
				error: "Only the Project Owner can delete the contract.",
			};
		}

		// Bind the storage path to this project — never delete a path supplied
		// for a different project, and no `../` traversal. Escape projectId so
		// the interpolated regex stays anchored even for non-UUID ids.
		const escapedProjectId = projectId.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
		if (!new RegExp(`^${escapedProjectId}/[^/]+\\.pdf$`).test(filePath)) {
			return { success: false, error: "Invalid file path for this project." };
		}

		const adminSupabase = createAdminClient();

		const { error: storageError } = await adminSupabase.storage
			.from("contracts")
			.remove([filePath]);

		if (storageError) {
			return { success: false, error: storageError.message };
		}

		await prisma.contracts.update({
			where: { project_id: projectId },
			data: {
				deleted_at: new Date(),
				is_deleted: true,
				file_path: null,
				contract_name: null,
				client_signature: null,
				client_initials: null,
				client_signed_at: null,
				project_owner_signature: null,
				project_owner_initials: null,
				project_owner_signed_at: null,
			},
		});

		return { success: true };
	} catch (error) {
		console.error("Failed to delete contract:", error);
		return {
			success: false,
			error:
				error instanceof Error ? error.message : "Failed to delete contract.",
		};
	}
}

// ── FETCH ─────────────────────────────────────────────────────────────────────

export async function getContractByProjectId(projectId: string) {
	try {
		if (!projectId) {
			return { success: false, error: "No project ID provided." };
		}

		const contract = await prisma.contracts.findFirst({
			where: {
				project_id: projectId,
				is_deleted: false,
			},
			include: {
				Clients: { select: { client_name: true } },
			},
		});

		return { success: true, data: contract };
	} catch (error) {
		console.error("Failed to fetch contract:", error);
		return {
			success: false,
			error:
				error instanceof Error ? error.message : "Failed to fetch contract.",
		};
	}
}

// ── APPROVE (2026-08-15 spec: button-based dual approval) ────────────────────
// Both the Project Owner and the project's client must approve before the
// first stage may start. The signer's PROFILE name is recorded server-side
// (initials derived) — no typed signature, no client-supplied identity.

export async function approveContract(
	projectId: string,
	role: "client" | "owner",
) {
	try {
		const parsed = contractApproveSchema.safeParse({ projectId, role });
		if (!parsed.success) {
			return {
				success: false,
				error: parsed.error.issues.map((i) => i.message).join(" "),
			};
		}

		const userId = await getCurrentUserId();
		if (!userId) return { success: false, error: "Authentication required." };

		const profile = await prisma.profiles.findUnique({
			where: { profile_id: userId },
			select: { client_id: true, first_name: true, last_name: true },
		});
		if (!profile) return { success: false, error: "Profile not found." };

		// Spec 1 (project-structure): once BOTH parties have approved, the
		// first stage's actual start is the later of the two approval dates.
		// Everything below runs in ONE transaction that LOCKS the contract
		// row (SELECT … FOR UPDATE), so concurrent cross-party approvals
		// serialize: the second approver reads the first's committed
		// timestamp and its stage write lands last with the LATER date.
		// No idempotent early return — re-approving preserves the ORIGINAL
		// timestamp and recomputes the stage start from both committed
		// timestamps (self-healing if a stage write was ever missed).
		return await prisma.$transaction(async (tx) => {
			await tx.$queryRaw`
				SELECT "contract_id" FROM "public"."Contracts"
				WHERE "project_id" = ${projectId}::uuid
				FOR UPDATE
			`;

			const contract = await tx.contracts.findUnique({
				where: { project_id: projectId },
				select: {
					client_id: true,
					is_deleted: true,
					client_signed_at: true,
					project_owner_signed_at: true,
				},
			});
			if (!contract || contract.is_deleted) {
				throw new Error("Contract not found.");
			}

			// Authz: owner = Project Owner roleAssignment; client = the
			// contract's client company (profile.client_id === contract.client_id).
			if (role === "owner") {
				if (!(await requireProjectOwner(projectId, userId))) {
					throw new Error(
						"Only the Project Owner can approve the contract.",
					);
				}
			} else if (profile.client_id !== contract.client_id) {
				throw new Error(
					"Only the project's client can approve the contract.",
				);
			}

			const fullName = `${profile.first_name} ${profile.last_name}`.trim();
			const initials = deriveInitials(fullName);

			const updated = await tx.contracts.update({
				where: { project_id: projectId },
				data:
					role === "owner"
						? {
								project_owner_signature: fullName,
								project_owner_initials: initials,
								project_owner_signed_at:
									contract.project_owner_signed_at ?? new Date(),
							}
						: {
								client_signature: fullName,
								client_initials: initials,
								client_signed_at: contract.client_signed_at ?? new Date(),
							},
				select: {
					client_signed_at: true,
					project_owner_signed_at: true,
				},
			});

			const signedAt = contractSignedStart(
				updated.project_owner_signed_at,
				updated.client_signed_at,
			);
			if (signedAt) {
				await tx.stages.updateMany({
					where: {
						project_id: projectId,
						number: 1,
						is_deleted: false,
					},
					data: { actual_start_at: signedAt },
				});
			}

			return { success: true };
		});
	} catch (error) {
		console.error("Failed to approve contract:", error);
		return {
			success: false,
			error:
				error instanceof Error ? error.message : "Failed to approve contract.",
		};
	}
}

// ── DASHBOARD (MY CONTRACTS) ──────────────────────────────────────────────────

const PROJECT_OWNER_ROLE = "Project Owner";

export type ContractRow = Awaited<ReturnType<typeof getMyContracts>>[number];

/**
 * Contracts visible to the signed-in user on the landing dashboard,
 * self-scoped: client profiles get their own client's contracts; Project
 * Owners get contracts of projects they own; everyone else gets none.
 * The caller's own role decides the scope — a caller can never request
 * another client's or project's contracts.
 */
export async function getMyContracts() {
	const userId = await getCurrentUserId();
	if (!userId) return [];

	const profile = await prisma.profiles.findUnique({
		where: { profile_id: userId, is_deleted: false },
		select: { client_id: true },
	});
	if (!profile) return [];

	const where = profile.client_id
		? { client_id: profile.client_id, is_deleted: false }
		: {
				is_deleted: false,
				Projects: {
					RoleAssignments: {
						some: { user_id: userId, Roles: { name: PROJECT_OWNER_ROLE } },
					},
				},
			};

	return prisma.contracts.findMany({
		where,
		select: {
			contract_id: true,
			contract_name: true,
			project_id: true,
			client_signature: true,
			project_owner_signature: true,
			client_signed_at: true,
			project_owner_signed_at: true,
			Projects: { select: { name: true } },
		},
		orderBy: { Projects: { name: "asc" } },
	});
}
