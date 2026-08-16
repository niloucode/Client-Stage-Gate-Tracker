"use client";

import { useEffect, useRef, useState } from "react";
import { CircleCheck, CheckCircle2, Clock3 } from "lucide-react";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
	CardFooter,
} from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import { useApproveContract } from "@/entities/contract";
import { ConfirmTextModal } from "./ConfirmTextModal";
import { useAuth } from "@/features/auth";

const CONFIRM_PHRASE = "Yes, I'm Sure";
const SIGNATURE_FONT = "'Great Vibes', cursive";

export type SignatoryStatus = "signed" | "pending";

export interface Signatory {
	id: string;
	name: string;
	signed_name: string | null;
	role: string;
	email: string;
	status: SignatoryStatus;
	timestamp?: string;
	location?: string;
	device?: string;
}

export interface ContractApprovalCardProps {
	projectId: string;
	/** Which party THIS user is: owner (roleAssignment) or client (contract client_id). */
	variant: "owner" | "client";
	/** Whether the OTHER party has already approved. */
	otherPartyApproved: boolean;
	/** Whether THIS user's side is already approved. */
	alreadyApproved: boolean;
	contractName: string;
	/** False when the project has no uploaded contract document — the
	 * approval UI is replaced by a notice (never gate on `contractName`,
	 * which carries a display fallback). */
	hasContract: boolean;
	signatories?: Signatory[];
	onSuccess: () => void;
	className?: string;
}

function initialsFor(name?: string) {
	if (!name) return "?";
	return (
		name
			.split(" ")
			.map((part) => part[0])
			.filter(Boolean)
			.slice(0, 2)
			.join("")
			.toUpperCase() || "?"
	);
}

function SignatureBox({ person }: { person: Signatory }) {
	const [imageSrc, setImageSrc] = useState<string | null>(null);
	const canvasRef = useRef<HTMLCanvasElement>(null);

	// Generate PNG from the signature text
	useEffect(() => {
		if (person.status !== "signed" || !person.signed_name) return;

		const canvas = canvasRef.current;
		if (!canvas) return;

		const ctx = canvas.getContext("2d");
		if (!ctx) return;

		const text = person.signed_name;
		const fontSize = 30;
		const font = `${fontSize}px ${SIGNATURE_FONT}`;

		const draw = () => {
			ctx.font = font;
			const metrics = ctx.measureText(text);
			const textWidth = metrics.width;
			const textHeight =
				metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent;

			// Set canvas size with some padding
			const paddingX = 16;
			const paddingY = 12;
			canvas.width = textWidth + paddingX * 2;
			canvas.height = textHeight + paddingY * 2;

			// Redraw after resize (because canvas clears)
			ctx.font = font;
			ctx.fillStyle = "#181724"; // text-ink color
			ctx.textBaseline = "middle";
			ctx.textAlign = "center";
			ctx.fillText(text, canvas.width / 2, canvas.height / 2);

			setImageSrc(canvas.toDataURL("image/png"));
		};

		if (!document.fonts) {
			draw();
			return;
		}

		// Race: the Great Vibes <link> in ContractPage is hoisted by React 19
		// and can be parsed AFTER this effect runs, so document.fonts.ready can
		// resolve before the face even exists — baking the cursive fallback into
		// the PNG. Wait for the specific face to be registered AND loaded
		// (document.fonts.load returns [] until the face exists) instead.
		let cancelled = false;

		const renderWhenFontReady = async () => {
			let attempts = 0;
			while (!cancelled) {
				try {
					const faces = await document.fonts.load(font);
					if (faces.length > 0) {
						draw();
						return;
					}
				} catch {
					// Face failed to load — keep retrying until the link parsed.
				}
				attempts += 1;
				if (attempts > 40) {
					draw(); // give up — better a fallback than no signature
					return;
				}
				await new Promise((resolve) => setTimeout(resolve, 50));
			}
		};
		void renderWhenFontReady();

		return () => {
			cancelled = true;
		};
	}, [person.status, person.signed_name]);

	if (person.status !== "signed" || !person.signed_name) return null;

	return (
		<div className="min-w-0 overflow-hidden flex justify-center items-center rounded-md border border-lavender-200 bg-neutral-surface px-6 py-4">
			{/* Hidden canvas used for rendering */}
			<canvas ref={canvasRef} className="hidden" />

			{imageSrc && (
				// eslint-disable-next-line @next/next/no-img-element -- canvas-generated data URL; not optimizable
				<img
					src={imageSrc}
					alt="Signature"
					className="max-w-full h-auto"
					style={{ margin: "0 auto", display: "block" }}
				/>
			)}
			{/* Fallback while image is being generated */}
			{!imageSrc && (
				<div className="text-center text-xs text-[#9C9AB0]">
					Generating signature…
				</div>
			)}
		</div>
	);
}

/**
 * 2026-08-15 spec: Combined signatory list and approval workflow.
 * Approved signatories show their details and signature; pending parties
 * only show a pending status indicator.
 * @returns The rendered approval card for the viewer's role.
 */
export function ContractApprovalCard({
	projectId,
	variant,
	otherPartyApproved,
	alreadyApproved,
	contractName,
	hasContract,
	signatories = [],
	onSuccess,
	className,
}: ContractApprovalCardProps) {
	const { user } = useAuth();
	const [confirmOpen, setConfirmOpen] = useState(false);
	const approveMutation = useApproveContract();

	const roleLabel = variant === "owner" ? "Project Owner" : "Client";
	const otherRoleLabel = variant === "owner" ? "Client" : "Project Owner";

	// Derive individual party approval states
	const clientApproved =
		variant === "client" ? alreadyApproved : otherPartyApproved;
	const ownerApproved =
		variant === "owner" ? alreadyApproved : otherPartyApproved;
	const bothApproved = clientApproved && ownerApproved;

	const handleApprove = async () => {
		return approveMutation.mutateAsync({ projectId, role: variant });
	};

	const handleApproved = () => {
		toast.add({
			title: "Contract Approved",
			description: `Your approval as the ${roleLabel} has been recorded.`,
			type: "success",
		});
		onSuccess();
	};

	const userName =
		user?.first_name && user?.last_name
			? `${user.first_name} ${user.last_name}`
			: user?.first_name || CONFIRM_PHRASE;

	// Build party entries: match from signatories or fallback to the two required parties
	const parties = (() => {
		if (signatories.length > 0) {
			return signatories.map((person) => {
				const roleLower = person.role?.toLowerCase() || "";
				const isRoleApproved = roleLower.includes("client")
					? clientApproved
					: roleLower.includes("owner")
						? ownerApproved
						: person.status === "signed";

				const isApproved = person.status === "signed" || isRoleApproved;

				return {
					id: person.id,
					role: person.role || "Signatory",
					name: person.name,
					timestamp: person.timestamp,
					isApproved,
					signatory: {
						...person,
						status: (isApproved ? "signed" : "pending") as SignatoryStatus,
						signed_name: person.signed_name || person.name,
					},
				};
			});
		}

		// Fallback when signatories array is empty: derive Client & Owner parties
		const clientSignatory = signatories.find((s) =>
			s.role?.toLowerCase().includes("client"),
		);
		const ownerSignatory = signatories.find((s) =>
			s.role?.toLowerCase().includes("owner"),
		);

		return [
			{
				id: clientSignatory?.id || "client-party",
				role: "Client",
				name:
					clientSignatory?.name ||
					(variant === "client" ? userName : "Client"),
				timestamp: clientSignatory?.timestamp,
				isApproved: clientApproved,
				signatory: {
					id: clientSignatory?.id || "client-party",
					name:
						clientSignatory?.name ||
						(variant === "client" ? userName : "Client"),
					signed_name:
						clientSignatory?.signed_name ||
						clientSignatory?.name ||
						(variant === "client" ? userName : null),
					role: "Client",
					email: clientSignatory?.email || "",
					status: (clientApproved ? "signed" : "pending") as SignatoryStatus,
					timestamp: clientSignatory?.timestamp,
				},
			},
			{
				id: ownerSignatory?.id || "owner-party",
				role: "Project Owner",
				name:
					ownerSignatory?.name ||
					(variant === "owner" ? userName : "Project Owner"),
				timestamp: ownerSignatory?.timestamp,
				isApproved: ownerApproved,
				signatory: {
					id: ownerSignatory?.id || "owner-party",
					name:
						ownerSignatory?.name ||
						(variant === "owner" ? userName : "Project Owner"),
					signed_name:
						ownerSignatory?.signed_name ||
						ownerSignatory?.name ||
						(variant === "owner" ? userName : null),
					role: "Project Owner",
					email: ownerSignatory?.email || "",
					status: (ownerApproved ? "signed" : "pending") as SignatoryStatus,
					timestamp: ownerSignatory?.timestamp,
				},
			},
		];
	})();

	return (
		<Card
			className={cn(
				className,
			)}
		>
			<CardHeader>
				<CardTitle>Approve Contract</CardTitle>
				<CardDescription>
					Both the Project Owner and the Client must approve before the project
					can begin.
				</CardDescription>
			</CardHeader>

			<CardContent>
				{hasContract?<>{/* Signatories / Approval Status List */}
					<div className="flex flex-col gap-3">
						{parties.map((party) => {
								return (
									<div
										key={party.id}
										className="flex flex-col gap-3 rounded-md border border-border bg-neutral-surface p-3.5"
									>
										<div className="flex items-center gap-3 w-full">
											<Avatar className="h-10 w-10">
												<AvatarFallback
													className="text-sm"
													style={{
														backgroundColor: "#EAEDFF",
														color: "#131B2E",
													}}
												>
													{initialsFor(party.name)}
												</AvatarFallback>
											</Avatar>

											<div className="min-w-0 flex-1">
												<p className="truncate text-sm text-foreground font-medium">
													{party.name}
												</p>
												<p className="truncate text-xs text-neutral-subtle-foreground">
													{party.role}
												</p>
												{party.timestamp && (
													<p className="mt-0.5 text-[11px] text-muted-foreground">
														Approved {party.timestamp}
													</p>
												)}
											</div>
											{
												party.isApproved ? 
												<div className="flex items-center gap-1.5 text-xs font-medium text-emerald-700">
													<CheckCircle2 className="h-4 w-4" />
													<span>Approved</span>
												</div>	:
												<div className="flex items-center gap-1.5 text-xs font-medium text-amber-700">
													<Clock3 className="h-4 w-4" />
													<span>Pending</span>
												</div>
											}
										</div>
										{party.signatory && <SignatureBox person={party.signatory} />}
									</div>
								)})
						}
					</div>

					{/* Outcome Banner or Action Button */}
					{bothApproved ? (
						<div className="flex items-center gap-2.5 rounded-md border border-emerald-200 bg-emerald-50 px-3.5 py-3 text-xs text-emerald-800">
							<CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
							<span>Both parties have approved.</span>
						</div>
					) : alreadyApproved ? (
						<div className="flex items-center gap-2.5 rounded-md border border-border bg-neutral-subtle px-3.5 py-3 text-xs text-muted-foreground">
							<Clock3 className="h-4 w-4 shrink-0 text-muted-foreground" />
							<span>You have approved. Awaiting {otherRoleLabel} approval.</span>
						</div>
					) : (
						<div className="space-y-3 pt-1">
							
						</div>
					)}
				</>:""}
			</CardContent>
			
			<CardFooter className="flex flex-col gap-2">
				{hasContract?
				<>
				<p className="text-muted-foreground">
					Please review the document and confirm your approval as the{" "}
					<span className="text-brand-600!">{roleLabel}</span>.
				</p>
				<Button
					onClick={() => setConfirmOpen(true)}
					className="w-full"
				>
					<CircleCheck/>
					Approve as {roleLabel}
				</Button>
				</>
				:
				<div className="w-full flex justify-center text-slate-600">
					This project does not have a uploaded contract file.
				</div>
				}
			</CardFooter>

			<ConfirmTextModal
				open={confirmOpen}
				onClose={() => setConfirmOpen(false)}
				noParamFunc={handleApprove}
				confirmPhrase={userName}
				displayText={`You are about to approve the contract "${contractName}" as the ${roleLabel}. To confirm your agreement, type your name below.`}
				displayTitle="Confirm Contract Approval"
				buttonText={`Approve as ${roleLabel}`}
				onSuccess={handleApproved}
			/>
		</Card>
	);
}