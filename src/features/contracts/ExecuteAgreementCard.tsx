"use client";

import { useState } from "react";
import { SignatureUpload } from "./SignatureUpload";
import { OTPVerification } from "./OTPVerification";

interface ExecuteAgreementCardProps {
  maskedEmail?: string;
  className?: string;
}

export function ExecuteAgreementCard({
  maskedEmail = "a***@client.com",
  className = "",
}: ExecuteAgreementCardProps) {
  const [, setSignatureFile] = useState<File | null>(null);

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
        <SignatureUpload onSignatureChange={setSignatureFile} />

        <hr className="border-[#E6E4F0]" />

        <OTPVerification maskedEmail={maskedEmail} />
      </div>
    </div>
  );
}

export default ExecuteAgreementCard;
