"use client";

import { useMemo, useState } from "react";
import {
	History,
	FileText,
	ArrowRight,
	ChevronDown,
	CheckCircle2,
	XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Back } from "@/components/ui/back";
import { cn } from "@/lib/utils";
import { useStageTree } from "@/entities/stage";
import { useStageGates } from "@/entities/gate";
import type { GateFeedbackEntry } from "@/entities/gate";
import { allPhasesFinished } from "@/shared/lib/gateRules";
import { GateFeedbackModal } from "./GateFeedbackModal";
import { GateFeedbackGiveModal } from "./GateFeedbackGiveModal";
import { GateDiscussionModal } from "./GateDiscussionModal";

export interface GateOverviewProps {
	projectId: string;
	stageId: string;
}

/* -------------------------------------------------------------------------- */
/* Stage-tree cell types (structural subset of the getStageTree payload)     */
/* -------------------------------------------------------------------------- */

interface TreeWorkflow {
	name: string;
	planStart: Date;
	planEnd: Date;
	actualStart: Date | null;
	actualEnd: Date | null;
	ticketCount: number;
	progress: number;
}

interface TreeModule {
	name: string;
	planStart: Date;
	planEnd: Date;
	actualStart: Date | null;
	actualEnd: Date | null;
	workflows: TreeWorkflow[];
}

interface TreePhase {
	number: number;
	name: string;
	description: string | null;
	planStart: Date;
	planEnd: Date;
	actualStart: Date | null;
	actualEnd: Date | null;
	modules: TreeModule[];
}

function formatRange(start: Date, end: Date): string {
	return `${start.toLocaleDateString("en-US", {
		month: "short",
		day: "2-digit",
		year: "numeric",
	})} – ${end.toLocaleDateString("en-US", {
		month: "short",
		day: "2-digit",
		year: "numeric",
	})}`;
}

/* -------------------------------------------------------------------------- */
/* Tree cells (real data)                                                    */
/* -------------------------------------------------------------------------- */

function PhaseCell({ phase }: { phase: TreePhase }) {
	const [isExpanded, setIsExpanded] = useState(!phase.actualEnd);
	const completed = phase.actualEnd !== null;

	return (
		<div className="flex flex-col">
			<div
				onClick={() => setIsExpanded((prev) => !prev)}
				role="button"
				tabIndex={0}
				onKeyDown={(e) => {
					if (e.key === "Enter" || e.key === " ") {
						e.preventDefault();
						setIsExpanded((prev) => !prev);
					}
				}}
				className="flex items-start sm:items-center justify-between gap-3 cursor-pointer select-none group/phase hover:opacity-90 transition-opacity"
			>
				<div className="flex items-start gap-3 min-w-0 flex-1">
					<div className="relative z-10 flex shrink-0 items-center justify-center rounded-full border-y-[6px] border-neutral-surface bg-neutral-surface mt-1 sm:mt-0">
						<ArrowRight className="size-4 text-primary" />
					</div>

					<div className="flex flex-col min-w-0 flex-1 gap-1">
						<h2
							className={cn(
								"truncate min-w-0",
								completed && "line-through text-muted-foreground font-normal",
							)}
						>
							{phase.name}
						</h2>

						<div className="flex flex-col sm:flex-row sm:items-center gap-x-4 gap-y-0.5 text-xs text-muted-foreground">
							<span>
								PLANNED: {formatRange(phase.planStart, phase.planEnd)}
							</span>
							<span className="hidden sm:inline text-neutral-border/40">•</span>
							<span>
								ACTUAL:{" "}
								{phase.actualStart && phase.actualEnd
									? formatRange(phase.actualStart, phase.actualEnd)
									: "Not finished"}
							</span>
						</div>
					</div>
				</div>

				<div className="flex items-center gap-2.5 shrink-0 self-start sm:self-center mt-1 sm:mt-0">
					{completed && (
						<Badge
							variant="outline"
							className="bg-emerald-100/80 text-emerald-800 text-[10px] py-0.5 px-2 font-semibold"
						>
							Completed
						</Badge>
					)}
					<ChevronDown
						className={cn(
							"size-5 text-muted-foreground transition-transform duration-300 ease-in-out shrink-0",
							!isExpanded && "-rotate-90",
						)}
					/>
				</div>
			</div>

			<div
				className={cn(
					"grid transition-[grid-template-rows,opacity] duration-300 ease-in-out pl-4 sm:pl-7",
					isExpanded
						? "grid-rows-[1fr] opacity-100"
						: "grid-rows-[0fr] opacity-0 pointer-events-none",
				)}
			>
				<div className="overflow-hidden flex flex-col gap-4 pt-2">
					<div className="pl-1">
						{phase.description && (
							<p className="subtitle">{phase.description}</p>
						)}
					</div>

					<div className="flex flex-col gap-3 sm:gap-4">
						{phase.modules.map((mod) => (
							<ModuleCell key={mod.name} module={mod} />
						))}
					</div>
				</div>
			</div>
		</div>
	);
}

function ModuleCell({ module }: { module: TreeModule }) {
	const [isExpanded, setIsExpanded] = useState(!module.actualEnd);
	const completed = module.actualEnd !== null;

	return (
		<Card
			className={cn(
				"bg-neutral-subtle transition-all overflow-hidden border border-border gap-0 py-0",
				completed && "opacity-75",
			)}
		>
			<CardHeader
				onClick={() => setIsExpanded((prev) => !prev)}
				role="button"
				tabIndex={0}
				onKeyDown={(e) => {
					if (e.key === "Enter" || e.key === " ") {
						e.preventDefault();
						setIsExpanded((prev) => !prev);
					}
				}}
				className="flex items-start sm:items-center justify-between gap-3 cursor-pointer select-none px-4 py-3.5 sm:px-5 sm:py-3.5 hover:opacity-90 transition-opacity"
			>
				<div className="flex flex-col min-w-0 flex-1 gap-0.5">
					<CardTitle className="p-0">
						<h3
							className={cn(
								"truncate min-w-0 leading-snug",
								completed && "line-through text-muted-foreground font-normal",
							)}
						>
							{module.name}
						</h3>
					</CardTitle>
					<span className="text-xs text-muted-foreground leading-tight">
						{formatRange(module.planStart, module.planEnd)}
					</span>
				</div>

				<div className="flex items-center gap-2.5 shrink-0 self-start sm:self-center">
					{completed && (
						<Badge
							variant="outline"
							className="bg-emerald-100/80 text-emerald-800 text-[10px] py-0.5 px-2 font-semibold"
						>
							Completed
						</Badge>
					)}
					<ChevronDown
						className={cn(
							"size-4 text-muted-foreground transition-transform duration-300 ease-in-out shrink-0",
							!isExpanded && "-rotate-90",
						)}
					/>
				</div>
			</CardHeader>

			<div
				className={cn(
					"grid transition-[grid-template-rows,opacity] duration-300 ease-in-out",
					isExpanded
						? "grid-rows-[1fr] opacity-100"
						: "grid-rows-[0fr] opacity-0 pointer-events-none",
				)}
			>
				<div className="overflow-hidden">
					<CardContent className="flex flex-col gap-2 px-4 pb-4 sm:px-5 sm:pb-4 pt-1">
						{module.workflows.map((wf) => (
							<WorkflowCell key={wf.name} workflow={wf} />
						))}
					</CardContent>
				</div>
			</div>
		</Card>
	);
}

function WorkflowCell({ workflow }: { workflow: TreeWorkflow }) {
	const completed = workflow.actualEnd !== null;
	return (
		<Card
			size="sm"
			className={cn(
				"bg-neutral-surface border border-border/80 transition-all",
				completed && "opacity-65 bg-neutral-surface/60",
			)}
		>
			<CardContent className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 sm:gap-3 py-2 px-3 text-sm">
				<div className="flex items-center gap-2.5 text-foreground min-w-0">
					{completed ? (
						<CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
					) : (
						<FileText className="size-4 text-muted-foreground shrink-0" />
					)}
					<span
						className={cn(
							"truncate",
							completed && "line-through text-muted-foreground font-normal",
						)}
					>
						{workflow.name}
					</span>
					<span className="text-[11px] text-muted-foreground shrink-0">
						{workflow.progress}%
					</span>
				</div>
				<span className="text-xs text-muted-foreground shrink-0 pl-6 sm:pl-0">
					{formatRange(workflow.planStart, workflow.planEnd)}
				</span>
			</CardContent>
		</Card>
	);
}

/* -------------------------------------------------------------------------- */
/* Page                                                                       */
/* -------------------------------------------------------------------------- */

/** Stage gate overview: stepper, status, and approve/decline controls. */
export function GateOverview({ projectId, stageId }: GateOverviewProps) {
	const { data: tree, isError: treeError } = useStageTree(stageId);
	const {
		data: gateData,
		isLoading: gatesLoading,
		isError: gatesError,
	} = useStageGates(stageId);

	const [isHistoryOpen, setIsHistoryOpen] = useState(false);
	const [isGiveModalOpen, setIsGiveModalOpen] = useState(false);
	const [decisionVariant, setDecisionVariant] = useState<
		"approved" | "rejected"
	>("approved");
	const [discussionGate, setDiscussionGate] =
		useState<GateFeedbackEntry | null>(null);

	const gates = gateData?.gates ?? [];
	// Spec 9: gates are listed descending — the latest gate is first.
	const latestGate = gates[0] ?? null;
	const canDecide =
		(gateData?.canDecide ?? false) && latestGate?.status === "PENDING";

	const phasesFinished = useMemo(() => {
		const phases = tree?.phases ?? [];
		return allPhasesFinished(
			phases.map((p) => ({ actual_end_at: p.actualEnd })),
		);
	}, [tree]);

	const currentStatus = latestGate?.status ?? "PENDING";
	const latestReviewer = latestGate?.reviewer?.name ?? null;

	const handleDecisionClick = (decision: "approved" | "rejected") => {
		if (!latestGate) return;
		setDecisionVariant(decision);
		setIsGiveModalOpen(true);
	};

	const handleOpenDiscussion = (entry: GateFeedbackEntry) => {
		setDiscussionGate(entry);
	};

	return (
		<main className="min-h-screen w-full bg-background">
			<div className="flex flex-col gap-6">
				<Back link={projectId ? `/projects/${projectId}` : "/projects"} />

				<div>
					<h1>{tree?.name ?? "Stage Gate"}</h1>
					<p className="subtitle">
						Review stage structure, hierarchy, and approval status.
					</p>
				</div>

				<div className="flex flex-col-reverse items-start gap-6 lg:flex-row lg:items-start w-full">
					{/* Left Column: Project Hierarchy Card */}
					<Card className="relative flex-1 bg-neutral-surface p-4 sm:p-6 w-full min-w-0 border border-border shadow-xs">
						<div className="absolute left-6 sm:left-8 top-6 sm:top-8 bottom-6 sm:bottom-8 z-0 w-0.5 -translate-x-1/2 bg-neutral-subtle" />

						<CardContent className="flex flex-col gap-6 sm:gap-8 p-0">
							{treeError ? (
								<p className="py-10 text-center text-sm text-destructive">
									Failed to load the stage structure.
								</p>
							) : (tree?.phases ?? []).length === 0 ? (
								<p className="py-10 text-center text-sm text-muted-foreground">
									No phases yet.
								</p>
							) : (
								(tree?.phases ?? []).map((phase) => (
									<PhaseCell
										key={phase.phase_id ?? phase.number}
										phase={phase}
									/>
								))
							)}
						</CardContent>
					</Card>

					{/* Right Column: Approval Panel Card */}
					<Card className="h-fit w-full lg:w-80 bg-neutral-surface shrink-0 border border-border shadow-xs gap-0 p-5 sm:p-6">
						<CardHeader className="p-0 pb-4">
							<CardTitle>
								<h3>Approval Panel</h3>
							</CardTitle>
						</CardHeader>

						<CardContent className="p-0 flex flex-col gap-4">
							{/* Action Buttons — only the project's client may decide */}
							{canDecide ? (
								<div className="flex flex-col gap-2">
									<Button
										variant="default"
										onClick={() => handleDecisionClick("approved")}
										disabled={!phasesFinished}
										title={
											phasesFinished
												? undefined
												: "All phases under this stage must be finished first."
										}
										className="w-full gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs sm:text-sm h-10 shadow-xs"
									>
										<CheckCircle2 className="size-4" />
										Approve Stage Gate
									</Button>

									<Button
										variant="destructive"
										onClick={() => handleDecisionClick("rejected")}
										disabled={!phasesFinished}
										title={
											phasesFinished
												? undefined
												: "All phases under this stage must be finished first."
										}
										className="w-full gap-2 font-semibold text-xs sm:text-sm h-10"
									>
										<XCircle className="size-4" />
										Decline Stage Gate
									</Button>
								</div>
							) : (
								<p className="text-xs text-muted-foreground">
									Only the project&rsquo;s client can approve or decline stage
									gates.
								</p>
							)}

							<Button
								variant="secondary"
								onClick={() => setIsHistoryOpen(true)}
								className="w-full gap-2 text-xs font-semibold h-10 border border-border"
							>
								<History className="size-4" />
								View Gate Feedback
							</Button>

							{/* Current Status Section */}
							<div className="flex flex-col gap-1.5 pt-1">
								<span className="text-sm font-bold text-neutral-border tracking-wider uppercase">
									CURRENT STATUS
								</span>
								<div
									className={cn(
										"flex items-center justify-center gap-2 w-full h-9 rounded-md border text-xs font-semibold transition-colors",
										currentStatus === "APPROVED" &&
											"bg-emerald-50 text-emerald-700 border-emerald-200",
										currentStatus === "REJECTED" &&
											"bg-red-50 text-red-700 border-red-200",
										currentStatus === "PENDING" &&
											"bg-amber-50 text-amber-800 border-amber-200",
									)}
								>
									<span
										className={cn(
											"h-2 w-2 rounded-full shrink-0",
											currentStatus === "APPROVED" && "bg-emerald-500",
											currentStatus === "REJECTED" && "bg-red-500",
											currentStatus === "PENDING" && "bg-amber-500",
										)}
									/>
									<span>
										{currentStatus === "APPROVED"
											? "Approved"
											: currentStatus === "REJECTED"
												? "Rejected"
												: "Pending Review"}
									</span>
								</div>
							</div>

							{/* Latest Gate Section */}
							<div className="flex flex-col gap-1.5">
								<span className="text-xs font-bold text-neutral-border tracking-wider uppercase">
									LATEST GATE
								</span>
								<div className="flex items-center gap-3 p-3 rounded-md bg-neutral-surface border border-border">
									{latestReviewer ? (
										<>
											<Avatar className="h-9 w-9 shrink-0">
												<AvatarFallback className="bg-primary text-primary-foreground font-semibold text-xs">
													{latestReviewer
														.split(" ")
														.map((part) => part[0])
														.filter(Boolean)
														.slice(0, 2)
														.join("")
														.toUpperCase()}
												</AvatarFallback>
											</Avatar>
											<div className="flex flex-col min-w-0">
												<span className="text-sm font-semibold text-foreground truncate">
													{latestReviewer}
												</span>
												<span className="text-xs text-muted-foreground truncate">
													Gate #{latestGate?.number} ·{" "}
													{currentStatus.toLowerCase()}
												</span>
											</div>
										</>
									) : (
										<div className="flex flex-col min-w-0">
											<span className="text-sm font-semibold text-foreground truncate">
												Gate #{latestGate?.number ?? "—"}
											</span>
											<span className="text-xs text-muted-foreground truncate">
												{gatesError
													? "Failed to load the gates."
													: gatesLoading
														? "Loading…"
														: "Awaiting the client's decision"}
											</span>
										</div>
									)}
								</div>
							</div>
						</CardContent>
					</Card>
				</div>
			</div>

			{/* Modal 1: Dedicated Gate Feedback Modal */}
			<GateFeedbackGiveModal
				isOpen={isGiveModalOpen}
				onClose={() => setIsGiveModalOpen(false)}
				decisionVariant={decisionVariant}
				gateId={latestGate?.gateId ?? ""}
				stageId={stageId}
			/>

			{/* Modal 2: Gate Feedback History Modal */}
			<GateFeedbackModal
				isOpen={isHistoryOpen}
				onClose={() => setIsHistoryOpen(false)}
				entries={gates}
				onCommentClick={handleOpenDiscussion}
			/>

			{/* Modal 3: Per-gate Discussion (spec 7-8) */}
			<GateDiscussionModal
				gateId={discussionGate?.gateId ?? null}
				stageId={stageId}
				canComment={
					!!discussionGate &&
					!!latestGate &&
					discussionGate.gateId === latestGate.gateId
				}
				onClose={() => setDiscussionGate(null)}
			/>
		</main>
	);
}
