"use server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/adminClient";
import { prisma } from "@/lib/prisma";
import {
	contractUploadSchema,
	contractSignSchema,
	contractChangeNameSchema,
} from "@/shared/schemas";
import { assertProjectMember } from "@/lib/auth/projectAccess";

// ── UPLOAD ────────────────────────────────────────────────────────────────────

export async function uploadContract(formData: FormData) {
  const clientId = formData.get("clientId") as string;
  const projectId = formData.get("projectId") as string;
  const file = formData.get("file") as File;
  const contractName = formData.get("contractName") as string;
	try {
		// Authorization: caller must be a member of the project
		const auth = await assertProjectMember(projectId);
		if (!auth.ok) return { success: false, error: auth.error };

		const parsed = contractUploadSchema.safeParse({
			clientId,
			projectId,
			contractName,
		});
		if (!parsed.success) {
			return {
				success: false,
				error: parsed.error.flatten().fieldErrors,
			};
		}

		// Server-side file validation — never trust the client's accept attr.
		// The contract flow is PDF-only (see ContractViewer's accept attr and
		// the .pdf storage path).
		const MAX_FILE_SIZE = 15 * 1024 * 1024; // 15 MB
		const ACCEPTED_TYPES = ["application/pdf"];
		if (!file || file.size === 0) {
			return { success: false, error: "No file was provided." };
		}
		if (file.size > MAX_FILE_SIZE) {
			return { success: false, error: "File is too large (max 15 MB)." };
		}
		if (!ACCEPTED_TYPES.includes(file.type)) {
			return { success: false, error: "Only PDF files are allowed." };
		}

		const supabaseAdmin = createAdminClient();

		// Upsert — create or reset soft-delete on existing
		const updatedContract = await prisma.contracts.upsert({
			where: { project_id: projectId },
			update: {
				is_deleted: false,
				deleted_at: null,
			},
			create: {
				client_id: clientId,
				project_id: projectId,
			},
		});

		const rawName =
			contractName.trim() === "" ? updatedContract.contract_id : contractName.trim();
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
		const { data } = await supabase.storage
			.from("contracts")
			.getPublicUrl(filePath);

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
    // Authorization: caller must be a member of the project
    const auth = await assertProjectMember(projectId);
    if (!auth.ok) return { success: false, error: auth.error };

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
		deleted_at: new Date(), is_deleted: true , file_path: null, contract_name: null,
        client_signature: null, client_initials: null, client_signed_at: null,
        project_owner_signature: null, project_owner_initials: null, project_owner_signed_at: null
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

// ── CHANGE NAME ───────────────────────────────────────────────────────────────

export async function changeContractName(
	projectId: string,
	contractName: string,
) {
	try {
		const parsed = contractChangeNameSchema.safeParse({
			projectId,
			contractName,
		});
		if (!parsed.success) {
			return {
				success: false,
				error: parsed.error.flatten().fieldErrors,
			};
		}

		// Authorization: caller must be a member of the project
		const auth = await assertProjectMember(projectId);
		if (!auth.ok) return { success: false, error: auth.error };

		const updated = await prisma.contracts.update({
			where: { project_id: projectId },
			data: { contract_name: contractName },
		});

		return { success: true, data: updated };
	} catch (error) {
		console.error("Failed to change contract name:", error);
		return {
			success: false,
			error:
				error instanceof Error ? error.message : "Failed to rename contract.",
		};
	}
}

// ── SIGN ──────────────────────────────────────────────────────────────────────

export async function signContract(
	projectId: string,
	role: "Client Viewer" | "Project Owner",
	fullName: string,
	initials: string,
) {
	try {
		const parsed = contractSignSchema.safeParse({
			projectId,
			role,
			fullName,
			initials,
		});
		if (!parsed.success) {
			return {
				success: false,
				error: parsed.error.flatten().fieldErrors,
			};
		}

		const isClient = role === "Client Viewer";

		await prisma.contracts.update({
			where: { project_id: projectId },
			data: isClient
				? {
						client_signature: fullName,
						client_initials: initials,
						client_signed_at: new Date(),
					}
				: {
						project_owner_signature: fullName,
						project_owner_initials: initials,
						project_owner_signed_at: new Date(),
					},
		});

		return { success: true };
	} catch (error) {
		console.error("Failed to sign contract:", error);
		return {
			success: false,
			error:
				error instanceof Error ? error.message : "Failed to sign contract.",
		};
	}
}
