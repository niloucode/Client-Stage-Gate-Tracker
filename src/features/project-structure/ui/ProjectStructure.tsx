"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
  ChevronLeft,
  LucideIcon,
} from "lucide-react";

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardAction,
} from "@/components/ui/card";
import { Back } from "@/components/ui/back"
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ConfirmDeleteModal } from "@/shared/ui";
import {
  Avatar,
  AvatarImage,
  AvatarFallback,
  AvatarGroup,
} from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { cascadeSoftDeleteStage } from "@/entities/stage/stageActions";

import { StageSequence, Stage } from "./StageSequence";
import { StageModal } from "./StageModal";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface UserProfile {
  id: string;
  name: string;
  initials?: string;
  avatar?: string;
}

export interface TicketItem {
  id: string;
  code: string;
  title: string;
  workflowName: string;
  daysLeft: number;
  isExpiring?: boolean;
  isUrgent?: boolean;
  assignees?: UserProfile[];
  watcher?: UserProfile;
}

export interface StatItem {
  label: string;
  done: number;
  total: number;
  icon: LucideIcon;
}

export interface StageDetailsInfo {
  number: number;
  name: string;
  approved?: boolean;
  description: string;
  dateRange: string;
}

export interface PhaseInfo {
  name: string;
  description: string;
  progress: number;
}

export interface ProjectStructureProps {
  projectId?: string;
  projectName?: string;
  overallProgress?: number;
  currentStage?: StageDetailsInfo;
  currentPhase?: PhaseInfo;
  stages?: Stage[];
  stats?: StatItem[];
  tickets?: TicketItem[];
  showAddStageButton?: boolean;
  onViewContract?: () => void;
  onCredentialsRepo?: () => void;
  onIssueReport?: () => void;
}

// ─── Default Mock Data ───────────────────────────────────────────────────────

const DEFAULT_TICKETS: TicketItem[] = [
  {
    id: "1",
    code: "DEV-102",
    title: "Setup OAuth Middleware",
    workflowName: "Auth Workflow",
    daysLeft: 2,
    isExpiring: true,
    assignees: [
      { id: "u1", name: "Alex Chen", initials: "AC" },
      { id: "u2", name: "Sarah Jenkins", initials: "SJ" },
      { id: "u3", name: "Michael Todd", initials: "MT" },
    ],
    watcher: { id: "u4", name: "David Kim", initials: "DK" },
  },
  {
    id: "2",
    code: "DEV-105",
    title: "User Profile API Hooks",
    workflowName: "API Module",
    daysLeft: 4,
    isExpiring: false,
    assignees: [
      { id: "u1", name: "Alex Chen", initials: "AC" },
      { id: "u5", name: "Emma Watson", initials: "EW" },
    ],
    watcher: { id: "u2", name: "Sarah Jenkins", initials: "SJ" },
  },
  {
    id: "3",
    code: "DEV-108",
    title: "Database Migration Plan",
    workflowName: "Core Database",
    daysLeft: 2,
    isExpiring: true,
    assignees: [{ id: "u3", name: "Michael Todd", initials: "MT" }],
    watcher: { id: "u1", name: "Alex Chen", initials: "AC" },
  },
];

const DEFAULT_MOCK_DATA = {
  projectName: "BRAND REDESIGN & WEBSITE",
  overallProgress: 85,
  currentStage: {
    number: 2,
    name: "Development & Architecture",
    approved: true,
    description:
      "Transitioning from strategy to execution. This stage focuses on technical implementation of the brand redesign and CMS integration.",
    dateRange: "OCT 12, 2023 — NOV 30, 2023",
  },
  currentPhase: {
    name: "Phase 3: Backend Integration",
    description: "Executing API hooks and core CMS functionalities for the landing experience.",
    progress: 60,
  },
  stages: [
    { id: "1", stageNumber: 1, stageName: "Discovery & UX", approved: true },
    { id: "2", stageNumber: 2, stageName: "Visual Identity", approved: true, current: true },
    { id: "3", stageNumber: 3, stageName: "Core Page Design", approved: false },
    { id: "4", stageNumber: 4, stageName: "Development", approved: false },
  ] as Stage[],
  stats: [
    { label: "Phases Done", done: 2, total: 4, icon: Check },
    { label: "Modules Done", done: 12, total: 15, icon: LayoutDashboard },
    { label: "Workflows Done", done: 8, total: 10, icon: Workflow },
    { label: "Tickets Done", done: 12, total: 15, icon: Ticket },
  ] as StatItem[],
};

// ─── Sub-Components ──────────────────────────────────────────────────────────

function SectionLabel({ icon: Icon, label }: { icon: LucideIcon; label: string }) {
  return (
    <div className="flex items-center gap-1.5 text-2xs font-semibold tracking-wider text-muted-foreground uppercase">
      <Icon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
      <span>{label}</span>
    </div>
  );
}

function ProjectOverviewCard({ projectName, progress }: { projectName: string; progress: number }) {
  return (
    <Card className="h-full border border-warm-gray-200 bg-neutral-surface shadow-xs">
      <CardHeader>
        <SectionLabel icon={LayoutDashboard} label="Project Overview" />
        <CardTitle className="mt-1 text-2xl font-bold tracking-tight text-charcoal sm:text-3xl">
          {projectName}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-1 space-y-2">
        <SectionLabel icon={BarChart2} label="Overall Progress" />
        <div className="flex items-baseline gap-1">
          <span className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">{progress}</span>
          <span className="text-xl font-semibold text-muted-foreground sm:text-2xl">%</span>
        </div>
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
        className="w-full justify-start gap-2 truncate border border-brand-500/30 bg-brand-100/70 text-xs font-semibold text-brand-600 shadow-xs transition-all duration-150 hover:border-transparent hover:bg-brand-100 active:bg-brand-100 active:shadow-inner active:translate-y-px"
      >
        <Eye className="h-3.5 w-3.5 shrink-0" />
        <span>View Contract</span>
      </Button>
      <Button
        size="sm"
        onClick={onCredentialsRepo}
        className="w-full justify-start gap-2 truncate border border-green-500/30 bg-green-100/70 text-xs font-semibold text-green-600 shadow-xs transition-all duration-150 hover:border-transparent hover:bg-green-100 active:bg-green-100 active:shadow-inner active:translate-y-px"
      >
        <Key className="h-3.5 w-3.5 shrink-0" />
        <span>Credentials Repository</span>
      </Button>
      <Button
        size="sm"
        onClick={onIssueReport}
        className="w-full justify-start gap-2 truncate border border-red-500/30 bg-red-100/70 text-xs font-semibold text-red-600 shadow-xs transition-all duration-150 hover:border-transparent hover:bg-red-100 active:bg-red-100 active:shadow-inner active:translate-y-px"
      >
        <Bug className="h-3.5 w-3.5 shrink-0" />
        <span>Issue Reporting</span>
      </Button>
    </CardContent>
  </Card>
);
}

function StatCard({ label, done, total, icon: Icon }: StatItem) {
  return (
    <Card size="sm" className="border border-warm-gray-200 bg-neutral-surface shadow-xs">
      <CardContent className="flex items-center gap-3.5 p-3.5">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-brand-500/20 bg-brand-500/10 text-brand-600">
          <Icon className="h-3.5 w-3.5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-2xs font-medium tracking-wide text-muted-foreground uppercase">{label}</p>
          <p className="text-xl font-bold leading-tight text-brand-600 sm:text-2xl">
            {done} <span className="text-xs font-normal text-muted-foreground">/ {total}</span>
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

function TicketCard({ title, workflowName, daysLeft, isExpiring, isUrgent, assignees = [], watcher }: TicketItem) {
  const expiring = isExpiring ?? isUrgent ?? daysLeft <= 2;

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
          <span className="truncate text-xs font-medium text-charcoal sm:text-sm">{title}</span>
        </div>

        {/* Center: Assignees & Watcher Profile */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Assignees Group */}
          {assignees.length > 0 && (
            <AvatarGroup>
              {assignees.map((user) => (
                <Avatar key={user.id} size="sm" title={user.name}>
                  {user.avatar && <AvatarImage src={user.avatar} alt={user.name} />}
                  <AvatarFallback className="bg-brand-600 text-neutral-surface font-semibold text-2xs">
                    {user.initials}
                  </AvatarFallback>
                </Avatar>
              ))}
            </AvatarGroup>
          )}

          {/* Watcher with Eye Icon */}
          {watcher && (
            <div className="flex items-center gap-1.5 border-l border-warm-gray-200 pl-3">
              <Eye className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              <Avatar size="sm" title={watcher.name}>
                {watcher.avatar && <AvatarImage src={watcher.avatar} alt={watcher.name} />}
                <AvatarFallback className="bg-brand-600 text-neutral-surface font-semibold text-2xs">
                  {watcher.initials}
                </AvatarFallback>
              </Avatar>
            </div>
          )}
        </div>

        {/* Right: Expiring Tag */}
        <Badge
          variant="secondary"
          className={cn(
            "self-start text-2xs font-semibold lg:self-auto",
            expiring
              ? "border-red-500/30 bg-red-100 text-red-600 hover:bg-red-100"
              : "border-neutral-border/20 bg-neutral-subtle text-muted-foreground"
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
      className={`h-auto w-full rounded-md p-3.5 text-left font-normal ${
        isPrimary
          ? "border-brand-500/30 bg-brand-50/50 text-brand-600 hover:bg-brand-50"
          : "border-warm-gray-200 bg-neutral-surface text-charcoal hover:bg-neutral-subtle/50"
      }`}
      {...props}
    >
      <div className="flex w-full items-center justify-between gap-3 min-w-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-brand-600 text-white">
            <Icon className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <h4 className="text-xs font-bold sm:text-sm truncate">{title}</h4>
            <p className={`text-[10px] truncate ${isPrimary ? "text-plum-700" : "text-muted-foreground"}`}>
              {description}
            </p>
          </div>
        </div>
        <ArrowRight className={`h-4 w-4 shrink-0 ${isPrimary ? "" : "text-muted-foreground"}`} />
      </div>
    </Button>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function ProjectStructure({
  projectId,
  projectName = DEFAULT_MOCK_DATA.projectName,
  overallProgress = DEFAULT_MOCK_DATA.overallProgress,
  currentStage = DEFAULT_MOCK_DATA.currentStage,
  currentPhase = DEFAULT_MOCK_DATA.currentPhase,
  stages = DEFAULT_MOCK_DATA.stages,
  stats = DEFAULT_MOCK_DATA.stats,
  tickets = DEFAULT_TICKETS,
  showAddStageButton = true,
  onViewContract,
  onCredentialsRepo,
  onIssueReport,
}: ProjectStructureProps) {
  const [selectedStageId, setSelectedStageId] = useState<string | null>(
    stages.find((s) => s.current)?.id ?? null
  );
  const router = useRouter();
  // Local copy so stage deletion can be reflected in the mock list.
  const [visibleStages, setVisibleStages] = useState(stages);

  // Progress formula (Task 5.6): Total Stages Done / Total Stages.
  // Falls back to the explicit prop when no stages are supplied.
  const computedProgress =
    visibleStages.length > 0
      ? Math.round(
          (visibleStages.filter((s) => s.approved).length /
            visibleStages.length) *
            100,
        )
      : overallProgress;

  // Add/Edit Stage modal state (Task 5.7)
  const [stageModalOpen, setStageModalOpen] = useState(false);
  const [stageToEdit, setStageToEdit] = useState<{
    stage_id: string;
    name: string;
    description?: string | null;
    planStart?: Date | null;
    planEnd?: Date | null;
    actualStart?: Date | null;
    actualEnd?: Date | null;
  } | null>(null);

  // Delete confirmation state (review fix: subtree delete needs a confirm)
  const [stageToDelete, setStageToDelete] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [stageDeleteError, setStageDeleteError] = useState<string | null>(
    null,
  );

  return (
    <div className="flex flex-1 flex-col min-w-0 overflow-x-hidden">
      {/* Navigation Link */}
      	<Back link={`/projects`}/>

      {/* Grid Layout */}
      <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-12">
        {/* Project Overview Card */}
        <div className="lg:col-span-10">
          <ProjectOverviewCard projectName={projectName} progress={computedProgress} />
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
          <div className="border-b border-warm-gray-200 px-4 pb-7">
            <StageSequence
              stages={visibleStages}
              selectedId={selectedStageId}
              onSelectStage={setSelectedStageId}
              onAddStage={() => {
                setStageToEdit(null);
                setStageModalOpen(true);
              }}
              onEditStage={(id) => {
                const s = visibleStages.find((x) => x.id === id);
                if (s) {
                  setStageToEdit({
                    stage_id: id,
                    name: s.stageName,
                    description: s.description,
                    planStart: s.planStart,
                    planEnd: s.planEnd,
                    actualStart: s.actualStart,
                    actualEnd: s.actualEnd,
                  });
                  setStageModalOpen(true);
                }
				}}
				onDeleteStage={(id) => {
					const s = visibleStages.find((x) => x.id === id);
					setStageDeleteError(null);
					setStageToDelete(s ? { id, name: s.stageName } : { id, name: "" });
				}}
				showAddButton={showAddStageButton}
            />
          </div>

          {/* Stage Details & Stage Actions Section (Full Bleed Border-B) */}
          <div className="border-b border-warm-gray-200 p-5 pb-9 space-y-5">
            <SectionLabel icon={Calendar} label="Stage Details" />

            {/* Stage Header Details */}
            <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
              <div className="flex flex-col items-start gap-4 sm:flex-row sm:gap-4 min-w-0 flex-1">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-[4px] border-brand-100 text-2xl font-bold text-brand-600 sm:h-16 sm:w-16 sm:text-3xl">
                  	{currentStage.number}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <h2 className="text-xl font-bold tracking-tight text-charcoal sm:text-2xl">
                      	{currentStage.name}
                    </h2>
                    {currentStage.approved && (
						<Badge className="border border-green-600/30 bg-green-100 text-green-700 font-bold uppercase text-2xs px-2 py-0.5 rounded-md hover:bg-green-100">
							APPROVED
						</Badge>
                    )}
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground sm:text-sm">
                    {currentStage.description}
                  </p>
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-2 rounded-md border border-brand-200 bg-brand-50 px-3.5 py-2 text-brand-600 self-start sm:px-4 sm:py-2.5 lg:self-auto">
                <Calendar className="h-3.5 w-3.5 shrink-0" />
                <span className="text-xs font-semibold sm:whitespace-nowrap">
                  {currentStage.dateRange}
                </span>
              </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {stats.map((stat) => (
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
                  router.push(`/projects/${projectId}/stages/${selectedStageId}`)
                }
                isPrimary
              />
              <StageActionButton
                title="Preview Gate"
                description="Review mandatory compliance milestones"
                icon={LayoutGrid}
                onClick={() =>
                  projectId && router.push(`/projects/${projectId}`)
                }
              />
            </div>
          </div>

          {/* Current Phase & Expiring Tickets Section */}
          <CardContent className="p-5 space-y-5">
            <Card className="border border-warm-gray-200 bg-neutral-subtle/50">
              <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <CardTitle className="text-base font-bold text-charcoal sm:text-lg">
                    {currentPhase.name}
                  </CardTitle>
                  <CardDescription className="mt-0.5 text-xs text-muted-foreground">
                    {currentPhase.description}
                  </CardDescription>
                </div>

                {/* Phase Progress Bar & % */}
                <CardAction className="self-start sm:self-auto sm:text-right min-w-[120px]">
                  <p className="text-2xs font-semibold tracking-wider text-muted-foreground uppercase">Progress</p>
                  <p className="text-xl font-bold text-brand-600 sm:text-2xl">{currentPhase.progress}%</p>
                  <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-neutral-subtle">
                    <div
                      className="h-full rounded-full bg-brand-600 transition-all duration-500"
                      style={{ width: `${currentPhase.progress}%` }}
                    />
                  </div>
                </CardAction>
              </CardHeader>

              <CardContent className="p-4 pt-1 space-y-2.5">
                <p className="text-2xs font-semibold tracking-wider text-muted-foreground uppercase">
                  EXPIRING TICKETS
                </p>
                <div className="grid grid-cols-1 gap-2.5">
                  {tickets.map((ticket) => (
                    <TicketCard key={ticket.id} {...ticket} />
                  ))}
                </div>
              </CardContent>
            </Card>
          </CardContent>
        </Card>
      </div>

      {/* Add/Edit Stage modal (Task 5.7) */}
      <StageModal
        isOpen={stageModalOpen}
        stage={stageToEdit}
        projectId={projectId ?? ""}
        onClose={() => setStageModalOpen(false)}
        onSaved={(saved) => {
          // Reflect create/edit in the local view until real stage data
          // integration lands (review fix).
          if (!stageToEdit) {
            // Create mode: append the newly created stage.
            setVisibleStages((prev) => [
              ...prev,
              {
                id: saved.stage_id,
                stageNumber: prev.length + 1,
                stageName: saved.name,
                approved: false,
              },
            ]);
            return;
          }
          setVisibleStages((prev) =>
            prev.map((s) =>
              s.id === stageToEdit.stage_id
                ? { ...s, stageName: stageToEdit.name }
                : s,
            ),
          );
        }}
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
              // Remove from the local view; real stage data integration
              // replaces the mock list.
              setVisibleStages((prev) =>
                prev.filter((s) => s.id !== stageToDelete.id),
              );
              // Clear the selection if the deleted stage was selected so
              // "Preview Stage" can't navigate to a deleted stage.
              setSelectedStageId((prev) =>
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

export default ProjectStructure;