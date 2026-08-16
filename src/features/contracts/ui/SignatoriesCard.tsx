"use client";

import { useEffect, useRef, useState } from "react";
import { CheckCircle2, Clock3 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";

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

interface SignatoriesCardProps {
	signatories: Signatory[];
	className?: string;
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

function SignatoryRow({ person }: { person: Signatory }) {
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
				<p className="truncate text-sm  text-[#181724]">{person.name}</p>
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

const SIGNATURE_FONT = "'Great Vibes', cursive";

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

	if (person.status !== "signed") return null;

	return (
		<div className="min-w-0 overflow-hidden grid grid-cols-[1fr_auto_auto] justify-center items-center gap-4 rounded-md border border-lavender-200 bg-neutral-surface px-6 py-8">
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
				<div className="text-center text-sm text-[#9C9AB0]">
					Generating signature…
				</div>
			)}
		</div>
	);
}

/**
 * 2026-08-15 spec: read-only signatory list (owner + client). The client
 * signatory is now defined by the contract's client_id (no more role
 * assignment flows — those moved to the ContractApprovalCard).
 */
export function SignatoriesCard({
	signatories,
	className = "",
}: SignatoriesCardProps) {
	return (
		<Card
			className={cn(
				"p-6 gap-0 bg-neutral-surface border border-border rounded-md shadow-xs",
				className,
			)}
		>
			<CardHeader className="p-0 pb-4 border-b border-border">
				<CardTitle className="text-base  text-foreground">
					Signatories
				</CardTitle>
			</CardHeader>

			<CardContent className="p-0 pt-4 flex flex-col gap-4">
				{signatories.length > 0 ? (
					<ul className="flex flex-col gap-3 w-full">
						{signatories.map((person, i) => (
							<li key={person.id} className="flex flex-col gap-3">
								<SignatoryRow person={person} />
								<SignatureBox person={person} />
								{i < signatories.length - 1 && <Separator />}
							</li>
						))}
					</ul>
				) : (
					<p className="py-4 text-center text-xs text-muted-foreground">
						No signatories yet.
					</p>
				)}
			</CardContent>
		</Card>
	);
}
