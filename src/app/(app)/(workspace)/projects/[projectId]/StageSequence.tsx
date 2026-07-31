"use client";

import { Calendar, Layers, Plus } from "lucide-react";
import { StageStep } from "./StageStep";

const P = "#6b1fa8";

export interface Stage {
	id: string;
	stageNumber: number;
	stageName: string;
	/** Stage has been approved */
	approved: boolean;
	/** Stage is the current in-progress one */
	current?: boolean;
}

interface StageSequenceProps {
	stages: Stage[];
	selectedId?: string | null;
	onSelectStage?: (id: string) => void;
	onAddStage?: () => void;
	showAddButton?: boolean;
}

export function StageSequence({
	stages,
	selectedId,
	onSelectStage,
	onAddStage,
	showAddButton = true,
}: StageSequenceProps) {
	// Progress line fills up to the last approved stage
	const lastApprovedIdx = stages.reduce(
		(acc, s, i) => (s.approved ? i : acc),
		-1,
	);
	const progressPct =
		stages.length > 1 ? (lastApprovedIdx / (stages.length - 1)) * 100 : 0;

	// Circle center offset from edge of each node slot
	const NODE_SLOT = 110; // px per stage slot
	const CIRCLE_CENTER_Y = 26; // exact middle of the 52px circle container

	return (
		<>
			<style>{`
        .stage-hscroll::-webkit-scrollbar { height: 6px; }
        .stage-hscroll::-webkit-scrollbar-track { background: transparent; border-radius: 9999px; }
        .stage-hscroll::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.15); border-radius: 9999px; }
      `}</style>

			<div
				className="rounded-[20px] sm:rounded-[24px] bg-white p-4 sm:p-6"
				style={{ border: "1px solid #c7c4d7" }}
			>
				{/* Responsive Header Row: Stacks vertically on small screens */}
				<div className="mb-4 sm:mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
					<div className="flex items-center gap-2">
						<Calendar className="h-4 w-4 shrink-0" style={{ color: P }} />
						<span className="text-base sm:text-lg font-bold" style={{ color: "#191c1e" }}>
							Stage Sequence
						</span>
					</div>
					{showAddButton && (
						<button
							onClick={onAddStage}
							className="flex items-center justify-center gap-2 rounded-xl px-4 py-2 sm:py-2.5 text-sm sm:text-base text-white transition-opacity hover:opacity-90 w-full sm:w-auto"
							style={{ backgroundColor: P }}
						>
							<Plus className="h-3.5 w-3.5" strokeWidth={3} />
							New Stage
						</button>
					)}
				</div>

				{/* Scrollable stepper */}
				<div className="stage-hscroll pt-4 overflow-x-auto pb-2">
					<div
						className="relative flex items-start justify-between"
						style={{ minWidth: `${stages.length * NODE_SLOT}px` }}
					>
						{/* Progress line — positioned at exact 26px vertical midpoint of circles */}
						{stages.length > 1 && (
							<div
								className="absolute -translate-y-1/2"
								style={{
									top: CIRCLE_CENTER_Y,
									left: NODE_SLOT / 2,
									width: `calc(100% - ${NODE_SLOT}px)`,
									height: 3,
									backgroundColor: "#c7c4d7",
								}}
							>
								<div
									style={{
										width: `${progressPct}%`,
										height: "100%",
										backgroundColor: P,
									}}
								/>
							</div>
						)}

						{/* Stage nodes */}
						{stages.map((stage) => {
							const badge = stage.approved
								? "approved"
								: stage.current
									? "current"
									: null;

							return (
								<div
									key={stage.id}
									className="relative z-10 flex justify-center"
									style={{ width: NODE_SLOT }}
								>
									<StageStep
										stageNumber={stage.stageNumber}
										stageName={stage.stageName}
										status={stage.approved ? "approved" : "unapproved"}
										selected={selectedId === stage.id}
										badge={badge}
										onClick={() => onSelectStage?.(stage.id)}
									/>
								</div>
							);
						})}
					</div>
				</div>
			</div>
		</>
	);
}

export default StageSequence;