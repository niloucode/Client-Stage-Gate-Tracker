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
	Workflow,
	Ticket,
	ChartGantt,
	LucideIcon,
	Clock,
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
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/toast";
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
	workflowId: string;
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
	onGanttChart?: () => void;
}

// ─── Date Formatting Helpers ──────────────────────────────────────────────────

function formatDate(d: Date | string | null | undefined): string {
	if (!d) return "—";
	return new Date(d).toLocaleDateString("en-US", {
		month: "short",
		day: "numeric",
		year: "numeric",
	});
}

function stageDateRange(stage: Stage): string {
	const start = stage.actualStart ?? stage.planStart;
	const end = stage.actualEnd ?? stage.planEnd;
	if (!start && !end) return "No dates set";
	return `${formatDate(start)} — ${formatDate(end)}`;
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

function ProjectOverviewCard({ progress }: { progress: number }) {
	return (
		<Card className="flex h-full flex-col justify-between border border-warm-gray-200 bg-neutral-surface shadow-xs">
			<CardHeader className="">
				<SectionLabel icon={BarChart2} label="Overall Progress" />
			</CardHeader>
			<CardContent className="flex flex-col">
				<div className="flex items-baseline justify-between">
					<Label>Completion</Label>
					<span className="text-2xl font-bold text-brand-600">{progress}%</span>
				</div>
				<div className="h-7.5 w-full overflow-hidden rounded-sm border border-neutral-border/10 bg-neutral-subtle">
					<div
						className="h-full rounded-sm bg-green-600 transition-all duration-500"
						style={{ width: `${progress}%` }}
					/>
				</div>
			</CardContent>
		</Card>
	);
}

function ProjectTimelineCard({
	startDate,
	endDate,
}: {
	startDate?: Date | null;
	endDate?: Date | null;
}) {
	return (
		<Card className="flex h-full flex-col justify-between border border-warm-gray-200 bg-neutral-surface shadow-xs">
			<CardHeader className="">
				<SectionLabel icon={Clock} label="Project Dates" />
			</CardHeader>
			<CardContent className="">
				<div className="flex flex-row gap-5">
					<div className="flex flex-col">
						<Label>Actual Start</Label>
						<h2>{startDate ? formatDate(startDate) : "Not started"}</h2>
					</div>
					<div className="flex flex-col">
						<Label>Planned End</Label>
						<h2>{endDate ? formatDate(endDate) : "Not set"}</h2>
					</div>
				</div>
			</CardContent>
		</Card>
	);
}

function ProjectAccessCard({
	projectId,
	onViewContract,
	onCredentialsRepo,
	onIssueReport,
	onGanttChart,
}: {
	projectId?: string;
	onViewContract?: () => void;
	onCredentialsRepo?: () => void;
	onIssueReport?: () => void;
	onGanttChart?: () => void;
}) {
	const router = useRouter();

	const handleViewContract =
		onViewContract ??
		(() => {
			if (projectId) router.push(`/projects/${projectId}/contract`);
		});

	const handleCredentials =
		onCredentialsRepo ??
		(() => {
			if (projectId) router.push(`/projects/${projectId}/variables`);
		});

	const handleIssueReport =
		onIssueReport ??
		(() => {
			if (projectId) router.push(`/projects/${projectId}/issues`);
		});

	const handleGanttChart =
		onGanttChart ??
		(() => {
			if (projectId) router.push(`/projects/${projectId}/dashboard-analytics`);
		});

	return (
		<Card className="flex h-full flex-col justify-between border border-warm-gray-200 bg-neutral-surface shadow-xs">
			<CardContent className="flex h-full flex-col justify-center gap-2">
				<Button
					size="sm"
					onClick={handleViewContract}
					variant="outline"
					className="h-8 justify-start gap-2 text-xs"
				>
					<Eye className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
					View Contract
				</Button>
				<Button
					size="sm"
					onClick={handleCredentials}
					variant="outline"
					className="h-8 justify-start gap-2 text-xs"
				>
					<Key className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
					Project Variables
				</Button>
				<Button
					size="sm"
					onClick={handleIssueReport}
					variant="outline"
					className="h-8 justify-start gap-2 text-xs"
				>
					<Bug className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
					Issue Reporting
				</Button>
				<Button
					size="sm"
					onClick={handleGanttChart}
					variant="outline"
					className="h-8 justify-start gap-2 text-xs"
				>
					<ChartGantt className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
					Gantt Chart
				</Button>
			</CardContent>
		</Card>
	);
}

function StatCard({ label, done, total, icon: Icon }: StatItem) {
	return (
		<Card size="sm" className="bg-neutral-surface">
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

function TicketCard({
	ticket_id,
	name,
	workflowId,
	workflowName,
	daysLeft,
	projectId,
}: TicketItem & { projectId?: string }) {
	const expiring = daysLeft <= 2;
	const router = useRouter();

	const openTicket = () => {
		if (!projectId || !workflowId) return;
		router.push(
			`/projects/${projectId}/workflows/${workflowId}?ticket=${ticket_id}`,
		);
	};

	const openTicketOnKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === "Enter" || e.key === " ") {
			e.preventDefault();
			openTicket();
		}
	};

	return (
		<Card
			size="sm"
			role="button"
			tabIndex={0}
			className="border border-warm-gray-200 bg-neutral-surface transition-colors cursor-pointer hover:bg-neutral-subtle/60"
			onClick={openTicket}
			onKeyDown={openTicketOnKeyDown}
			title={`Open ${name}`}
		>
			<CardContent className="flex flex-col justify-between gap-3 px-3 lg:flex-row lg:items-center">
				<div className="flex flex-col align-left gap-2 min-w-0 flex-1">
					<h3 className="truncate">
						{name}
					</h3>
					<Badge
						variant="outline"
						className="shrink-0 gap-1 rounded border-neutral-border/60 bg-neutral-subtle/50 px-2 py-0.5 text-2xs font-semibold text-muted-foreground"
					>
						<Workflow className="h-3 w-3 shrink-0" />
						<span>{workflowName}</span>
					</Badge>
				</div>

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
			className="h-auto w-full rounded-md p-3.5 text-left font-normal border-brand-500/30 bg-neutral-surface text-brand-600 hover:bg-brand-50"
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

// ─── Main Component ───────────────────────────────────────────────────────────

export function ProjectStructure({
	projectId,
	onViewContract,
	onCredentialsRepo,
	onIssueReport,
	onGanttChart,
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
	const isClientProfile = !!profile?.client_id;

	// Stage mapping & selection
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

	// Calculate overall project date range dynamically
	// Calculate overall project date range dynamically
	const overallDateRange = (() => {
		// 1. Check direct project date columns from Prisma
		const actualStart = project?.actual_start_at
			? new Date(project.actual_start_at)
			: null;
		const planEnd = project?.plan_end_at ? new Date(project.plan_end_at) : null;

		if (actualStart || planEnd) {
			return {
				start: actualStart,
				end: planEnd,
			};
		}

		// 2. Fallback: Calculate from stages if project-level dates are not set
		const startTimes = stageItems
			.map((s) => s.actualStart)
			.filter((d): d is Date => Boolean(d))
			.map((d) => new Date(d).getTime());

		const endTimes = stageItems
			.map((s) => s.planEnd)
			.filter((d): d is Date => Boolean(d))
			.map((d) => new Date(d).getTime());

		return {
			start: startTimes.length > 0 ? new Date(Math.min(...startTimes)) : null,
			end: endTimes.length > 0 ? new Date(Math.max(...endTimes)) : null,
		};
	})();

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
			workflowId: t.workflowId,
			workflowName: t.workflowName,
			daysLeft: t.daysLeft,
		}),
	);

	const [stageModalOpen, setStageModalOpen] = useState(false);
	const [stageToEdit, setStageToEdit] = useState<{
		stage_id: string;
		name: string;
		description?: string | null;
		planStart?: Date | null;
		planEnd?: Date | null;
	} | null>(null);

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
		<div className="flex flex-1 flex-col min-w-0 overflow-x-hidden space-y-5">
			<Back link={`/projects`} />

			{/* Page Title */}
			<div>
				<h1 className="text-2xl font-bold tracking-tight text-charcoal sm:text-3xl">
					{project?.name ?? "Untitled Project"}
				</h1>
				<p className="subtitle">
					{(project as unknown as { description?: string })?.description ||
						"Project structure & stage roadmap view"}
				</p>
			</div>

			{/* Top Overview Cards Grid */}
			<div className="grid grid-cols-1 gap-3 md:grid-cols-5 items-stretch">
				<div className="md:col-span-2 flex flex-col h-full">
					<ProjectTimelineCard
						startDate={overallDateRange.start}
						endDate={overallDateRange.end}
					/>
				</div>
				<div className="md:col-span-2 flex flex-col h-full">
					<ProjectOverviewCard progress={computedProgress} />
				</div>
				<div className="md:col-span-1 flex flex-col h-full">
					<ProjectAccessCard
						projectId={projectId}
						onViewContract={onViewContract}
						onCredentialsRepo={onCredentialsRepo}
						onIssueReport={onIssueReport}
						onGanttChart={onGanttChart}
					/>
				</div>
			</div>

			{/* Stage Sequence & Content Card */}
			<Card className="overflow-hidden rounded-md border border-warm-gray-200 bg-neutral-surface shadow-xs">
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

				<div className="border-b border-warm-gray-200 p-5 space-y-5">
					<SectionLabel icon={Calendar} label="Stage Details" />

					<div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
						<div className="flex flex-col items-start gap-4 sm:flex-row sm:gap-4 min-w-0 flex-1">
							<div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-4 border-brand-100 text-2xl font-bold text-brand-600 sm:h-16 sm:w-16 sm:text-3xl">
								{selectedStage?.number ?? "—"}
							</div>
							<div className="min-w-0 flex-1">
								<div className="flex items-center gap-2.5 flex-wrap">
									<h2 className="text-xl font-bold tracking-tight text-charcoal sm:text-2xl">
										{selectedStage?.name ?? "No stage selected"}
									</h2>
									{selectedStage?.approved && (
										<Badge className="border border-green-600/30 bg-green-100 text-green-700 font-bold uppercase text-2xs px-2 py-0.5 rounded-md hover:bg-green-100">
											APPROVED
										</Badge>
									)}
								</div>
								<p className="mt-1 text-xs leading-relaxed text-muted-foreground sm:text-sm">
									{selectedStage?.description ||
										(stages.length === 0
											? "No stages have been created for this project yet. Add a stage to get started."
											: "No description provided for this stage.")}
								</p>
							</div>
						</div>

						<div className="flex shrink-0 items-center gap-2 rounded-md border border-brand-200 bg-brand-50 px-3.5 py-2 text-brand-600 self-start sm:px-4 sm:py-2.5 lg:self-auto">
							<Calendar className="h-3.5 w-3.5 shrink-0" />
							<span className="text-xs font-semibold sm:whitespace-nowrap">
								{selectedStage?.dateRange ?? "No timeline set"}
							</span>
						</div>
					</div>

					<div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
						{statItems.map((stat) => (
							<StatCard key={stat.label} {...stat} />
						))}
					</div>

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

				<CardContent>
					<Card className="bg-neutral-subtle/50">
						<CardHeader>
							<CardTitle>
								Expiring Tickets
							</CardTitle>
							<CardDescription className="text-2xs text-muted-foreground">
								Unfinished tickets with the closest deadlines
							</CardDescription>
						</CardHeader>

						<CardContent className="p-4 pt-1 space-y-2.5">
							<div className="grid grid-cols-1 gap-2.5">
								{expiringTickets.length > 0 ? (
									expiringTickets.map((ticket) => (
										<TicketCard
											key={ticket.ticket_id}
											{...ticket}
											projectId={projectId}
										/>
									))
								) : (
									<div className="py-6 text-center">
										<p className="text-xs text-muted-foreground">
											No expiring tickets found for this project.
										</p>
									</div>
								)}
							</div>
						</CardContent>
					</Card>
				</CardContent>
			</Card>

			{/* Stage Modal (Create / Edit Stage) */}
			<StageModal
				isOpen={stageModalOpen}
				stage={stageToEdit}
				projectId={projectId ?? ""}
				onClose={() => setStageModalOpen(false)}
				onSaved={() => void refreshStageData()}
			/>

			{/* Stage Delete Confirmation Modal */}
			<ConfirmDeleteModal
				isOpen={stageToDelete !== null}
				noun="Stage"
				title={
					stageToDelete ? `Delete Stage?` : undefined
				}
				description={
					stageDeleteError ??
					"This action cannot be undone."
				}
				onConfirm={() => {
					if (!stageToDelete) return;
					const deletedName = stageToDelete.name;
					void cascadeSoftDeleteStage(stageToDelete.id).then((result) => {
						if (result.success) {
							void refreshStageData();
							setSelectedOverride((prev) =>
								prev === stageToDelete.id ? null : prev,
							);
							setStageDeleteError(null);
							setStageToDelete(null);
							toast.add({
								title: "Stage Deleted",
								description: `"${deletedName}" has been deleted successfully.`,
								type: "delete",
							});
						} else {
							const errMsg =
								typeof result.error === "string"
									? result.error
									: "Failed to delete the stage.";
							setStageDeleteError(errMsg);
							toast.add({
								title: "Delete Failed",
								description: errMsg,
								type: "error",
							});
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