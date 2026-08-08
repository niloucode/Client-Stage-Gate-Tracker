"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Key,
  Bug,
  BarChart2,
  LayoutDashboard,
  Calendar,
  CheckSquare,
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
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

import { StageSequence, Stage } from "./StageSequence";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface TicketItem {
  id: string;
  code: string;
  title: string;
  daysLeft: number;
  isUrgent?: boolean;
}

export interface StatItem {
  label: string;
  done: number;
  total: number;
  icon: LucideIcon;
}

export interface ProjectStructureProps {
  projectId?: string;
  projectName?: string;
  showAddStageButton?: boolean;
  onAddStage?: () => void;
  onViewContract?: () => void;
  onCredentialsRepo?: () => void;
  onIssueReport?: () => void;
  onViewGateOverview?: () => void;
  onViewEntireStage?: () => void;
}

// ─── Encapsulated Mock Data ──────────────────────────────────────────────────

const MOCK_DATA = {
  projectName: "BRAND REDESIGN & WEBSITE",
  overallProgress: 85,
  currentStage: {
    number: 2,
    name: "Development & Architecture",
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
    { label: "Phases Done", done: 2, total: 4, icon: CheckSquare },
    { label: "Modules Done", done: 12, total: 15, icon: LayoutDashboard },
    { label: "Workflows Done", done: 8, total: 10, icon: Workflow },
    { label: "Tickets Done", done: 12, total: 15, icon: Ticket },
  ] as StatItem[],
  tickets: [
    { id: "1", code: "DEV-102", title: "Setup OAuth Middleware", daysLeft: 2, isUrgent: true },
    { id: "2", code: "DEV-105", title: "User Profile API Hooks", daysLeft: 4, isUrgent: false },
    { id: "3", code: "DEV-108", title: "Database Migration Plan", daysLeft: 2, isUrgent: true },
    { id: "4", code: "DEV-112", title: "Sanity CMS Schema Setup", daysLeft: 5, isUrgent: false },
  ] as TicketItem[],
};

// ─── Sub-Components ──────────────────────────────────────────────────────────

function SectionLabel({ icon: Icon, label }: { icon: LucideIcon; label: string }) {
  return (
    <div className="flex items-center gap-1.5 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
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
        <CardTitle className="mt-1 text-2xl font-bold leading-tight text-charcoal sm:text-3xl">
          {projectName}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-1 space-y-2">
        <SectionLabel icon={BarChart2} label="Overall Progress" />
        <div className="flex items-baseline gap-1">
          <span className="text-3xl font-bold leading-none text-foreground sm:text-4xl">{progress}</span>
          <span className="text-xl font-semibold text-plum-700 sm:text-2xl">%</span>
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
      <CardContent className="grid grid-cols-1 gap-2.5 p-5 pt-1 sm:grid-cols-3 lg:grid-cols-1">
        <Button
          variant="outline"
          size="sm"
          onClick={onViewContract}
          className="w-full justify-start gap-2 border-brand-600 text-brand-600 hover:bg-brand-50"
        >
          <Eye className="h-3.5 w-3.5 shrink-0" />
          <span>View Contract</span>
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onCredentialsRepo}
          className="w-full justify-start gap-2 border-brand-500 bg-brand-500/10 text-brand-500 hover:bg-brand-500/20"
        >
          <Key className="h-3.5 w-3.5 shrink-0" />
          <span>Credentials Repository</span>
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onIssueReport}
          className="w-full justify-start gap-2 border-red-500/30 bg-red-100 text-red-600 hover:bg-red-500/20"
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
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-brand-500/20 bg-brand-500/10 text-brand-600">
          <Icon className="h-3.5 w-3.5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-semibold text-neutral-border">{label}</p>
          <p className="text-lg font-semibold leading-tight text-brand-600 sm:text-xl">
            {done} <span className="text-xs font-normal text-neutral-border">/ {total}</span>
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

function TicketCard({ code, title, daysLeft, isUrgent }: TicketItem) {
  const urgent = isUrgent || daysLeft <= 2;

  return (
    <Card size="sm" className="border border-warm-gray-200 bg-neutral-surface">
      <CardContent className="flex flex-col justify-between gap-2 p-3 sm:flex-row sm:items-center">
        <div className="flex items-center gap-2.5 min-w-0">
          <Badge
            variant="outline"
            className="shrink-0 rounded border-brand-600 bg-brand-600/5 px-2 py-0.5 text-xs font-bold text-brand-600"
          >
            REPLACE THIS TEXT WITH PARENT WORKFLOW
          </Badge>
          <span className="truncate text-xs font-medium text-charcoal">{title}</span>
        </div>
        <Badge
          variant="secondary"
          className={cn(
            "self-start text-[11px] font-semibold sm:self-auto",
            urgent
              ? "border-red-500/30 bg-red-100 text-red-600 hover:bg-red-100"
              : "border-neutral-border/20 bg-neutral-subtle text-neutral-border"
          )}
        >
          {daysLeft} {daysLeft === 1 ? "DAY LEFT" : "DAYS LEFT"}
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
      className={`h-auto w-full justify-between rounded-xl p-3.5 text-left font-normal ${
        isPrimary
          ? "border-brand-500/30 bg-brand-50/50 text-brand-600 hover:bg-brand-50"
          : "border-warm-gray-200 bg-neutral-surface text-charcoal hover:bg-neutral-subtle/50"
      }`}
      {...props}
    >
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-600 text-white">
          <Icon className="h-4 w-4" />
        </div>
        <div>
          <h4 className="text-xs font-bold">{title}</h4>
          <p className={`text-[11px] ${isPrimary ? "text-plum-700" : "text-neutral-border"}`}>
            {description}
          </p>
        </div>
      </div>
      <ArrowRight className={`h-4 w-4 ${isPrimary ? "" : "text-neutral-border"}`} />
    </Button>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function ProjectStructure({
  projectId,
  projectName = MOCK_DATA.projectName,
  showAddStageButton = true,
  onAddStage,
  onViewContract,
  onCredentialsRepo,
  onIssueReport,
  onViewGateOverview,
  onViewEntireStage,
}: ProjectStructureProps) {
  const [selectedStageId, setSelectedStageId] = useState<string | null>(
    MOCK_DATA.stages.find((s) => s.current)?.id ?? null
  );

  const { currentStage, currentPhase } = MOCK_DATA;

  return (
    <div className="flex flex-1 flex-col min-w-0 overflow-x-hidden">
      {/* Navigation Link */}
      <Link
        href={projectId ? `/projects/${projectId}` : "/projects"}
        className="group mt-1 flex items-center gap-2 text-xl font-bold leading-none text-gray-900 transition-colors hover:text-brand-600"
      >
        <ChevronLeft className="h-5 w-5 transition-transform group-hover:-translate-x-0.5" />
        <span>Back to Projects</span>
      </Link>

      {/* Grid Layout */}
      <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-12">
        {/* Project Overview Card */}
        <div className="lg:col-span-8">
          <ProjectOverviewCard projectName={projectName} progress={MOCK_DATA.overallProgress} />
        </div>

        {/* Project Access Card */}
        <div className="lg:col-span-4">
          <ProjectAccessCard
            onViewContract={onViewContract}
            onCredentialsRepo={onCredentialsRepo}
            onIssueReport={onIssueReport}
          />
        </div>

        {/* Stage Sequence & Detailed Content */}
        <Card className="overflow-hidden rounded-2xl border border-warm-gray-200 bg-neutral-surface shadow-xs lg:col-span-12">
          <div className="border-b border-warm-gray-200 px-4 pb-3">
            <StageSequence
              stages={MOCK_DATA.stages}
              selectedId={selectedStageId}
              onSelectStage={setSelectedStageId}
              onAddStage={onAddStage}
              showAddButton={showAddStageButton}
            />
          </div>

          <CardContent className="pt-2 px-5 pb-5 space-y-5">
            <SectionLabel icon={Calendar} label="Stage Details" />

            {/* Stage Header Details */}
            <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
              <div className="flex flex-col items-start gap-4 sm:flex-row sm:gap-4 min-w-0 flex-1">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-[4px] border-brand-100 text-2xl font-bold text-brand-600 sm:h-16 sm:w-16 sm:text-3xl">
                  {currentStage.number}
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="text-xl font-semibold leading-tight text-charcoal sm:text-2xl">
                    {currentStage.name}
                  </h2>
                  <p className="mt-1 text-xs leading-relaxed text-plum-700 sm:text-sm">
                    {currentStage.description}
                  </p>
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-2 rounded-xl border border-brand-200 bg-brand-50 px-3.5 py-2 text-brand-600 self-start sm:px-4 sm:py-2.5 lg:self-auto">
                <Calendar className="h-3.5 w-3.5 shrink-0" />
                <span className="text-xs font-semibold sm:whitespace-nowrap">
                  {currentStage.dateRange}
                </span>
              </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {MOCK_DATA.stats.map((stat) => (
                <StatCard key={stat.label} {...stat} />
              ))}
            </div>

            {/* Current Phase & Tickets */}
            <Card className="border border-warm-gray-200 bg-neutral-subtle/50">
              <CardHeader className="p-4 pb-2 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <CardTitle className="text-base font-semibold text-charcoal sm:text-lg">
                    {currentPhase.name}
                  </CardTitle>
                  <CardDescription className="mt-0.5 text-xs text-plum-700">
                    {currentPhase.description}
                  </CardDescription>
                </div>
                <CardAction className="self-start sm:self-auto sm:text-right">
                  <p className="text-[10px] font-semibold text-brand-600 uppercase">Progress</p>
                  <p className="text-lg font-semibold text-brand-600 sm:text-xl">{currentPhase.progress}%</p>
                </CardAction>
              </CardHeader>

              <CardContent className="p-4 pt-1 space-y-2.5">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-charcoal">
                  URGENT TICKETS
                </p>
                <div className="grid grid-cols-1 gap-2.5">
                  {MOCK_DATA.tickets.map((ticket) => (
                    <TicketCard key={ticket.id} {...ticket} />
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Stage Actions */}
            <div className="grid grid-cols-1 gap-3 pt-1 md:grid-cols-2">
				<StageActionButton
					title="Preview Stage"
					description="Explore full stage modules & workflow hierarchy"
					icon={Workflow}
					onClick={onViewEntireStage}
					isPrimary
				/>
				<StageActionButton
					title="Preview Gate"
					description="Review mandatory compliance milestones"
					icon={LayoutGrid}
					onClick={onViewGateOverview}
				/>
			</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default ProjectStructure;