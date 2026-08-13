"use client";

import { useState } from "react";
import {
  History,
  FileText,
  ArrowRight,
  ChevronDown,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { GateFeedbackModal, type GateFeedbackEntry } from "./GateFeedbackModal";
import { GateFeedbackGiveModal } from "./GateFeedbackGiveModal";

// Dummy phase/module/workflow data with completion status
const phases = [
  {
    title: "Phase 1: Discovery & Audit",
    description:
      "Comprehensive review of existing assets and competitor landscape.",
    dateRange: "Oct 01, 2024 – Oct 15, 2024",
    completed: true,
    modules: [
      {
        title: "Module 1: Brand Sentiment Analysis",
        dateRange: "Oct 01, 2024 – Oct 08, 2024",
        completed: true,
        workflows: [
          { title: "Workflow: Survey Distribution", dateRange: "Oct 01 – Oct 04", completed: true },
          { title: "Workflow: Data Synthesis", dateRange: "Oct 05 – Oct 08", completed: true },
        ],
      },
      {
        title: "Module 2: Competitive Benchmarking",
        dateRange: "Oct 09, 2024 – Oct 15, 2024",
        completed: true,
        workflows: [
          { title: "Workflow: Visual Audit", dateRange: "Oct 09 – Oct 15", completed: true },
        ],
      },
    ],
  },
  {
    title: "Phase 2: Concept Development",
    description: undefined,
    dateRange: "Oct 16, 2024 – Oct 31, 2024",
    completed: false,
    modules: [
      {
        title: "Module 1: Core Style Guide",
        dateRange: "Oct 16, 2024 – Oct 31, 2024",
        completed: false,
        workflows: [
          { title: "Workflow: Color Tokens", dateRange: "Oct 16 – Oct 23", completed: true },
          { title: "Workflow: Iconography Set", dateRange: "Oct 24 – Oct 31", completed: false },
        ],
      },
    ],
  },
  {
    title: "Phase 3: Production & QA",
    description: "Final build-out, review passes, and pre-launch QA.",
    dateRange: "Nov 01, 2024 – Nov 14, 2024",
    completed: false,
    modules: [
      {
        title: "Module 1: Asset Production",
        dateRange: "Nov 01, 2024 – Nov 08, 2024",
        completed: false,
        workflows: [
          { title: "Workflow: Illustration Pass", dateRange: "Nov 01 – Nov 04", completed: false },
          { title: "Workflow: Motion Assets", dateRange: "Nov 05 – Nov 08", completed: false },
        ],
      },
      {
        title: "Module 2: Quality Assurance",
        dateRange: "Nov 09, 2024 – Nov 14, 2024",
        completed: false,
        workflows: [
          { title: "Workflow: Accessibility Audit", dateRange: "Nov 09 – Nov 11", completed: false },
          { title: "Workflow: Cross-browser Testing", dateRange: "Nov 12 – Nov 14", completed: false },
        ],
      },
    ],
  },
  {
    title: "Phase 4: Launch & Handoff",
    description: "Deployment, final signoff, and operational documentation.",
    dateRange: "Nov 15, 2024 – Nov 30, 2024",
    completed: false,
    modules: [
      {
        title: "Module 1: Production Deployment",
        dateRange: "Nov 15, 2024 – Nov 22, 2024",
        completed: false,
        workflows: [
          { title: "Workflow: Server Configuration", dateRange: "Nov 15 – Nov 18", completed: false },
          { title: "Workflow: DNS Cutover", dateRange: "Nov 19 – Nov 22", completed: false },
        ],
      },
    ],
  },
];

function PhaseCell({ phase }: { phase: (typeof phases)[number] }) {
  const [isExpanded, setIsExpanded] = useState(!phase.completed);

  return (
    <div className="flex flex-col">
      {/* Phase Header */}
      <div
        onClick={() => setIsExpanded((prev) => !prev)}
        className="flex items-center justify-between gap-3 cursor-pointer select-none group/phase hover:opacity-90 transition-opacity"
      >
        <div className="relative z-10 flex shrink-0 items-center justify-center rounded-full border-y-[10px] border-neutral-surface bg-neutral-surface">
          <ArrowRight className="size-4 text-primary" />
        </div>
        <div className="flex w-full items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <h2 className={cn(phase.completed && "line-through text-muted-foreground font-normal")}>
              {phase.title}
            </h2>
            {phase.completed && (
              <Badge variant="outline" className="bg-emerald-100/80 text-emerald-800 text-[10px] py-0.5 px-2 font-semibold">
                Completed
              </Badge>
            )}
            <ChevronDown
              className={cn(
                "size-5 text-muted-foreground transition-transform duration-300 ease-in-out",
                !isExpanded && "-rotate-90"
              )}
            />
          </div>
          <div className="my-auto ml-auto flex flex-col whitespace-nowrap text-sm text-muted-foreground">
            <div className="ml-auto">PLANNED: {phase.dateRange}</div>
            <div className="ml-auto">ACTUAL: {phase.dateRange}</div>
          </div>
        </div>
      </div>

      {/* Smooth Grid Accordion Container */}
      <div
        className={cn(
          "grid transition-[grid-template-rows,opacity] duration-300 ease-in-out pl-6",
          isExpanded
            ? "grid-rows-[1fr] opacity-100"
            : "grid-rows-[0fr] opacity-0 pointer-events-none"
        )}
      >
        <div className="overflow-hidden flex flex-col gap-4 pt-2">
          {phase.description && (
            <p className="subtitle">
              {phase.description}
            </p>
          )}

          <div className="flex flex-col gap-4">
            {phase.modules.map((mod) => (
              <ModuleCell key={mod.title} {...mod} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// --- Sub-Components using Shadcn Card UI ---

function ModuleCell({
  title,
  dateRange,
  workflows,
  completed = false,
}: (typeof phases)[number]["modules"][number] & { completed?: boolean }) {
  const [isExpanded, setIsExpanded] = useState(!completed);

  return (
    <Card className={cn("bg-neutral-subtle transition-all overflow-hidden", completed && "opacity-75")}>
      <CardHeader
        onClick={() => setIsExpanded((prev) => !prev)}
        className="flex-row items-center justify-between cursor-pointer select-none group/mod hover:opacity-90 transition-opacity"
      >
        <CardTitle className="flex items-center gap-2">
          <ChevronDown
            className={cn(
              "size-4 text-muted-foreground transition-transform duration-300 ease-in-out shrink-0",
              !isExpanded && "-rotate-90"
            )}
          />
          <h3 className={cn(completed && "line-through text-muted-foreground font-normal")}>
            {title}
          </h3>
          {completed && (
            <Badge variant="outline" className="bg-emerald-100/80 text-emerald-800 text-[10px] py-0 px-2 font-semibold">
              Completed
            </Badge>
          )}
        </CardTitle>
        <span className="whitespace-nowrap text-xs text-muted-foreground">
          {dateRange}
        </span>
      </CardHeader>

      <div
        className={cn(
          "grid transition-[grid-template-rows,opacity] duration-300 ease-in-out",
          isExpanded
            ? "grid-rows-[1fr] opacity-100"
            : "grid-rows-[0fr] opacity-0 pointer-events-none"
        )}
      >
        <div className="overflow-hidden">
          <CardContent className="flex flex-col gap-2 pt-0 pb-4">
            {workflows.map((wf) => (
              <WorkflowCell key={wf.title} {...wf} />
            ))}
          </CardContent>
        </div>
      </div>
    </Card>
  );
}

function WorkflowCell({
  title,
  dateRange,
  completed = false,
}: {
  title: string;
  dateRange: string;
  completed?: boolean;
}) {
  return (
    <Card size="sm" className={cn("bg-neutral-surface transition-all", completed && "opacity-65 bg-neutral-surface/60")}>
      <CardContent className="flex items-center justify-between gap-3 py-2 text-sm">
        <div className="flex items-center gap-2.5 text-foreground">
          {completed ? (
            <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
          ) : (
            <FileText className="size-4 text-muted-foreground shrink-0" />
          )}
          <span className={cn(completed && "line-through text-muted-foreground font-normal")}>
            {title}
          </span>
        </div>
        <span className="whitespace-nowrap text-xs text-muted-foreground">
          {dateRange}
        </span>
      </CardContent>
    </Card>
  );
}

// --- Main Gate Overview Page ---

export function GateOverview() {
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isGiveModalOpen, setIsGiveModalOpen] = useState(false);
  const [decisionVariant, setDecisionVariant] = useState<"approved" | "rejected">("approved");
  const [gateStatus, setGateStatus] = useState<"PENDING" | "APPROVED" | "REJECTED">("PENDING");

  const [feedbackHistory, setFeedbackHistory] = useState<GateFeedbackEntry[]>([
    {
      id: "fb-1",
      number: 1,
      date: "Oct 10, 2024",
      reviewer: { name: "Sarah J. Miller", initials: "SJ" },
      feedback:
        "The initial brand audit is exceptionally comprehensive. Moving forward with the proposed color palette as it aligns with our Q4 vision.",
      variant: "approved",
    },
    {
      id: "fb-2",
      number: 2,
      date: "Oct 05, 2024",
      reviewer: { name: "Marcus Chen", initials: "MC" },
      feedback:
        "Missing competitor analysis for the APAC region. Please update before resubmitting for final approval.",
      variant: "rejected",
    },
  ]);

  const handleDecisionClick = (decision: "approved" | "rejected") => {
    setDecisionVariant(decision);
    setIsGiveModalOpen(true);
  };

  const handleFeedbackSubmitted = ({
    feedback,
  }: {
    feedback: string;
    imageFiles: File[];
    skipFeedback: boolean;
  }) => {
    // 1. Update current gate status
    setGateStatus(decisionVariant === "approved" ? "APPROVED" : "REJECTED");

    // 2. Append new entry to the feedback history
    const newEntry: GateFeedbackEntry = {
      id: `fb-${Date.now()}`,
      number: feedbackHistory.length + 1,
      date: new Date().toLocaleDateString("en-US", {
        month: "short",
        day: "2-digit",
        year: "numeric",
      }),
      reviewer: { name: "Sarah J. Miller", initials: "SJ" },
      feedback,
      variant: decisionVariant,
    };

    setFeedbackHistory((prev) => [newEntry, ...prev]);
  };

  return (
    <main className="min-h-screen w-full bg-background px-10 py-8">
      <div className="mx-auto flex flex-col gap-8">
        <div>
          <h1>Strategy and Identity</h1>
          <p className="subtitle">
            Review stage structure, hierarchy, and approval status.
          </p>
        </div>

        <div className="flex flex-col-reverse items-start gap-8 lg:flex-row lg:items-start">
          {/* Left Column: Project Hierarchy Card */}
          <Card className="relative flex-1 bg-neutral-surface p-6">
            <div className="absolute left-8 top-8 bottom-8 z-0 w-0.5 -translate-x-1/2 bg-neutral-subtle" />

            <CardContent className="flex flex-col gap-8 p-0">
              {phases.map((phase) => (
                <PhaseCell key={phase.title} phase={phase} />
              ))}
            </CardContent>
          </Card>

          {/* Right Column: Approval Panel Card */}
          <Card className="h-fit w-full max-w-75 bg-neutral-surface self-start shrink-0">
            <CardHeader>
              <CardTitle>
                <h3>Approval Panel</h3>
              </CardTitle>
            </CardHeader>

            <CardContent className="flex flex-col gap-5">
              {/* Approve & Decline Action Buttons -> Opens GateFeedbackGiveModal */}
              <div className="flex flex-col gap-2.5">
                <Button
                  variant="default"
                  onClick={() => handleDecisionClick("approved")}
                  className="w-full gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                >
                  <CheckCircle2 className="size-4" />
                  Approve Stage Gate
                </Button>

                <Button
                  variant="destructive"
                  onClick={() => handleDecisionClick("rejected")}
                  className="w-full gap-2 font-semibold"
                >
                  <XCircle className="size-4" />
                  Decline Stage Gate
                </Button>
              </div>

              {/* View History Button -> Opens GateFeedbackModal */}
              <Button
                variant="secondary"
                onClick={() => setIsHistoryOpen(true)}
              >
                <History className="size-[15px]" />
                View Gate Feedback
              </Button>

              <div className="flex flex-col gap-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase">
                  CURRENT STATUS
                </p>
                <Badge
                  variant="outline"
                  className={cn(
                    "w-full py-2.5 text-sm font-semibold justify-center border",
                    gateStatus === "APPROVED" && "bg-emerald-100 text-emerald-800 border-emerald-300",
                    gateStatus === "REJECTED" && "bg-red-100 text-red-800 border-red-300",
                    gateStatus === "PENDING" && "bg-yellow-100 text-yellow-800 border-yellow-300"
                  )}
                >
                  {gateStatus === "APPROVED"
                    ? "Approved"
                    : gateStatus === "REJECTED"
                    ? "Rejected"
                    : "Pending Review"}
                </Badge>
              </div>

              <div className="flex flex-col gap-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase">
                  CLIENT REVIEWER
                </p>
                <Card size="sm" className="bg-neutral-surface border-border">
                  <CardContent className="flex items-center gap-3 p-3">
                    <Avatar size="lg">
                      <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
                        SJ
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col min-w-0">
                      <span className="text-sm font-semibold text-foreground truncate">
                        Sarah J. Miller
                      </span>
                      <span className="text-xs text-muted-foreground truncate">
                        VP of Creative Operations
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Modal 1: Dedicated Gate Feedback Placement Modal (Approve / Decline) */}
      <GateFeedbackGiveModal
        isOpen={isGiveModalOpen}
        onClose={() => setIsGiveModalOpen(false)}
        decisionVariant={decisionVariant}
        onSubmitFeedback={handleFeedbackSubmitted}
      />

      {/* Modal 2: Gate Feedback History List Modal (View Gate Feedback) */}
      <GateFeedbackModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        entries={feedbackHistory}
      />
    </main>
  );
}