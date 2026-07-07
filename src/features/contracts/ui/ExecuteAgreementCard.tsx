"use client";

import { useState } from "react";
import { SignatureUpload } from "./SignatureUpload";
import { OTPVerification } from "./OTPVerification";
import { signContract } from "@/entities/contract";

interface ExecuteAgreementCardProps {
  projectId: string
  maskedEmail?: string;
  className?: string;
  role: 'Client Viewer' | 'Project Owner'  //pass from ContractPage
  onSigned?: () => void
}

export function ExecuteAgreementCard({
  maskedEmail = "a***@client.com",
  className = "",
  role, 
  projectId,
  onSigned
}: ExecuteAgreementCardProps) {
  const [, setSignatureFile] = useState<File | null>(null);
  const [signed, setSigned] = useState(false);

  const handleSignatureAdopted = async (fullName: string, initials: string) => {
    try {
        await signContract(projectId, role, fullName, initials)
        setSigned(true)
        onSigned?.()  // tell parent to refresh signatories
      } catch (err) {
        console.error(err)
      }
  }

  if (signed) {
    return (
      <div className="rounded-2xl border border-[#E6E4F0] bg-white p-6 shadow-sm">
        <p className="text-sm font-medium text-[#15803D]">✓ You have signed this contract.</p>
      </div>
    )
  }

  return (
    <div
      className={`rounded-2xl border border-[#E6E4F0] bg-white p-6 shadow-sm ${className}`}
    >
      <h2 className="mb-1 text-base font-semibold text-[#181724]">
        Execute Agreement
      </h2>
      <p className="mb-5 text-xs text-[#6E6B82]">
        Review the document and provide your signature to execute this
        agreement.
      </p>

      <div className="flex flex-col gap-5">
        <SignatureUpload onSignatureChange={setSignatureFile} setSigned={setSigned}/>

        <hr className="border-[#E6E4F0]" />

        <OTPVerification maskedEmail={maskedEmail} />
      </div>
    </div>
  );
}

export default ExecuteAgreementCard;
