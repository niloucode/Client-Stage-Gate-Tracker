"use client";

import { Check } from "lucide-react";

// Primary brand purple — replaces #3626CD and #5D5FEF per spec
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

	return (
		<button
			onClick={onClick}
			className="flex flex-col items-center gap-1.5 focus:outline-none"
		>
			{/* Node circle */}
			<div className="relative flex items-center justify-center">
				{approved ? (
					<div className="relative flex items-center justify-center">
						{/* Selection ring */}
						{selected && (
							<>
								<div
									className="absolute rounded-full"
									style={{
										width: 55,
										height: 55,
										backgroundColor: "#ad83f0",
									}}
								/>
							</>
						)}
						<div
							className="relative flex h-12 w-12 items-center justify-center rounded-full"
							style={{
								backgroundColor: P,
							}}
						>
							<Check className="h-3.5 w-3.5 text-white" strokeWidth={3} />
						</div>
					</div>
				) : (
					<div className="relative flex items-center justify-center">
						{/* Purple glow behind circle */}
						<div
							className="absolute rounded-full"
							style={{
								width: 52,
								height: 52,
								backgroundColor: "rgba(67,67,213,0.30)",
							}}
						/>
						<div
							className="relative flex h-[52px] w-[52px] items-center justify-center rounded-full"
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

			{/* Optional badge */}
			{badge === "approved" && (
				<span
					className="rounded-full px-2 py-0.5 text-[8px] font-bold"
					style={{ backgroundColor: "#a4f573", color: "#307100" }}
				>
					APPROVED
				</span>
			)}
			{badge === "current" && (
				<span
					className="rounded-full px-2 py-0.5 text-[8px] font-bold text-white"
					style={{ backgroundColor: P }}
				>
					CURRENT
				</span>
			)}

			{/* Labels */}
			<div className="flex flex-col items-center gap-0.5">
				<span
					className="text-[12px] font-bold"
					style={{ color: approved ? P : "#908f99" }}
				>
					Stage {stageNumber}
				</span>
				<span
					className="text-[10px] font-bold uppercase tracking-wide"
					style={{ color: approved ? P : "#908f99" }}
				>
					{stageName}
				</span>
			</div>
		</button>
	);
}

export default StageStep;
