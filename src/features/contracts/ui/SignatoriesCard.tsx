"use client";

import { useState, useEffect, useRef } from "react";
import { CheckCircle2, Clock3 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ClientsDropdown, type ClientOption } from "./ClientsDropdown";
import {
	createClientRoleAssignment,
	deleteClientRoleAssignment,
} from "@/entities/roleAssignment";
import { ConfirmTextModal, ContractDetails } from "./ConfirmTextModal";

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

export type ClientSignatoryState =
	| "no_client" // client not yet selected — show dropdown (disabled confirm)
	| "client_decided" // client confirmed — show "Change" link
	| "client_signed"; // both signed — show signature box

interface SignatoriesCardProps {
	signatories: Signatory[];
	className?: string;
	// Client management
	clientState?: ClientSignatoryState;
	availableClients?: ClientOption[];
	// selectedClient?: ClientOption | null;
	// onChangeClient?: () => void;
	contractDetails: ContractDetails;
	onSuccess: () => void;
}

function initialsFor(name: string) {
	return name
		.split(" ")
		.map((part) => part[0])
		.filter(Boolean)
		.slice(0, 2)
		.join("")
		.toUpperCase();
}

function SignatoryRow({ person, index }: { person: Signatory; index: number }) {
	const isSigned = person.status === "signed";

	return (
		<div className="flex items-start gap-3 w-full">
			<Avatar className="h-10 w-10">
				<AvatarFallback
					className="text-sm "
					style={{ backgroundColor: "#EAEDFF", color: "#131B2E" }}
				>
					{initialsFor(person.name)}
				</AvatarFallback>
			</Avatar>

			<div className="min-w-0 flex-1">
				<p className="truncate text-sm  text-[#181724]">
					{person.name}
				</p>
				<p className="truncate text-xs text-[#6E6B82]">{person.role}</p>
				{isSigned && person.timestamp && (
					<p className="mt-0.5 text-[11px] text-[#9C9AB0]">
						Signed {person.timestamp}
					</p>
				)}
			</div>

			<span
				className={`flex shrink-0 items-center gap-1 rounded-full px-2 py-1 text-[11px]  ${
					isSigned
						? "bg-[#ECFDF3] text-[#15803D]"
						: "bg-[#FFFBEB] text-[#B45309]"
				}`}
			>
				{isSigned ? (
					<CheckCircle2 className="h-3 w-3" />
				) : (
					<Clock3 className="h-3 w-3" />
				)}
				{isSigned ? "Signed" : "Pending"}
			</span>
		</div>
	);
}

function SignatureBox({ person }: { person: Signatory }) {
	const [imageSrc, setImageSrc] = useState<string | null>(null);
	const canvasRef = useRef<HTMLCanvasElement>(null);

	const currentStyle = {
		id: "great-vibes",
		label: "Style 1",
		font: "'Great Vibes', cursive",
	};

	// Generate PNG from the signature text
	useEffect(() => {
		if (person.status !== "signed" || !person.signed_name) return;

		const canvas = canvasRef.current;
		if (!canvas) return;

		const ctx = canvas.getContext("2d");
		if (!ctx) return;

		const text = person.signed_name;
		const fontSize = 30; // matches the original clamp(18px,5vw,30px) roughly
		const font = `${fontSize}px ${currentStyle.font}`;

		// Wait for font to be ready
		document.fonts.ready.then(() => {
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
		});
	}, [person.status, person.signed_name]);

	if (person.status !== "signed") return null;

	return (
		<div className="min-w-0 overflow-hidden grid grid-cols-[1fr_auto_auto] justify-center items-center gap-4 rounded-md border border-lavender-200 bg-neutral-surface px-6 py-8">
			{/* Hidden canvas used for rendering */}
			<canvas ref={canvasRef} className="hidden" />

			{imageSrc && (
				<img
					src={imageSrc}
					alt="Signature"
					className="max-w-full h-auto"
					style={{ margin: "0 auto", display: "block" }}
				/>
			)}
			{/* Fallback while image is being generated */}
			{!imageSrc && (
				<div className="text-center text-sm text-[#9C9AB0]">
					Generating signature…
				</div>
			)}
		</div>
	);
}

export function SignatoriesCard({
	signatories,
	className = "",
	clientState,
	availableClients = [],
	// selectedClient = null,
	// onChangeClient,
	contractDetails,
	onSuccess,
}: SignatoriesCardProps) {
	const [createModalOpen, setCreateModalOpen] = useState(false);
	const [changeModalOpen, setChangeModalOpen] = useState(false);
	const [selectedClient, setSelectedClient] = useState<ClientOption | null>(
		null,
	);

	const completed = signatories.filter((s) => s.status === "signed").length;
	const showClientDropdown = clientState === "no_client";
	const showChangeLink = clientState === "client_decided";
	const showSignatures = clientState === "client_signed";

	const confirm_client_phrase = "Yes, I'm Sure";
	const change_client_phrase = "Yes, I'm Sure";
	const confirm_client_text = `You are about to assign
            ${selectedClient?.name ?? "this person"}
            as the signatory for ${contractDetails.name}. Please verify that this
            individual is authorized to sign the contract on behalf of the
            client. To confirm, type "${confirm_client_phrase}" below.`;

	const change_client_text = `You are about to reassign the signatory 
            from ${selectedClient?.name ?? "this person"}
            for ${contractDetails.name}. To confirm this action, type
            "${change_client_phrase}" below.`;

	useEffect(() => {
		for (let i = 0; i < signatories.length; i++) {
			if (signatories[i].role == "Client") {
				setSelectedClient({
					id: signatories[i].id,
					name: signatories[i].name,
					email: signatories[i].email,
				});
			}
		}
	}, [signatories]);

	const handleConfirmClick = () => {
		if (selectedClient) {
			setCreateModalOpen(true);
		}
	};

	const handleClientChange = async () => {
		if (selectedClient) {
			setChangeModalOpen(true);
		}
	};

	// const handleModalConfirm = () => {
	// 	setModalOpen(false);
	// 	onConfirmClient?.();
	// };

	return (
	<>
		<Card className={cn("p-6 gap-0 bg-neutral-surface border border-border rounded-md shadow-xs", className)}>
		<CardHeader className="p-0 pb-4 border-b border-border">
			<CardTitle className="text-base  text-foreground">
			Signatories
			</CardTitle>
		</CardHeader>

		<CardContent className="p-0 pt-4 flex flex-col gap-4">
			{/* Render existing signatories only if present */}
			{signatories.length > 0 && (
			<ul className="flex flex-col gap-3 w-full">
				{signatories.map((person, i) => (
				<li key={person.id} className="flex flex-col gap-3">
					<SignatoryRow person={person} index={i} />
					<SignatureBox person={person} />
					{i < signatories.length - 1 && <Separator />}
				</li>
				))}
			</ul>
			)}

			{/* Client selection & action */}
			{showClientDropdown && (
			<div className="flex flex-col gap-3 w-full">
				<ClientsDropdown
				clients={availableClients}
				selected={selectedClient}
				onSelect={(client) => setSelectedClient(client)}
				/>
				<Button
				disabled={clientState === "no_client" && !selectedClient}
				onClick={handleConfirmClick}
				className="w-full h-10 text-xs "
				>
				Confirm Client Signatory
				</Button>
			</div>
			)}

			{/* Change signatory option */}
			{showChangeLink && (
			<div className="pt-1 text-center">
				<button
				type="button"
				onClick={handleClientChange}
				className="text-xs  text-brand-600 underline underline-offset-4 hover:opacity-80 transition-opacity cursor-pointer"
				>
				Change Client Signatory?
				</button>
			</div>
			)}
		</CardContent>
		</Card>

		<ConfirmTextModal
		open={createModalOpen}
		onClose={() => setCreateModalOpen(false)}
		twoParamFunc={createClientRoleAssignment}
		client={selectedClient}
		contractDetails={contractDetails}
		confirmPhrase={confirm_client_phrase}
		displayText={confirm_client_text}
		displayTitle="Confirm Client Signatory"
		buttonText="Confirm Signatory"
		onSuccess={onSuccess}
		/>

		<ConfirmTextModal
		open={changeModalOpen}
		onClose={() => setChangeModalOpen(false)}
		twoParamFunc={deleteClientRoleAssignment}
		client={selectedClient}
		contractDetails={contractDetails}
		confirmPhrase={change_client_phrase}
		displayText={change_client_text}
		displayTitle="Confirm Client Signatory"
		buttonText="Re-assign Signatory"
		onSuccess={onSuccess}
		setSelectedClient={setSelectedClient}
		/>
	</>
	);
}

export default SignatoriesCard;
