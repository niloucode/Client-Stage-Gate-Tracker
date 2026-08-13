"use client";

import { useState } from "react";
import { History, FileText, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { GateFeedbackModal } from "./GateFeedbackModal";

// Dummy phase/module/workflow data
const phases = [
  {
    title: "Phase 1: Discovery & Audit",
    description:
      "Comprehensive review of existing assets and competitor landscape.",
    dateRange: "Oct 01, 2024 – Oct 15, 2024",
    modules: [
      {
        title: "Module 1: Brand Sentiment Analysis",
        dateRange: "Oct 01, 2024 – Oct 08, 2024",
        workflows: [
          { title: "Workflow: Survey Distribution", dateRange: "Oct 01 – Oct 04" },
          { title: "Workflow: Data Synthesis", dateRange: "Oct 05 – Oct 08" },
        ],
      },
      {
        title: "Module 2: Competitive Benchmarking",
        dateRange: "Oct 09, 2024 – Oct 15, 2024",
        workflows: [
          { title: "Workflow: Visual Audit", dateRange: "Oct 09 – Oct 15" },
        ],
      },
    ],
  },
  {
    title: "Phase 2: Concept Development",
    description: undefined,
    dateRange: "Oct 16, 2024 – Oct 31, 2024",
    modules: [
      {
        title: "Module 1: Core Style Guide",
        dateRange: "Oct 16, 2024 – Oct 31, 2024",
        workflows: [
          { title: "Workflow: Color Tokens", dateRange: "Oct 16 – Oct 23" },
          { title: "Workflow: Iconography Set", dateRange: "Oct 24 – Oct 31" },
        ],
      },
    ],
  },
  {
    title: "Phase 3: Production & QA",
    description: "Final build-out, review passes, and pre-launch QA.",
    dateRange: "Nov 01, 2024 – Nov 14, 2024",
    modules: [
      {
        title: "Module 1: Asset Production",
        dateRange: "Nov 01, 2024 – Nov 08, 2024",
        workflows: [
          { title: "Workflow: Illustration Pass", dateRange: "Nov 01 – Nov 04" },
          { title: "Workflow: Motion Assets", dateRange: "Nov 05 – Nov 08" },
        ],
      },
      {
        title: "Module 2: Quality Assurance",
        dateRange: "Nov 09, 2024 – Nov 14, 2024",
        workflows: [
          { title: "Workflow: Accessibility Audit", dateRange: "Nov 09 – Nov 11" },
          { title: "Workflow: Cross-browser Testing", dateRange: "Nov 12 – Nov 14" },
        ],
      },
    ],
  },
  {
    title: "Rule 34: Production & QA",
    description: "Final build-out, review passes, and pre-launch QA.",
    dateRange: "Nov 01, 2024 – Nov 14, 2024",
    modules: [
      {
        title: "Module 1: Asset Production",
        dateRange: "Nov 01, 2024 – Nov 08, 2024",
        workflows: [
          { title: "Workflow: Illustration Pass", dateRange: "Nov 01 – Nov 04" },
          { title: "Workflow: Motion Assets", dateRange: "Nov 05 – Nov 08" },
        ],
      },
      {
        title: "Module 2: Quality Assurance",
        dateRange: "Nov 09, 2024 – Nov 14, 2024",
        workflows: [
          { title: "Workflow: Accessibility Audit", dateRange: "Nov 09 – Nov 11" },
          { title: "Workflow: Cross-browser Testing", dateRange: "Nov 12 – Nov 14" },
        ],
      },
    ],
  },
];

function PhaseCell({ phase }: { phase: (typeof phases)[number] }) {
  return (
    <div className="flex flex-col gap-4">
      {/* Phase Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="relative z-10 flex shrink-0 items-center justify-center rounded-full border-y-[10px] border-neutral-surface bg-neutral-surface">
          <ArrowRight className="size-4 text-primary" />
        </div>
        <div className="flex w-full items-center justify-between gap-2">
          <div>
            <h2>{phase.title}</h2>
            {phase.description && (
              <p className="-mt-1! subtitle">
                {phase.description}
              </p>
            )}
          </div>
          <div className="my-auto ml-auto flex flex-col whitespace-nowrap text-sm text-muted-foreground">
            <div className="ml-auto">PLANNED: {phase.dateRange}</div>
            <div className="ml-auto">ACTUAL: {phase.dateRange}</div>
          </div>
        </div>
      </div>

      {/* Modules Container */}
      <div className="flex flex-col gap-4 pl-6">
        {phase.modules.map((mod) => (
          <ModuleCell key={mod.title} {...mod} />
        ))}
      </div>
    </div>
  );
}

// --- Sub-Components using Shadcn Card UI ---

function ModuleCell({
  title,
  dateRange,
  workflows,
}: (typeof phases)[number]["modules"][number]) {
  return (
    <Card className="bg-neutral-subtle">
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle>
          <h3>{title}</h3>
        </CardTitle>
        <span className="whitespace-nowrap text-xs text-muted-foreground">
          {dateRange}
        </span>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        {workflows.map((wf) => (
          <WorkflowCell key={wf.title} {...wf} />
        ))}
      </CardContent>
    </Card>
  );
}

function WorkflowCell({
  title,
  dateRange,
}: {
  title: string;
  dateRange: string;
}) {
  return (
    <Card size="sm" className="bg-neutral-surface">
      <CardContent className="flex items-center justify-between gap-3 py-2 text-sm">
        <div className="flex items-center gap-2.5 text-foreground">
          <FileText className="size-4 text-muted-foreground" />
          <span>{title}</span>
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
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);

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
            {/* Timeline connector line */}
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

            <CardContent className="flex flex-col gap-6">
              <Button
                variant="secondary"
                onClick={() => setIsFeedbackOpen(true)}
              >
                <History className="size-[15px]" />
                View Gate Feedback
              </Button>

              <div className="flex flex-col gap-2">
                <p className="text-xs font-semibold text-muted-foreground">
                  CURRENT STATUS
                </p>
                <Badge
                  variant="outline"
                  className="w-full bg-yellow-100 py-3 text-sm text-yellow-600"
                >
                  Pending Review
                </Badge>
              </div>

              <div className="flex flex-col gap-2">
                <p className="text-xs font-semibold text-muted-foreground">
                  CLIENT REVIEWER
                </p>
                <Card size="sm" className="bg-neutral-surface border-border">
                  <CardContent className="flex items-center gap-3">
                    <Avatar size="lg">
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        SJ
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold text-foreground">
                        Sarah J. Miller
                      </span>
                      <span className="text-[13px] text-muted-foreground">
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

      {/* Gate Feedback Modal */}
      <GateFeedbackModal
        isOpen={isFeedbackOpen}
        onClose={() => setIsFeedbackOpen(false)}
      />
    </main>
  );
}