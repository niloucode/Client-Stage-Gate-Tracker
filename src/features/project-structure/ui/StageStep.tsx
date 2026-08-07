"use client";

import { Check } from "lucide-react";

// Primary brand purple
const P = "#6b1fa8";

export type StageStatus = "approved" | "unapproved";
export type StageBadge = "approved" | "current" | null;

export interface StageStepProps {
	stageNumber: number;
	stageName: string;
	status: StageStatus;
	selected?: boolean;
	badge?: StageBadge;
	onClick?: () => void;
}

export function StageStep({
	stageNumber,
	stageName,
	status,
	selected = false,
	badge,
	onClick,
}: StageStepProps) {
	const approved = status === "approved";

	// Opacity rules for #151C27 text
	const numberOpacity = !approved && !selected ? 0.8 : 1;
	const nameOpacity = !selected ? 0.8 : 1;

	return (
		<button
			onClick={onClick}
			className="flex flex-col items-center focus:outline-none"
		>
			{/* Node circle container — fixed 52x52px so line alignment is exact */}
			<div className="relative flex h-[52px] w-[52px] items-center justify-center">
				{/* Selection ring — always rendered in DOM, smoothly transitions opacity & scale on select/deselect */}
				<div
					className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full transition-all duration-300 ease-in-out pointer-events-none ${
						selected
							? "opacity-100 scale-100"
							: "opacity-0 scale-90"
					}`}
					style={{
						width: 58,
						height: 58,
						backgroundColor: "#ad83f0",
					}}
				/>

				{approved ? (
					<div className="relative flex h-full w-full items-center justify-center">
						<div
							className="relative flex h-12 w-12 items-center justify-center rounded-full transition-colors duration-300"
							style={{
								backgroundColor: P,
							}}
						>
							<Check className="h-4 w-4 text-white" strokeWidth={3} />
						</div>
					</div>
				) : (
					<div className="relative flex h-full w-full items-center justify-center">
						{/* Purple glow behind circle — fades in/out on selection */}
						<div
							className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full transition-all duration-300 ease-in-out ${
								selected ? "opacity-100 scale-105" : "opacity-40 scale-100"
							}`}
							style={{
								width: 52,
								height: 52,
							}}
						/>
						<div
							className="relative flex h-[52px] w-[52px] items-center justify-center rounded-full transition-colors duration-300"
							style={{
								backgroundColor: "#e7e8eb",
								border: `1px solid ${selected ? "#8b8be5" : "#c7c4d7"}`,
							}}
						>
							<span
								className="text-lg font-bold leading-none"
								style={{ color: "#767586" }}
							>
								{stageNumber}
							</span>
						</div>
					</div>
				)}
			</div>

			{/* Fixed-height badge slot (20px) ensures text below aligns on the same row across all steps */}
			<div className="mt-1.5 mb-0.5 flex h-5 items-center justify-center">
				{badge === "approved" && (
					<span
						className="rounded-full px-2 py-0.5 text-[9px] font-bold"
						style={{ backgroundColor: "#a4f573", color: "#307100" }}
					>
						APPROVED
					</span>
				)}
				{badge === "current" && (
					<span
						className="rounded-full px-2 py-0.5 text-[9px] font-bold text-white"
						style={{ backgroundColor: P }}
					>
						CURRENT
					</span>
				)}
			</div>

			{/* Labels in #151C27 with smooth opacity transition */}
			<div className="flex flex-col items-center gap-0.5">
				<span
					className="text-[12px] font-bold transition-opacity duration-300"
					style={{
						color: "#151C27",
						opacity: numberOpacity,
					}}
				>
					Stage {stageNumber}
				</span>
				<span
					className="text-[11px] font-bold uppercase tracking-wide transition-opacity duration-300"
					style={{
						color: "#151C27",
						opacity: nameOpacity,
					}}
				>
					{stageName}
				</span>
			</div>
		</button>
	);
}

export default StageStep;