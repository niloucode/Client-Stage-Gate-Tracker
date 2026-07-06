"use client";

import ContractViewer from "@/features/contracts/ui/ContractViewer";
import SignatoriesCard, {
  type Signatory,
} from "@/features/contracts/ui/SignatoriesCard";
import ExecuteAgreementCard from "@/features/contracts/ui/ExecuteAgreementCard";
import { ExecutedBanner } from "@/features/contracts/ui/ExecutedBanner";
import Sidebar from '@/shared/ui/sidebar';
import TopNav from "@/shared/ui/TopNav";
import { getContractByProjectId } from "@/entities/contract";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Contract } from "@/entities/types";

const signatories: Signatory[] = [
  {
    id: "1",
    name: "John Smith",
    role: "Asceoft Director",
    status: "signed",
    timestamp: "Oct 24, 2023, 5:07 PM",
    device: "IPhone 16",
    location: "Ugong, Valenzuela City",
  },
  {
    id: "2",
    name: "Alex Mercer",
    role: "Client Representative",
    status: "pending",
  },
];

const allSigned = signatories.every((s) => s.status === "signed");

//UNCOMMENT THIS WHEN GOING BACK TO REGULAR
// export default function ContractPage({
//   params,
// }: {
//   params: { projectId: string };
// }) {

export default function ContractPage() {
  const [contract, setContract] = useState<Contract | null>(null)
  const searchParams = useSearchParams()

  //UNCOMMENT THIS WHEN GOING BACK TO REGULAR
  //const {projectId} = params 
  const projectId = searchParams.get('projectId') ?? ''
  const clientId = contract?.client_id ?? searchParams.get('clientId') ?? ''

  const get_contract = async () => {
    if (!projectId){
      return
    }
    getContractByProjectId(projectId).then(res => setContract(res ?? null))
  }

  useEffect(() => {
    get_contract()
    console.log(`Client Id: ${clientId}`)
    console.log(`Project Id: ${projectId}`)
  }, [projectId])
  

  return (
      <Sidebar>
        <TopNav breadcrumbs={["Acesoft", "Project Alpha", "Project Structure"]} />
    <div className="min-h-screen bg-[#F6F5FB] px-4 py-6 sm:px-8 sm:py-10">
      <div className="mx-auto max-w-6xl">
        {allSigned && (
          <ExecutedBanner
            executedAt="2023-10-24"
            className="mb-6"
          />
        )}

        <header className="mb-6">
          <h1 className="text-xl font-semibold text-[#181724]">
            {contract?.contract_name ?? 'Untitled contract'}
          </h1>
          <p className="text-sm text-[#6E6B82]">
            Review the document and complete signing below.
          </p>
        </header>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_380px]">
          <ContractViewer className="h-[80vh] min-h-[600px]" 
          clientId = {clientId}
          projectId = {projectId} setContract={setContract}
          initialFilePath = {contract?.file_path ?? null}/>

          <div className="flex flex-col gap-6">
            <SignatoriesCard signatories={signatories} />
            <ExecuteAgreementCard maskedEmail="a***@client.com" />
          </div>
        </div>
      </div>
    </div>
      </Sidebar>
  );
}
