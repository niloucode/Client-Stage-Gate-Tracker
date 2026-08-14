"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import {
	Key,
	Bug,
	BarChart2,
	LayoutDashboard,
	Calendar,
	Check,
	ArrowRight,
	LayoutGrid,
	Eye,
	Lock,
	Workflow,
	Ticket,
	LucideIcon,
} from "lucide-react";

import {
	Card,
	CardHeader,
	CardTitle,
	CardDescription,
	CardContent,
} from "@/components/ui/card";
import { Back } from "@/components/ui/back";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ConfirmDeleteModal } from "@/shared/ui";
import { cn } from "@/lib/utils";
import { cascadeSoftDeleteStage, useProjectStages } from "@/entities/stage";
import { useProject, useProjectStats } from "@/entities/project";
import { useCurrentUser } from "@/entities/profile";
import { stageKeys, projectKeys } from "@/shared/query/keys";

import { StageSequence, Stage } from "./StageSequence";
import { StageModal } from "./StageModal";

// ─── Types ───────────────────────────────────────────────────────────────────

interface TicketItem {
	ticket_id: string;
	name: string;
	workflowName: string;
	daysLeft: number;
}

interface StatItem {
	label: string;
	done: number;
	total: number;
	icon: LucideIcon;
}

interface StageDetailsInfo {
	number: number | null;
	name: string;
	approved: boolean;
	description: string;
	dateRange: string;
}

interface ProjectStructureProps {
	projectId?: string;
	onViewContract?: () => void;
	onCredentialsRepo?: () => void;
	onIssueReport?: () => void;
}

// ─── Sub-Components ──────────────────────────────────────────────────────────

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

function ProjectOverviewCard({
	projectName,
	progress,
}: {
	projectName: string;
	progress: number;
}) {
	return (
		<Card className="h-full border border-warm-gray-200 bg-neutral-surface shadow-xs">
			<CardHeader>
				<SectionLabel icon={LayoutDashboard} label="Project Overview" />
				<h2>{projectName}</h2>
			</CardHeader>
			<CardContent className="flex flex-col gap-1 pt-1 mt-6">
				<SectionLabel icon={BarChart2} label="Overall Progress" />
				<h2>{progress}%</h2>
				<div className="h-2.5 w-full overflow-hidden rounded-full border border-neutral-border/10 bg-neutral-subtle">
					<div
						className="h-full rounded-full bg-green-600 transition-all duration-500"
						style={{ width: `${progress}%` }}
					/>
				</div>
			</CardContent>
		</Card>
	);
}

function ProjectAccessCard({
	onViewContract,
	onCredentialsRepo,
	onIssueReport,
}: {
	onViewContract?: () => void;
	onCredentialsRepo?: () => void;
	onIssueReport?: () => void;
}) {
	return (
		<Card className="h-full border border-warm-gray-200 bg-neutral-surface shadow-xs">
			<CardHeader>
				<SectionLabel icon={Lock} label="Project Access" />
			</CardHeader>
			<CardContent className="h-full grid grid-cols-1 gap-2.5 px-4 pt-1 sm:grid-cols-3 lg:grid-cols-1">
				<Button
					size="sm"
					onClick={onViewContract}
					className="w-full h-8 justify-start gap-2 px-2 py-3 text-wrap border border-brand-500/30 bg-brand-100/70 text-xs text-brand-600 shadow-xs transition-all duration-150 hover:border-transparent hover:bg-brand-100 active:bg-brand-100 active:shadow-inner active:translate-y-px"
				>
					<Eye className="h-3.5 w-3.5 shrink-0" />
					<span className="text-wrap">View Contract</span>
				</Button>
				<Button
					size="sm"
					onClick={onCredentialsRepo}
					className="w-full h-8 justify-start gap-2 px-2 py-3 text-wrap border border-green-500/30 bg-green-100/70 text-xs text-green-600 shadow-xs transition-all duration-150 hover:border-transparent hover:bg-green-100 active:bg-green-100 active:shadow-inner active:translate-y-px"
				>
					<Key className="h-3.5 w-3.5 shrink-0" />
					<span className="text-wrap">Project Variables</span>
				</Button>
				<Button
					size="sm"
					onClick={onIssueReport}
					className="w-full h-8 justify-start gap-2 px-2 py-3 border border-red-500/30 bg-red-100/70 text-xs text-red-600 shadow-xs transition-all duration-150 hover:border-transparent hover:bg-red-100 active:bg-red-100 active:shadow-inner active:translate-y-px"
				>
					<Bug className="h-3.5 w-3.5 shrink-0" />
					<span className="text-wrap">Issue Reporting</span>
				</Button>
			</CardContent>
		</Card>
	);
}

function StatCard({ label, done, total, icon: Icon }: StatItem) {
	return (
		<Card size="sm" className=" bg-neutral-surface">
			<CardContent className="flex items-center gap-3.5 p-3.5">
				<div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-brand-500/20 bg-brand-500/10 text-brand-600">
					<Icon className="h-3.5 w-3.5" />
				</div>
				<div className="min-w-0 flex-1">
					<p className="truncate text-2xs font-medium tracking-wide text-muted-foreground uppercase">
						{label}
					</p>
					<p className="text-xl font-bold leading-tight text-brand-600 sm:text-2xl">
						{done}{" "}
						<span className="text-sm font-normal text-muted-foreground">
							/ {total}
						</span>
					</p>
				</div>
			</CardContent>
		</Card>
	);
}

function TicketCard({ name, workflowName, daysLeft }: TicketItem) {
	const expiring = daysLeft <= 2;

	return (
		<Card size="sm" className="border border-warm-gray-200 bg-neutral-surface">
			<CardContent className="flex flex-col justify-between gap-3 p-3 lg:flex-row lg:items-center">
				{/* Left: Workflow Badge & Ticket Title */}
				<div className="flex items-center gap-2.5 min-w-0 flex-1">
					<Badge
						variant="outline"
						className="shrink-0 gap-1 rounded border-neutral-border/60 bg-neutral-subtle/50 px-2 py-0.5 text-2xs font-semibold text-muted-foreground"
					>
						<Workflow className="h-3 w-3 shrink-0" />
						<span>{workflowName}</span>
					</Badge>
					<h4>{name}</h4>
				</div>

				{/* Right: Expiring Tag */}
				<Badge
					variant="secondary"
					className={cn(
						"self-start text-2xs font-semibold lg:self-auto",
						expiring
							? "border-red-500/30 bg-red-100 text-red-600 hover:bg-red-100"
							: "border-neutral-border/20 bg-neutral-subtle text-muted-foreground",
					)}
				>
					{daysLeft}d left
				</Badge>
			</CardContent>
		</Card>
	);
}

function StageActionButton({
	title,
	description,
	icon: Icon,
	isPrimary,
	...props
}: {
	title: string;
	description: string;
	icon: LucideIcon;
	isPrimary?: boolean;
} & React.ComponentProps<typeof Button>) {
	return (
		<Button
			variant="outline"
			className="h-auto w-full rounded-sm! p-3.5 text-left font-normal border-brand-500/30 bg-neutral-surface text-brand-600 hover:bg-brand-50"
			{...props}
		>
			<div className="flex w-full items-center justify-between gap-3 min-w-0">
				<div className="flex items-center gap-3 min-w-0">
					<div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-brand-600 text-white">
						<Icon className="h-4 w-4" />
					</div>
					<div className="min-w-0">
						<h4 className="text-xs font-bold sm:text-sm truncate">{title}</h4>
						<p
							className={`text-[10px] truncate ${isPrimary ? "text-plum-700" : "text-muted-foreground"}`}
						>
							{description}
						</p>
					</div>
				</div>
				<ArrowRight
					className={`h-4 w-4 shrink-0 ${isPrimary ? "" : "text-muted-foreground"}`}
				/>
			</div>
		</Button>
	);
}

// ─── Date formatting ─────────────────────────────────────────────────────────

function formatDate(d: Date | null | undefined): string {
	if (!d) return "—";
	return new Date(d).toLocaleDateString("en-US", {
		month: "short",
		day: "numeric",
		year: "numeric",
	});
}

function stageDateRange(stage: Stage): string {
	// Show actual dates once they are materialized (contract signing / gate
	// approval); fall back to the planned window.
	const start = stage.actualStart ?? stage.planStart;
	const end = stage.actualEnd ?? stage.planEnd;
	if (!start && !end) return "No dates set";
	return `${formatDate(start)} — ${formatDate(end)}`;
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function ProjectStructure({
	projectId,
	onViewContract,
	onCredentialsRepo,
	onIssueReport,
}: ProjectStructureProps) {
	const router = useRouter();
	const queryClient = useQueryClient();

	const { data: project, isPending: projectPending } = useProject(
		projectId ?? null,
	);
	const { data: stages = [], isPending: stagesPending } =
		useProjectStages(projectId);
	const { data: stats } = useProjectStats(projectId ?? null);
	const { data: profile } = useCurrentUser();
	// Spec 5: client profiles (linked via the contract) are read-only here.
	const isClientProfile = !!profile?.client_id;

	// Real stage list (ordered by number server-side); mark the current stage
	// as the first unapproved one (or the last stage when all are approved).
	const stageItems: Stage[] = stages.map((s) => ({
		...s,
		current: false,
	}));
	const firstUnapprovedIndex = stageItems.findIndex((s) => !s.approved);
	const currentIndex =
		firstUnapprovedIndex >= 0 ? firstUnapprovedIndex : stageItems.length - 1;
	if (currentIndex >= 0) {
		stageItems[currentIndex] = {
			...stageItems[currentIndex],
			current: true,
		};
	}

	// Selection: user override while on the page, defaulting to the current
	// stage once data arrives (derived — no effect needed). If the override
	// no longer exists in the live list (e.g. deleted in another session),
	// fall back to the default so the overview never shows a dead stage.
	const [selectedOverride, setSelectedOverride] = useState<string | null>(null);
	const defaultStageId =
		currentIndex >= 0 ? stageItems[currentIndex].stage_id : null;
	const selectedStageId =
		selectedOverride && stageItems.some((s) => s.stage_id === selectedOverride)
			? selectedOverride
			: defaultStageId;

	const computedProgress =
		stageItems.length > 0
			? Math.round(
					(stageItems.filter((s) => s.approved).length / stageItems.length) *
						100,
				)
			: 0;

	// The Stage Details section follows the Stepper selection — mirrors the
	// phase stepper pattern (currentPhase = phases.find(p => p.number ===
	// activePhase)): clicking a stage node swaps the overview below.
	const selectedStage: StageDetailsInfo | null = (() => {
		const stage = stageItems.find((s) => s.stage_id === selectedStageId);
		if (!stage) return null;
		return {
			number: stage.number,
			name: stage.name,
			approved: stage.approved,
			description: stage.description ?? "",
			dateRange: stageDateRange(stage),
		};
	})();

	const statItems: StatItem[] = stats
		? [
				{
					label: "Phases Done",
					done: stats.phases.done,
					total: stats.phases.total,
					icon: Check,
				},
				{
					label: "Modules Done",
					done: stats.modules.done,
					total: stats.modules.total,
					icon: LayoutDashboard,
				},
				{
					label: "Workflows Done",
					done: stats.workflows.done,
					total: stats.workflows.total,
					icon: Workflow,
				},
				{
					label: "Tickets Done",
					done: stats.tickets.done,
					total: stats.tickets.total,
					icon: Ticket,
				},
			]
		: [];

	const expiringTickets: TicketItem[] = (stats?.expiringTickets ?? []).map(
		(t) => ({
			ticket_id: t.ticket_id,
			name: t.name,
			workflowName: t.workflowName,
			daysLeft: t.daysLeft,
		}),
	);

	// Add/Edit Stage modal state
	const [stageModalOpen, setStageModalOpen] = useState(false);
	const [stageToEdit, setStageToEdit] = useState<{
		stage_id: string;
		name: string;
		description?: string | null;
		planStart?: Date | null;
		planEnd?: Date | null;
	} | null>(null);

	// Delete confirmation state (subtree soft-delete)
	const [stageToDelete, setStageToDelete] = useState<{
		id: string;
		name: string;
	} | null>(null);
	const [stageDeleteError, setStageDeleteError] = useState<string | null>(null);

	const refreshStageData = async () => {
		if (!projectId) return;
		await queryClient.invalidateQueries({
			queryKey: stageKeys.list(projectId),
		});
		await queryClient.invalidateQueries({
			queryKey: projectKeys.stats(projectId),
		});
	};

	if (projectPending || stagesPending) {
		return (
			<div className="flex flex-1 items-center justify-center min-h-screen">
				<p className="text-sm text-muted-foreground">
					Loading project structure…
				</p>
			</div>
		);
	}

	return (
		<div className="flex flex-1 flex-col min-w-0 overflow-x-hidden">
			{/* Navigation Link */}
			<Back link={`/projects`} />

			{/* Grid Layout */}
			<div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-12">
				{/* Project Overview Card */}
				<div className="lg:col-span-10">
					<ProjectOverviewCard
						projectName={project?.name ?? "Untitled Project"}
						progress={computedProgress}
					/>
				</div>

				{/* Project Access Card */}
				<div className="lg:col-span-2">
					<ProjectAccessCard
						onViewContract={onViewContract}
						onCredentialsRepo={onCredentialsRepo}
						onIssueReport={onIssueReport}
					/>
				</div>

				{/* Stage Sequence & Detailed Content */}
				<Card className="overflow-hidden rounded-md border border-warm-gray-200 bg-neutral-surface shadow-xs lg:col-span-10">
					{/* Stage Sequence Header */}
					<div className="border-b border-warm-gray-200 px-4">
						<StageSequence
							stages={stageItems}
							selectedId={selectedStageId}
							onSelectStage={setSelectedOverride}
							onAddStage={() => {
								setStageToEdit(null);
								setStageModalOpen(true);
							}}
							onEditStage={
								isClientProfile
									? undefined
									: (id) => {
											const s = stageItems.find((x) => x.stage_id === id);
											if (s) {
												setStageToEdit({
													stage_id: s.stage_id,
													name: s.name,
													description: s.description,
													planStart: s.planStart,
													planEnd: s.planEnd,
												});
												setStageModalOpen(true);
											}
										}
							}
							onDeleteStage={
								isClientProfile
									? undefined
									: (id) => {
											const s = stageItems.find((x) => x.stage_id === id);
											setStageDeleteError(null);
											setStageToDelete(
												s ? { id: s.stage_id, name: s.name } : { id, name: "" },
											);
										}
							}
							showAddButton={!isClientProfile}
						/>
					</div>

					{/* Stage Details & Stage Actions Section (Full Bleed Border-B) */}
					<div className="border-b border-warm-gray-200 p-5 pb-9 space-y-5">
						<SectionLabel icon={Calendar} label="Stage Details" />

						{/* Stage Header Details */}
						<div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
							<div className="flex flex-col items-start gap-4 sm:flex-row sm:gap-4 min-w-0 flex-1">
								<div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-4 border-brand-100 text-2xl font-bold text-brand-600 sm:h-16 sm:w-16 sm:text-3xl">
									{selectedStage?.number ?? "—"}
								</div>
								<div className="min-w-0 flex-1">
									<div className="flex items-center gap-2.5 flex-wrap">
										<h2 className="text-xl font-bold tracking-tight text-charcoal sm:text-2xl">
											{selectedStage?.name ?? "No stages yet"}
										</h2>
										{selectedStage?.approved && (
											<Badge className="border border-green-600/30 bg-green-100 text-green-700 font-bold uppercase text-2xs px-2 py-0.5 rounded-md hover:bg-green-100">
												APPROVED
											</Badge>
										)}
									</div>
									<p className="mt-1 text-xs leading-relaxed text-muted-foreground sm:text-sm">
										{selectedStage?.description}
									</p>
								</div>
							</div>

							<div className="flex shrink-0 items-center gap-2 rounded-md border border-brand-200 bg-brand-50 px-3.5 py-2 text-brand-600 self-start sm:px-4 sm:py-2.5 lg:self-auto">
								<Calendar className="h-3.5 w-3.5 shrink-0" />
								<span className="text-xs font-semibold sm:whitespace-nowrap">
									{selectedStage?.dateRange}
								</span>
							</div>
						</div>

						{/* Stats Overview */}
						<div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
							{statItems.map((stat) => (
								<StatCard key={stat.label} {...stat} />
							))}
						</div>

						{/* Stage Actions */}
						<div className="grid grid-cols-1 gap-3 pt-1 md:grid-cols-2">
							<StageActionButton
								title="Preview Stage"
								description="Explore full stage modules & workflow hierarchy"
								icon={Workflow}
								onClick={() =>
									projectId &&
									selectedStageId &&
									router.push(
										`/projects/${projectId}/stages/${selectedStageId}`,
									)
								}
								isPrimary
							/>
							<StageActionButton
								title="Preview Gate"
								description="Review mandatory compliance milestones"
								icon={LayoutGrid}
								onClick={() =>
									projectId &&
									selectedStageId &&
									router.push(
										`/projects/${projectId}/stages/${selectedStageId}/gate`,
									)
								}
							/>
						</div>
					</div>

					{/* Current Phase & Expiring Tickets Section */}
					<CardContent className="p-5 space-y-5">
						<Card className="border border-warm-gray-200 bg-neutral-subtle/50">
							<CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
								<div>
									<CardTitle>
										<h3>Expiring Tickets</h3>
									</CardTitle>
									<CardDescription className="mt-0.5 text-xs text-muted-foreground">
										Unfinished tickets with the closest deadlines
									</CardDescription>
								</div>
							</CardHeader>

							<CardContent className="p-4 pt-1 space-y-2.5">
								<div className="grid grid-cols-1 gap-2.5">
									{expiringTickets.length > 0 ? (
										expiringTickets.map((ticket) => (
											<TicketCard key={ticket.ticket_id} {...ticket} />
										))
									) : (
										<p className="text-xs text-muted-foreground">
											No expiring tickets.
										</p>
									)}
								</div>
							</CardContent>
						</Card>
					</CardContent>
				</Card>
			</div>

			{/* Add/Edit Stage modal */}
			<StageModal
				isOpen={stageModalOpen}
				stage={stageToEdit}
				projectId={projectId ?? ""}
				onClose={() => setStageModalOpen(false)}
				onSaved={() => void refreshStageData()}
			/>

			{/* Stage delete confirmation (subtree soft-delete) */}
			<ConfirmDeleteModal
				isOpen={stageToDelete !== null}
				noun="Stage"
				title={
					stageToDelete ? `Delete Stage "${stageToDelete.name}"?` : undefined
				}
				description={
					stageDeleteError ??
					"This soft-deletes the stage and its entire subtree (phases, modules, workflows, tickets). This action cannot be undone."
				}
				onConfirm={() => {
					if (!stageToDelete) return;
					void cascadeSoftDeleteStage(stageToDelete.id).then((result) => {
						if (result.success) {
							void refreshStageData();
							setSelectedOverride((prev) =>
								prev === stageToDelete.id ? null : prev,
							);
							setStageDeleteError(null);
							setStageToDelete(null);
						} else {
							setStageDeleteError(
								typeof result.error === "string"
									? result.error
									: "Failed to delete the stage.",
							);
						}
					});
				}}
				onCancel={() => {
					setStageDeleteError(null);
					setStageToDelete(null);
				}}
			/>
		</div>
	);
}
