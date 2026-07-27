"use client";

import { useState, useEffect } from "react";
import { SignatureUpload } from "./SignatureUpload";
import { OTPVerification } from "./OTPVerification";
import { useSignContract } from "@/entities/contract";

interface ExecuteAgreementCardProps {
	projectId: string;
	maskedEmail?: string;
	className?: string;
	role: "Client Viewer" | "Project Owner"; //pass from ContractPage
}

export function ExecuteAgreementCard({
	maskedEmail = "a***@client.com",
	className = "",
	role,
	projectId,
}: ExecuteAgreementCardProps) {
	const [signatureFile, setSignatureFile] = useState<File | null>(null);
	const [signed, setSigned] = useState(false);
	const signMutation = useSignContract();
	const [pendingSignature, setPendingSignature] = useState<{
		fullName: string;
		initials: string;
	} | null>(null);

	const handleSignatureAdopted = (fullName: string, initials: string) => {
		setPendingSignature({ fullName, initials });
	};

	const handleVerified = async () => {
		try {
			if (pendingSignature) {
				const result = await signMutation.mutateAsync({
					projectId,
					role,
					fullName: pendingSignature.fullName,
					initials: pendingSignature.initials,
				});
				if (result.success) {
					setSigned(true);
				} else {
					console.error(
						typeof result.error === "string"
							? result.error
							: "Failed to sign contract",
					);
				}
			}
		} catch (err) {
			console.error(err);
		}
	};

	if (signed) {
		return (
			<div className="rounded-2xl border border-[#E6E4F0] bg-white p-6 shadow-sm">
				<p className="text-sm font-medium text-[#15803D]">
					✓ You have signed this contract.
				</p>
			</div>
		);
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
				<SignatureUpload
					onSignatureChange={setSignatureFile}
					setSigned={setSigned}
					onSignatureAdopted={handleSignatureAdopted}
				/>

				{signatureFile && (
					<>
						<hr className="border-[#E6E4F0]" />

						<OTPVerification
							maskedEmail={maskedEmail}
							onVerified={handleVerified}
						/>
					</>
				)}
			</div>
		</div>
	);
}

export default ExecuteAgreementCard;
