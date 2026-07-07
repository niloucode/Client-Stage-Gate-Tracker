"use client";

import ContractViewer from "@/features/contracts/ui/ContractViewer";
import SignatoriesCard, {
	type Signatory,
} from "@/features/contracts/ui/SignatoriesCard";
import ExecuteAgreementCard from "@/features/contracts/ui/ExecuteAgreementCard";
import { ExecutedBanner } from "@/features/contracts/ui/ExecutedBanner";
import Sidebar from "@/shared/ui/sidebar";
import TopNav from "@/shared/ui/TopNav";
import { useContract } from "@/entities/contract";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/features/auth";
import {
	getClientByProjectId,
	getProjectOwnerByProjectId,
	getRoleAssignmentByProfileProjectId,
} from "@/entities/roleAssignment";

//UNCOMMENT THIS WHEN GOING BACK TO REGULAR
// export default function ContractPage({
//   params,
// }: {
//   params: { projectId: string };
// }) {

export default function ContractPage() {
	const [signatories, setSignatories] = useState<Signatory[]>([]);
	const [allSigned, setAllSigned] = useState(false);
	const [userRole, setUserRole] = useState<"Client Viewer" | "Project Owner">(
		"Client Viewer",
	);
	const searchParams = useSearchParams();
	const { user } = useAuth();

	//UNCOMMENT THIS WHEN GOING BACK TO REGULAR
	//const {projectId} = params
	const projectId = searchParams.get("projectId") ?? "";
	const { data: contract } = useContract(projectId || undefined);
	const clientId = contract?.client_id ?? searchParams.get("clientId") ?? "";

	// Fetch signatories when contract loads
	useEffect(() => {
		if (!contract || !projectId) return;
		get_signatories();
	}, [contract?.contract_id]); // runs when contract first loads

	useEffect(() => {
		if (!user) return;
		get_role();
	}, [user?.profile_id]);

	const get_role = async () => {
		try {
			if (user?.profile_id) {
				const user_role = await getRoleAssignmentByProfileProjectId(
					user?.profile_id,
					projectId,
				);

				if (
					user_role &&
					(user_role.Roles.name == "Client Viewer" ||
						user_role.Roles.name == "Project Owner")
				) {
					setUserRole(user_role.Roles.name);
				}
			}
		} catch (err) {
			console.error(err);
		}
	};

	const get_signatories = async () => {
		try {
			const temp: Signatory[] = [];

			// --- CLIENT SIGNATORY ---
			if (contract?.client_id) {
				const clientAssignment = await getClientByProjectId(projectId);

				if (clientAssignment?.Users) {
					const clientSigned = !!contract.client_signed_at;
					temp.push({
						id: "1",
						name: `${clientAssignment.Users.first_name} ${clientAssignment.Users.last_name}`,
						role: "Client Representative",
						status: clientSigned ? "signed" : "pending",
						timestamp: contract.client_signed_at?.toDateString(),
					});
				}
			}

			// --- PROJECT OWNER SIGNATORY ---
			const ownerAssignment = await getProjectOwnerByProjectId(projectId);

			if (ownerAssignment?.Users) {
				const ownerProfile = ownerAssignment.Users;
				const ownerSigned = !!contract?.project_owner_signed_at;
				temp.push({
					id: "2",
					name: `${ownerProfile.first_name} ${ownerProfile.last_name}`,
					role: "Project Owner",
					status: ownerSigned ? "signed" : "pending",
					timestamp: contract?.project_owner_signed_at?.toDateString(),
				});
			}

			setSignatories(temp);
			//check if all signatories have signed
			setAllSigned(temp.length > 0 && temp.every((s) => s.status === "signed"));
		} catch (err) {
			console.error("Failed to load signatories:", err);
		}
	};

	return (
		<Sidebar>
			<TopNav breadcrumbs={["Acesoft", "Project Alpha", "Project Structure"]} />
			<div className="min-h-screen bg-[#F6F5FB] px-4 py-6 sm:px-8 sm:py-10">
				<div className="mx-auto max-w-6xl">
					{allSigned && (
						<ExecutedBanner executedAt="2023-10-24" className="mb-6" />
					)}

					<header className="mb-6">
						<h1 className="text-xl font-semibold text-[#181724]">
							{contract?.contract_name ?? "Untitled contract"}{" "}
							{/* INPUT contract_name HERE */}
						</h1>
						<p className="text-sm text-[#6E6B82]">
							Review the document and complete signing below.
						</p>
					</header>

					<div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_380px]">
						<ContractViewer
							className="h-[80vh] min-h-[600px]"
							clientId={clientId}
							projectId={projectId}
							profileId={user?.profile_id ?? null}
							initialFilePath={contract?.file_path ?? null}
						/>

						<div className="flex flex-col gap-6">
							<SignatoriesCard signatories={signatories} />
							<ExecuteAgreementCard
								maskedEmail="a***@client.com"
								projectId={projectId}
								role={userRole ?? "Client Viewer"}
								onSigned={get_signatories}
							/>
						</div>
					</div>
				</div>
			</div>
		</Sidebar>
	);
}
