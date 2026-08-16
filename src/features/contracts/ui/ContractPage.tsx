"use client";

import { useCallback, useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useContract } from "@/entities/contract";
import { contractKeys } from "@/shared/query/keys";
import { useCurrentUser } from "@/entities/profile/queries";
import { getProjectOwnerByProjectId } from "@/entities/roleAssignment";
import { contractSignedStart } from "@/shared/lib/scheduling/stageSchedule";
import { Back } from "@/components/ui/back";
import { ContractViewer } from "./ContractViewer";
import { SignatoriesCard, type Signatory } from "./SignatoriesCard";
import { ContractApprovalCard } from "@/features/contracts";
import { ExecutedBanner } from "./ExecutedBanner";

export interface ContractPageProps {
	projectId: string;
}

/**
 * 2026-08-15 spec:
 * - Only the Project Owner and the project's client (contract client_id) can
 *   approve the contract — via a button (no OTP/signature file flow).
 * - Owners see their own approval button + the client's status; clients see
 *   their own button + the owner's status; team members see neither, only
 *   both statuses (via the signatories list).
 * - Both approvals unlock the first stage's actual start (server-side).
 * - Only the Project Owner manages the contract document (upload/delete).
 */
export function ContractPage({ projectId }: ContractPageProps) {
	const { data: contract, isLoading, error } = useContract(projectId);
	const { data: profile } = useCurrentUser();
	const queryClient = useQueryClient();

	const [signatories, setSignatories] = useState<Signatory[]>([]);

	const refresh = useCallback(() => {
		void queryClient.invalidateQueries({
			queryKey: contractKeys.detail(projectId),
		});
	}, [queryClient, projectId]);

	const isOwner = useCallback(async () => {
		const ownerAssignment = await getProjectOwnerByProjectId(projectId);
		return (
			!!ownerAssignment?.Profile &&
			ownerAssignment.Profile.profile_id === profile?.profile_id
		);
	}, [projectId, profile?.profile_id]);

	// Derive the viewer's role from the server side of things:
	// owner (roleAssignment) or client signer (contract client_id match).
	const [role, setRole] = useState<"owner" | "client" | null>(null);

	useEffect(() => {
		if (!profile?.profile_id || !contract) return;
		void (async () => {
			if (await isOwner()) {
				setRole("owner");
				return;
			}
			if (
				profile.client_id &&
				contract.client_id &&
				profile.client_id === contract.client_id
			) {
				setRole("client");
				return;
			}
			setRole(null);
		})();
	}, [profile, contract, isOwner]);

	// Signatories: Project Owner + the client company (contract client_id).
	useEffect(() => {
		if (!contract || !projectId) return;
		void (async () => {
			try {
				const temp: Signatory[] = [];

				const ownerAssignment = await getProjectOwnerByProjectId(projectId);
				if (ownerAssignment?.Profile) {
					const ownerProfile = ownerAssignment.Profile;
					temp.push({
						id: ownerProfile.profile_id,
						email: ownerProfile.email,
						name: `${ownerProfile.first_name} ${ownerProfile.last_name}`,
						signed_name: contract.project_owner_signature ?? null,
						role: "Project Owner",
						status: contract.project_owner_signed_at ? "signed" : "pending",
						timestamp: contract.project_owner_signed_at?.toDateString(),
					});
				}

				temp.push({
					id: contract.client_id,
					email: "",
					name: contract.Clients?.client_name ?? "Client",
					signed_name: contract.client_signature ?? null,
					role: "Client",
					status: contract.client_signed_at ? "signed" : "pending",
					timestamp: contract.client_signed_at?.toDateString(),
				});

				setSignatories(temp);
			} catch (err) {
				console.error("Failed to load signatories:", err);
				setSignatories([]);
			}
		})();
	}, [projectId, contract]);

	const allSigned =
		signatories.length > 0 && signatories.every((s) => s.status === "signed");

	const executedAt =
		contract && contract.project_owner_signed_at && contract.client_signed_at
			? contractSignedStart(
					contract.project_owner_signed_at,
					contract.client_signed_at,
				)
			: null;

	if (isLoading) {
		return (
			<div className="min-h-screen sm:px-8 sm:py-10">
				<div className="mx-auto max-w-6xl">
					<div className="flex items-center justify-center py-20">
						<p className="text-muted-foreground">Loading contract...</p>
					</div>
				</div>
			</div>
		);
	}

	if (error) {
		return (
			<div className="min-h-screen sm:px-8 sm:py-10">
				<div className="mx-auto max-w-6xl">
					<div className="flex items-center justify-center py-20">
						<p className="text-destructive">
							Failed to load contract. Please try again.
						</p>
					</div>
				</div>
			</div>
		);
	}

	const contractName = contract?.contract_name ?? "Untitled Contract";
	const otherPartyApproved =
		role === "owner"
			? !!contract?.client_signed_at
			: !!contract?.project_owner_signed_at;
	const alreadyApproved =
		role === "owner"
			? !!contract?.project_owner_signed_at
			: !!contract?.client_signed_at;

	return (
		<>
			{/* The cursive signature canvas uses Great Vibes — React 19 hoists
			    stylesheet links rendered in client components. Raw <link> is the
			    project's established font-loading pattern. */}
			{/* eslint-disable-next-line @next/next/no-page-custom-font */}
			<link
				rel="stylesheet"
				href="https://fonts.googleapis.com/css2?family=Great+Vibes&display=swap"
			/>
			<div className="mx-auto max-w-6xl space-y-6">
				<Back link={`/projects/${projectId}`} />

				<header>
					<h1 className="text-xl font-semibold text-ink">{contractName}</h1>
					<p className="text-sm text-plum-400">
						Review the document and complete approval below.
					</p>
				</header>

				<div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_380px]">
					<ContractViewer
						className="h-fit py-0 bg-[#F9F9F7]"
						projectId={projectId}
						canManage={role === "owner"}
						initialFilePath={contract?.file_path ?? null}
						initialContractName={contract?.contract_name ?? null}
						onSuccess={refresh}
					/>

					<div className="flex flex-col gap-6">
						{allSigned && executedAt && (
							<ExecutedBanner executedAt={executedAt} />
						)}
						<SignatoriesCard signatories={signatories} />

						{role && (
							<ContractApprovalCard
								projectId={projectId}
								variant={role}
								otherPartyApproved={otherPartyApproved}
								alreadyApproved={alreadyApproved}
								contractName={contractName}
								onSuccess={refresh}
							/>
						)}
					</div>
				</div>
			</div>
		</>
	);
}
