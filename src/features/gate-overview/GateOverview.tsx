"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
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
import { Back } from "@/components/ui/back";
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
        className="flex items-start sm:items-center justify-between gap-3 cursor-pointer select-none group/phase hover:opacity-90 transition-opacity"
      >
        {/* Left: Node Arrow + Title & Dates Column */}
        <div className="flex items-start gap-3 min-w-0 flex-1">
          <div className="relative z-10 flex shrink-0 items-center justify-center rounded-full border-y-[6px] border-neutral-surface bg-neutral-surface mt-1 sm:mt-0">
            <ArrowRight className="size-4 text-primary" />
          </div>

          <div className="flex flex-col min-w-0 flex-1 gap-1">
            <h2 className={cn("truncate min-w-0", phase.completed && "line-through text-muted-foreground font-normal")}>
              {phase.title}
            </h2>

            {/* Sub Line: Planned & Actual Dates */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-x-4 gap-y-0.5 text-xs text-muted-foreground">
              <span>PLANNED: {phase.dateRange}</span>
              <span className="hidden sm:inline text-neutral-border/40">•</span>
              <span>ACTUAL: {phase.dateRange}</span>
            </div>
          </div>
        </div>

        {/* Right: Completed Badge + Chevron Toggle */}
        <div className="flex items-center gap-2.5 shrink-0 self-start sm:self-center mt-1 sm:mt-0">
          {phase.completed && (
            <Badge variant="outline" className="bg-emerald-100/80 text-emerald-800 text-[10px] py-0.5 px-2 font-semibold">
              Completed
            </Badge>
          )}
          <ChevronDown
            className={cn(
              "size-5 text-muted-foreground transition-transform duration-300 ease-in-out shrink-0",
              !isExpanded && "-rotate-90"
            )}
          />
        </div>
      </div>

      {/* Smooth Grid Accordion Container */}
      <div
        className={cn(
          "grid transition-[grid-template-rows,opacity] duration-300 ease-in-out pl-4 sm:pl-7",
          isExpanded
            ? "grid-rows-[1fr] opacity-100"
            : "grid-rows-[0fr] opacity-0 pointer-events-none"
        )}
      >
        <div className="overflow-hidden flex flex-col gap-4 pt-2">
          <div className="pl-1">
            {phase.description && (
              <p className="subtitle">
                {phase.description}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-3 sm:gap-4">
            {phase.modules.map((mod) => (
              <ModuleCell key={mod.title} {...mod} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function ModuleCell({
  title,
  dateRange,
  workflows,
  completed = false,
}: (typeof phases)[number]["modules"][number] & { completed?: boolean }) {
  const [isExpanded, setIsExpanded] = useState(!completed);

  return (
    <Card
      className={cn(
        "bg-neutral-subtle transition-all overflow-hidden border border-border gap-0 py-0",
        completed && "opacity-75"
      )}
    >
      <CardHeader
        onClick={() => setIsExpanded((prev) => !prev)}
        className="flex items-start sm:items-center justify-between gap-3 cursor-pointer select-none px-4 py-3.5 sm:px-5 sm:py-3.5 hover:opacity-90 transition-opacity"
      >
        {/* Left: Title on top, Date range below */}
        <div className="flex flex-col min-w-0 flex-1 gap-0.5">
          <CardTitle className="p-0">
            <h3 className={cn("truncate min-w-0 leading-snug", completed && "line-through text-muted-foreground font-normal")}>
              {title}
            </h3>
          </CardTitle>
          <span className="text-xs text-muted-foreground leading-tight">
            {dateRange}
          </span>
        </div>

        {/* Right: Completed Badge + Chevron Toggle */}
        <div className="flex items-center gap-2.5 shrink-0 self-start sm:self-center">
          {completed && (
            <Badge variant="outline" className="bg-emerald-100/80 text-emerald-800 text-[10px] py-0.5 px-2 font-semibold">
              Completed
            </Badge>
          )}
          <ChevronDown
            className={cn(
              "size-4 text-muted-foreground transition-transform duration-300 ease-in-out shrink-0",
              !isExpanded && "-rotate-90"
            )}
          />
        </div>
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
          <CardContent className="flex flex-col gap-2 px-4 pb-4 sm:px-5 sm:pb-4 pt-1">
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
    <Card size="sm" className={cn("bg-neutral-surface border border-border/80 transition-all", completed && "opacity-65 bg-neutral-surface/60")}>
      <CardContent className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 sm:gap-3 py-2 px-3 text-sm">
        <div className="flex items-center gap-2.5 text-foreground min-w-0">
          {completed ? (
            <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
          ) : (
            <FileText className="size-4 text-muted-foreground shrink-0" />
          )}
          <span className={cn(completed && "line-through text-muted-foreground font-normal")}>
            {title}
          </span>
        </div>
        <span className="text-xs text-muted-foreground shrink-0 pl-6 sm:pl-0">
          {dateRange}
        </span>
      </CardContent>
    </Card>
  );
}

export function GateOverview() {
  const params = useParams<{ projectId?: string }>();
  const projectId = params?.projectId;

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
    setGateStatus(decisionVariant === "approved" ? "APPROVED" : "REJECTED");

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
    <main className="min-h-screen w-full bg-background">
      <div className="flex flex-col gap-6">
        {/* Navigation Link */}
        <Back link={projectId ? `/projects/${projectId}` : "/projects"} />

        <div>
          <h1>Strategy and Identity</h1>
          <p className="subtitle">
            Review stage structure, hierarchy, and approval status.
          </p>
        </div>

        <div className="flex flex-col-reverse items-start gap-6 lg:flex-row lg:items-start w-full">
          {/* Left Column: Project Hierarchy Card */}
          <Card className="relative flex-1 bg-neutral-surface p-4 sm:p-6 w-full min-w-0 border border-border shadow-xs">
            <div className="absolute left-6 sm:left-8 top-6 sm:top-8 bottom-6 sm:bottom-8 z-0 w-0.5 -translate-x-1/2 bg-neutral-subtle" />

            <CardContent className="flex flex-col gap-6 sm:gap-8 p-0">
              {phases.map((phase) => (
                <PhaseCell key={phase.title} phase={phase} />
              ))}
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
              {/* Action Buttons */}
              <div className="flex flex-col gap-2">
                <Button
                  variant="default"
                  onClick={() => handleDecisionClick("approved")}
                  className="w-full gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs sm:text-sm h-10 shadow-xs"
                >
                  <CheckCircle2 className="size-4" />
                  Approve Stage Gate
                </Button>

                <Button
                  variant="destructive"
                  onClick={() => handleDecisionClick("rejected")}
                  className="w-full gap-2 font-semibold text-xs sm:text-sm h-10"
                >
                  <XCircle className="size-4" />
                  Decline Stage Gate
                </Button>

                {/* View History Button */}
                <Button
                  variant="secondary"
                  onClick={() => setIsHistoryOpen(true)}
                  className="w-full gap-2 text-xs font-semibold h-10 border border-border"
                >
                  <History className="size-4" />
                  View Gate Feedback
                </Button>
              </div>

              {/* Current Status Section */}
              <div className="flex flex-col gap-1.5 pt-1">
                <span className="text-sm font-bold text-neutral-border tracking-wider uppercase">
                  CURRENT STATUS
                </span>
                <div
                  className={cn(
                    "flex items-center justify-center gap-2 w-full h-9 rounded-md border text-xs font-semibold transition-colors",
                    gateStatus === "APPROVED" && "bg-emerald-50 text-emerald-700 border-emerald-200",
                    gateStatus === "REJECTED" && "bg-red-50 text-red-700 border-red-200",
                    gateStatus === "PENDING" && "bg-amber-50 text-amber-800 border-amber-200"
                  )}
                >
                  <span
                    className={cn(
                      "h-2 w-2 rounded-full shrink-0",
                      gateStatus === "APPROVED" && "bg-emerald-500",
                      gateStatus === "REJECTED" && "bg-red-500",
                      gateStatus === "PENDING" && "bg-amber-500"
                    )}
                  />
                  <span>
                    {gateStatus === "APPROVED"
                      ? "Approved"
                      : gateStatus === "REJECTED"
                      ? "Rejected"
                      : "Pending Review"}
                  </span>
                </div>
              </div>

              {/* Client Reviewer Section */}
              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-bold text-neutral-border tracking-wider uppercase">
                  CLIENT REVIEWER
                </span>
                <div className="flex items-center gap-3 p-3 rounded-md bg-neutral-surface border border-border">
                  <Avatar className="h-9 w-9 shrink-0">
                    <AvatarFallback className="bg-primary text-primary-foreground font-semibold text-xs">
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
        onSubmitFeedback={handleFeedbackSubmitted}
      />

      {/* Modal 2: Gate Feedback History Modal */}
      <GateFeedbackModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        entries={feedbackHistory}
      />
    </main>
  );
}