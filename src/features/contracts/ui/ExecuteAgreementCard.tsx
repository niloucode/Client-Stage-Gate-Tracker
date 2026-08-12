"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
	maskedEmail,
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
			<div className="rounded-2xl border border-lavender-100 bg-neutral-surface p-6 shadow-sm">
				<p className="text-sm font-medium text-green-700">
					✓ You have signed this contract.
				</p>
			</div>
		);
	}

	return (
		<Card className={className}>
			<CardHeader className="gap-5">
				<CardTitle>Execute Agreement</CardTitle>
				<CardDescription className="text-[#464555]">
					By signing this contract, you acknowledge that your electronic signature will be applied to the document and that you agree to its terms.
				</CardDescription>
			</CardHeader>
			<CardContent>
				<div className="flex flex-col gap-5">
					<SignatureUpload
						onSignatureChange={setSignatureFile}
						setSigned={setSigned}
						onSignatureAdopted={handleSignatureAdopted}
					/>

					{signatureFile && (
						<>
							<hr className="border-lavender-100" />

							<OTPVerification
								maskedEmail={maskedEmail}
								onVerified={handleVerified}
							/>
						</>
					)}
				</div>
			</CardContent>
		</Card>
	);
}

export default ExecuteAgreementCard;
