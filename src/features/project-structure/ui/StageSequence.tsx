"use client";

import { Check, Workflow, Plus, Pencil, LucideIcon } from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

// Shape of the stages returned by getProjectStages (src/entities/stage).
export interface Stage {
	stage_id: string;
	number: number | null;
	name: string;
	approved: boolean;
	current?: boolean;
	description?: string | null;
	planStart?: Date | null;
	planEnd?: Date | null;
	actualStart?: Date | null;
	actualEnd?: Date | null;
}

interface StageSequenceProps {
	stages: Stage[];
	selectedId?: string | null;
	onSelectStage?: (id: string) => void;
	onAddStage?: () => void;
	onEditStage?: (id: string) => void;
	onDeleteStage?: (id: string) => void;
	showAddButton?: boolean;
}

// ─── Shared UI Helpers ───────────────────────────────────────────────────────

function SectionLabel({
	icon: Icon,
	label,
}: {
	icon: LucideIcon;
	label: string;
}) {
	return (
		<div className="flex items-center gap-1.5">
			<Icon className="h-3.5 w-3.5 shrink-0 section-title" />
			<span className="section-title">{label}</span>
		</div>
	);
}

// ─── Stage Stepper Sub-Components ───────────────────────────────────────────

function StageStep({
	stageNumber,
	stageName,
	status,
	selected,
	badge,
	onClick,
	onEdit,
}: {
	stageNumber: number;
	stageName: string;
	status: "approved" | "unapproved";
	selected?: boolean;
	badge?: "approved" | "current" | null;
	onClick?: () => void;
	onEdit?: () => void;
}) {
	const isApproved = status === "approved";
	const isCurrent = badge === "current";

	return (
		<div className="group relative flex flex-col items-center shrink-0 text-center transition-all duration-200">
			{/* Node Circle & Action Button Wrapper */}
			<div className="relative z-10 flex flex-col items-center">
				<button
					type="button"
					onClick={onClick}
					className="cursor-pointer focus:outline-none"
				>
					{/* Node Circle — Consistent h-13 w-13 size */}
					<div
						className={`
							relative flex h-13 w-13 items-center justify-center rounded-full text-sm font-bold transition-all shadow-xs
							${
								selected
									? "border-4 border-brand-100 bg-brand-600 text-white ring-4 ring-brand-100"
									: isApproved
										? "border-4 border-brand-100 bg-brand-500 text-white hover:bg-brand-600"
										: isCurrent
											? "border-4 border-brand-100 bg-brand-50 text-brand-600 hover:bg-brand-100"
											: "border-4 border-brand-100 bg-neutral-surface text-brand-600 hover:bg-brand-50"
							}
						`}
					>
						{isApproved ? (
							<Check className="h-5 w-5" />
						) : (
							<span>{stageNumber}</span>
						)}
					</div>
				</button>

				{/* Pencil Button on Group Hover */}
				{onEdit && (
					<button
						type="button"
						onClick={(e) => {
							e.stopPropagation();
							onEdit();
						}}
						className="flex items-center justify-center h-6 w-6 absolute -top-1 -right-1 opacity-0 group-hover:opacity-100 bg-brand-100 rounded-full z-20 hover:bg-brand-600 hover:text-brand-10 transition-all cursor-pointer shadow-xs"
						title={`Edit stage ${stageName}`}
						aria-label={`Edit stage ${stageName}`}
					>
						<Pencil size={12} strokeWidth={3} />
					</button>
				)}
			</div>

			{/* Badge Tag */}
			{badge && (
				<span
					className={`mt-2 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
						badge === "approved"
							? "border-green-600/30 bg-green-100 text-green-600"
							: "border-brand-500/30 bg-brand-50 text-brand-600"
					}`}
				>
					{badge === "approved" ? "Approved" : "In Progress"}
				</span>
			)}

			{/* Title */}
			<span
				className={`max-w-25 text-xs font-semibold leading-tight line-clamp-2 ${badge ? "mt-1.5" : "mt-2"} ${
					selected || isCurrent ? "text-brand-600" : "text-neutral-muted"
				}`}
			>
				{stageName}
			</span>
		</div>
	);
}

/** Horizontal stage stepper navigation. */
export function StageSequence({
	stages,
	selectedId,
	onSelectStage,
	onAddStage,
	onEditStage,
	showAddButton = true,
}: StageSequenceProps) {
	const lastApprovedIdx = stages.reduce(
		(acc, s, i) => (s.approved ? i : acc),
		-1,
	);
	const progressPct =
		stages.length > 1 ? (lastApprovedIdx / (stages.length - 1)) * 100 : 0;

	const NODE_SLOT = 130;
	const CIRCLE_CENTER_Y = 26; // Center of h-13 (52px)

	return (
		<div className="w-full">
			{/* Header with Section Label and Add Action */}
			<div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-4">
				<SectionLabel icon={Workflow} label="Stage Sequence" />
				{showAddButton && (
					<button
						type="button"
						onClick={onAddStage}
						className="flex cursor-pointer items-center justify-center gap-1.5 rounded-md border border-brand-600 bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-brand-500 w-full sm:w-auto"
					>
						<Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
						<span>New Stage</span>
					</button>
				)}
			</div>

			{/* Stepper Timeline / Empty State */}
			{stages.length === 0 ? (
				<div className="flex flex-col items-center justify-center py-8 text-center bg-neutral-subtle/30 rounded-md border border-dashed border-warm-gray-200 my-2">
					<Workflow className="h-8 w-8 text-muted-foreground/40 mb-2" />
					<p className="text-sm font-medium text-charcoal">
						No stages in sequence
					</p>
					<p className="text-xs text-muted-foreground mt-1 max-w-sm">
						{showAddButton
							? "Create your first stage to establish the project roadmap and milestone sequence."
							: "No stages have been defined for this project roadmap yet."}
					</p>
				</div>
			) : (
				<div className="hide-scrollbar overflow-x-auto py-2">
					<div
						className="relative flex items-start justify-between min-w-full px-4"
						style={{ minWidth: `${stages.length * NODE_SLOT}px` }}
					>
						{/* Progress Connector Line */}
						{stages.length > 1 && (
							<div
								className="absolute -translate-y-1/2 rounded-full"
								style={{
									top: CIRCLE_CENTER_Y,
									left: NODE_SLOT / 2,
									width: `calc(100% - ${NODE_SLOT}px)`,
									height: 3,
									backgroundColor: "#E5E3E0",
								}}
							>
								<div
									className="h-full rounded-full bg-brand-600 transition-all duration-300"
									style={{ width: `${progressPct}%` }}
								/>
							</div>
						)}

						{/* Node Items */}
						{stages.map((stage) => {
							const badge = stage.approved
								? "approved"
								: stage.current
									? "current"
									: null;

							return (
								<div
									key={stage.stage_id}
									className="relative z-10 flex flex-col items-center"
									style={{ width: NODE_SLOT }}
								>
									<StageStep
										stageNumber={stage.number ?? 0}
										stageName={stage.name}
										status={stage.approved ? "approved" : "unapproved"}
										selected={selectedId === stage.stage_id}
										badge={badge}
										onClick={() => onSelectStage?.(stage.stage_id)}
										onEdit={
											onEditStage
												? () => onEditStage(stage.stage_id)
												: undefined
										}
									/>
								</div>
							);
						})}
					</div>
				</div>
			)}
		</div>
	);
}
