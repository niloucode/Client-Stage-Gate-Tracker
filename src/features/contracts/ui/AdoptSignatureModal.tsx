"use client";

import { useState } from "react";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const STYLES = [
	{ id: "great-vibes", label: "Style 1", font: "'Great Vibes', cursive" },
	{ id: "dancing-script", label: "Style 2", font: "'Dancing Script', cursive" },
	{ id: "sacramento", label: "Style 3", font: "'Sacramento', cursive" },
	{ id: "alex-brush", label: "Style 4", font: "'Alex Brush', cursive" },
	{ id: "allura", label: "Style 5", font: "'Allura', cursive" },
];

const GOOGLE_FONTS_HREF =
	"https://fonts.googleapis.com/css2?family=Great+Vibes&family=Dancing+Script:wght@600&family=Sacramento&family=Alex+Brush&family=Allura&display=swap";

export interface AdoptedSignature {
	fullName: string;
	initials: string;
	font: string;
	styleId: string;
}

interface AdoptSignatureModalProps {
	initialName?: string;
	initialInitials?: string;
	onCancel: () => void;
	onAdopt: (signature: AdoptedSignature) => void;
}

export function AdoptSignatureModal({
	initialName = "",
	initialInitials = "",
	onCancel,
	onAdopt,
}: AdoptSignatureModalProps) {
	const [fullName, setFullName] = useState(initialName);
	const [initials, setInitials] = useState(initialInitials);
	const [styleIndex, setStyleIndex] = useState(0);

	const currentStyle = STYLES[styleIndex];
	const cycleStyle = () => setStyleIndex((i) => (i + 1) % STYLES.length);

	const canAdopt = fullName.trim().length > 0 && initials.trim().length > 0;

	const handleAdopt = () => {
		if (!canAdopt) return;
		onAdopt({
			fullName,
			initials,
			font: currentStyle.font,
			styleId: currentStyle.id,
		});
	};

	return (
		<Dialog open onOpenChange={(open) => !open && onCancel()}>
			<DialogContent className="max-w-xl">
				<link rel="stylesheet" href={GOOGLE_FONTS_HREF} />
				<DialogHeader>
					<DialogTitle>Adopt Your Signature</DialogTitle>
				</DialogHeader>

				{/* Body */}
				<div className="px-6 py-5">
					<p className="mb-5 text-sm text-[#3F3D52]">
						Confirm your name, initials, and signature.
					</p>

					{/* Name / Initials inputs */}
					<div className="mb-5 grid grid-cols-[1fr_auto] gap-4">
						<div>
							<label className="mb-1.5 block text-xs font-semibold text-ink">
								Full Name <span className="text-red-500">*</span>
							</label>
							<input
								type="text"
								value={fullName}
								onChange={(e) => setFullName(e.target.value)}
								className="w-full rounded-md border border-[#D6D3E8] px-3 py-2 text-sm text-ink outline-none focus:border-indigo-700 focus:ring-1 focus:ring-indigo-700"
								placeholder="Your Name"
							/>
						</div>
						<div className="w-28">
							<label className="mb-1.5 block text-xs font-semibold text-ink">
								Initials <span className="text-red-500">*</span>
							</label>
							<input
								type="text"
								value={initials}
								onChange={(e) => setInitials(e.target.value.slice(0, 4))}
								className="w-full rounded-md border border-[#D6D3E8] px-3 py-2 text-center text-sm text-ink outline-none focus:border-indigo-700 focus:ring-1 focus:ring-indigo-700"
								placeholder="YN"
							/>
						</div>
					</div>

					{/* Tab */}
					<div className="mb-4 border-b border-lavender-200">
						<div className="inline-block border-b-2 border-indigo-700 pb-2 text-xs font-semibold tracking-wide text-indigo-700">
							SELECT STYLE
						</div>
					</div>

					<div className="mb-1 flex items-center justify-between">
						<span className="text-xs font-semibold tracking-wide text-plum-400">
							PREVIEW
						</span>
					</div>

					<div className="grid grid-cols-[1fr_auto_auto] items-center gap-4 rounded-lg border border-lavender-200 bg-neutral-surface px-6 py-8">
						<div className="min-w-0 overflow-hidden">
							<div className="mb-1 text-[10px] font-semibold tracking-wide text-indigo-700">
								SIGNED BY:
							</div>
							<div
								className="overflow-visible neutral-surfacespace-nowrap text-ink"
								style={{
									fontFamily: currentStyle.font,
									fontSize: "clamp(18px, 5vw, 30px)",
									lineHeight: 1.6,
								}}
							>
								{fullName || "Your Name"}
							</div>
						</div>

						<div className="h-16 w-px bg-lavender-200" />

						<div className="min-w-0">
							<div className="mb-1 text-[10px] font-semibold tracking-wide text-indigo-700">
								DS:
							</div>
							<div
								className="neutral-surfacespace-nowrap text-ink"
								style={{
									fontFamily: currentStyle.font,
									fontSize: "30px",
									lineHeight: 1.6,
								}}
							>
								{initials || "YN"}
							</div>
						</div>
					</div>

					<p className="mt-5 text-xs leading-relaxed text-plum-400">
						By selecting{" "}
						<span className="font-medium text-ink">Adopt and Sign</span>,
						I agree that the signature and initials will be the electronic
						representation of my signature and initials for all purposes when I
						(or my agent) use them on documents, including legally binding
						contracts.
					</p>
				</div>

				{/* Footer */}
				<DialogFooter showCloseButton={false} className="gap-3">
					<Button type="button" onClick={handleAdopt} disabled={!canAdopt}>
						Adopt and Sign
					</Button>
					<Button type="button" variant="ghost" onClick={onCancel}>
						Cancel
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

/**
 * Renders an adopted (typed) signature to a PNG File so it can be handled
 * by the same code path as an uploaded image file.
 */
export function renderSignatureToFile({
	fullName,
	font,
}: Pick<AdoptedSignature, "fullName" | "font">): Promise<File | null> {
	return new Promise((resolve) => {
		const canvas = document.createElement("canvas");
		canvas.width = 600;
		canvas.height = 200;
		const ctx = canvas.getContext("2d");
		if (!ctx) return resolve(null);
		ctx.fillStyle = "#181724";
		ctx.font = `64px ${font}`;
		ctx.textAlign = "center";
		ctx.textBaseline = "middle";
		ctx.fillText(fullName, canvas.width / 2, canvas.height / 2);
		canvas.toBlob((blob) => {
			if (!blob) return resolve(null);
			resolve(new File([blob], "signature.png", { type: "image/png" }));
		}, "image/png");
	});
}

export default AdoptSignatureModal;
