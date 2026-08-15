"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import ContractViewer from "@/features/contracts/ui/ContractViewer";
import SignatoriesCard, {
  type Signatory,
} from "@/features/contracts/ui/SignatoriesCard";
import ExecuteAgreementCard from "@/features/contracts/ui/ExecuteAgreementCard";
import { useContract } from "@/entities/contract";
import { useAuth } from "@/features/auth";
import { getProfilesByClientId } from "@/entities/profile";
import {
  getClientByProjectId,
  getProjectOwnerByProjectId,
  getRoleAssignmentByProfileProjectId,
} from "@/entities/roleAssignment";
import { Back } from "@/components/ui/back";
import { ClientOption } from "@/features/contracts/ui/ClientsDropdown";

export default function ContractPage() {
  const params = useParams<{ projectId: string }>();
  const projectId = params?.projectId ?? "";

  const [signatories, setSignatories] = useState<Signatory[]>([]);
  const [allSigned, setAllSigned] = useState(false);
  const [canSign, setCanSign] = useState<boolean | null>(null);
  const [hasClient, setHasClient] = useState(false);
  const [clients, setClients] = useState<ClientOption[] | undefined>(undefined);
  const [clientSigned, setClientSigned] = useState(false);
  const [userRole, setUserRole] = useState<"Client Viewer" | "Project Owner">(
    "Client Viewer"
  );
  
  const { user } = useAuth();
  const GOOGLE_FONTS_HREF =
    "https://fonts.googleapis.com/css2?family=Great+Vibes&display=swap";

  const {
    data: contract,
    isLoading,
    error,
  } = useContract(projectId || undefined);

  const clientId = contract?.client_id ?? "";
  const userSigned =
    userRole === "Client Viewer"
      ? contract?.client_signed_at != null
      : contract?.project_owner_signed_at != null;

  // 1. Fetch user role on mount/user change
  useEffect(() => {
    if (!user?.profile_id || !projectId) return;
    void get_role();
  }, [user?.profile_id, projectId]);

  // 2. Fetch signatories and clients when contract loads or signing updates
  useEffect(() => {
    if (!contract || !projectId) return;
    void get_signatories();
    void get_clients();
  }, [
    user?.profile_id,
    projectId,
    contract?.contract_id,
    contract?.client_signed_at,
    contract?.project_owner_signed_at,
  ]);

  function get_masked_email(email: string) {
    const res = email.split("@");
    if (res.length < 2) return email;
    const masked =
      res[0][0] +
      "*".repeat(Math.max(res[0].length - 2, 1)) +
      res[0][res[0].length - 1] +
      "@" +
      res[1];
    return masked;
  }

  const get_role = async () => {
    try {
      if (user?.profile_id && projectId) {
        const user_role = await getRoleAssignmentByProfileProjectId(
          user.profile_id,
          projectId
        );

        if (
          user_role &&
          (user_role.Roles.name === "Client Viewer" ||
            user_role.Roles.name === "Project Owner")
        ) {
          setUserRole(user_role.Roles.name);
        }
      }
    } catch (err) {
      console.error("Failed to load user role:", err);
    }
  };

  const get_signatories = async () => {
    try {
      const temp: Signatory[] = [];
      let localCanSign = false;

      const ownerAssignment = await getProjectOwnerByProjectId(projectId);
      if (ownerAssignment?.Profile) {
        const ownerProfile = ownerAssignment.Profile;
        const ownerSigned = !!contract?.project_owner_signed_at;
        localCanSign = user?.profile_id === ownerProfile.profile_id;
        temp.push({
          id: ownerProfile.profile_id,
          email: ownerProfile.email,
          name: `${ownerProfile.first_name} ${ownerProfile.last_name}`,
          signed_name: contract?.project_owner_signature ?? null,
          role: "Project Owner",
          status: ownerSigned ? "signed" : "pending",
          timestamp: contract?.project_owner_signed_at?.toDateString(),
        });
      }

      if (contract?.client_id) {
        const clientAssignment = await getClientByProjectId(projectId);
        if (clientAssignment?.Profile) {
          const clientSigned = !!contract.client_signed_at;
          setHasClient(true);
          setClientSigned(clientSigned);
          if (!localCanSign) {
            localCanSign =
              user?.profile_id === clientAssignment.Profile.profile_id;
          }
          temp.push({
            id: clientAssignment.Profile.profile_id,
            email: clientAssignment.Profile.email,
            name: `${clientAssignment.Profile.first_name} ${clientAssignment.Profile.last_name}`,
            signed_name: contract?.client_signature ?? null,
            role: "Client",
            status: clientSigned ? "signed" : "pending",
            timestamp: contract.client_signed_at?.toDateString(),
          });
        } else {
          setHasClient(false);
        }
      } else {
        setHasClient(false);
      }

      setSignatories(temp);
      const check =
        temp.length > 0 && temp.every((s) => s.status.trim() === "signed");
      setAllSigned(check);
      setCanSign(localCanSign);
    } catch (err) {
      console.error("Failed to load signatories:", err);
      setCanSign(false);
    }
  };

  const get_client_state = () => {
    if (!hasClient) return "no_client";
    if (hasClient && !clientSigned) return "client_decided";
    return "client_signed";
  };

  const get_clients = async () => {
    if (!clientId) return;
    const result = await getProfilesByClientId(clientId);
    if (result.data) {
      const temp: ClientOption[] = [];
      for (let i = 0; i < result.data.length; i++) {
        temp.push({
          id: result.data[i].profile_id,
          name: `${result.data[i].first_name} ${result.data[i].last_name}`,
          email: result.data[i].email,
        });
      }
      setClients(temp);
    } else {
      setClients(undefined);
    }
  };

  if (!projectId) {
    return <div className="p-8 text-destructive">Project ID missing from URL.</div>;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F6F5FB] px-4 py-6 sm:px-8 sm:py-10">
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
      <div className="min-h-screen bg-[#F6F5FB] px-4 py-6 sm:px-8 sm:py-10">
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

  return (
    <>
      <link rel="stylesheet" href={GOOGLE_FONTS_HREF} />
      <div className="mx-auto max-w-6xl space-y-6">
        <Back link={`/projects/${projectId}`} />

        <header>
          <h1 className="text-xl font-semibold text-ink">
            {contract?.contract_name ?? "Untitled Contract"}
          </h1>
          <p className="text-sm text-plum-400">
            Review the document and complete signing below.
          </p>
        </header>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_380px]">
          <ContractViewer
            contractDetails={{
              id: projectId,
              name: contract?.contract_name ?? "Untitled contract",
            }}
            className="h-[80vh] min-h-[600px] py-0 bg-[#F9F9F7]"
            clientId={clientId}
            projectId={projectId}
            profileId={user?.profile_id ?? null}
            initialFilePath={contract?.file_path ?? null}
            initialContractName={contract?.contract_name ?? null}
            onSuccess={() => {
              void get_signatories();
              void get_clients();
            }}
          />

          <div className="flex flex-col gap-6">
            <SignatoriesCard
              signatories={signatories}
              clientState={get_client_state()}
              availableClients={clients}
              contractDetails={{
                id: projectId,
                name: contract?.contract_name ?? "Untitled contract",
              }}
              onSuccess={() => {
                void get_signatories();
                void get_clients();
              }}
            />
            {!userSigned && contract && canSign === true && (
              <ExecuteAgreementCard
                maskedEmail={user ? get_masked_email(user.email) : undefined}
                projectId={projectId}
                role={userRole}
              />
            )}
          </div>
        </div>
      </div>
    </>
  );
}