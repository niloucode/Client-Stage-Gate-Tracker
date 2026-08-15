"use client";

import React, { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Back } from "@/components/ui/back";
import { Plus, Unlink, Link as LinkIcon, CheckCircle2 } from "lucide-react";

import { IssueReportingModal } from "./IssueReportingModal";

import type { IssueItem } from "@/entities/issue";
import { IssueBox, IssueDetailsModal, useProjectIssues } from "@/entities/issue";

export const TABS = [
  { id: "unlinked", label: "Unlinked Issues", icon: Unlink },
  { id: "linked", label: "Linked Issues", icon: LinkIcon },
  { id: "resolved", label: "Resolved Issues", icon: CheckCircle2 },
] as const;

/* -------------------------------------------------------------------------- */
/* METRIC CARD COMPONENT (EXPORTED)                                           */
/* -------------------------------------------------------------------------- */

export interface MetricCardProps {
  title: string;
  count: number;
  textColor: string;
  className?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  count,
  textColor,
  className = "",
}) => (
  <Card className={`${className}`}>
    <CardHeader>
      <CardTitle>{title}</CardTitle>
    </CardHeader>
    <CardContent>
      <h2 className={`${textColor}`}>{count}</h2>
    </CardContent>
  </Card>
);

/* -------------------------------------------------------------------------- */
/* MAIN ISSUE DASHBOARD PAGE (DEFAULT EXPORT)                                 */
/* -------------------------------------------------------------------------- */

export interface IssueDashboardProps {
  /** Project whose issues are listed (issue-reporting spec: project-scoped). */
  projectId: string;
  onOpenCreateModal?: () => void;
}

export const IssueDashboard: React.FC<IssueDashboardProps> = ({
  projectId,
  onOpenCreateModal,
}) => {
  const { data: issues = [], isLoading, isError } = useProjectIssues(projectId);
  const [activeTab, setActiveTab] = useState<"unlinked" | "linked" | "resolved">("unlinked");
  const [selectedIssue, setSelectedIssue] = useState<IssueItem | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const activeIssues = useMemo(() => {
    return issues.filter((iss) => iss.status === activeTab);
  }, [issues, activeTab]);

  const unlinkedCount = issues.filter((i) => i.status === "unlinked").length;
  const urgentCount = issues.filter((i) => i.urgency === "high" && i.status !== "resolved").length;
  const resolvedCount = issues.filter((i) => i.status === "resolved").length;

  const handleCreateClick = () => {
    if (onOpenCreateModal) {
      onOpenCreateModal();
    } else {
      setIsCreateModalOpen(true);
    }
  };

  return (
    <>
      <div className="flex-1 flex flex-col min-w-0">
        <main className="flex-1 p-6 md:p-10 space-y-6 mx-auto w-full max-w-7xl">
          {/* Back Button */}
          <Back link={`/projects/${projectId}`} />

          <div className="flex items-start justify-between gap-4">
            <div>
              <h1>Issue Reporting</h1>
              <p className="subtitle">
                View the client-specified issues that need to be resolved in the project.
              </p>
            </div>
            <Button
              onClick={handleCreateClick}
              className="bg-brand-500 hover:bg-brand-600 text-primary-foreground text-xs font-bold px-3.5 h-8 rounded-md flex items-center gap-1.5 shrink-0 shadow-xs"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>New Issue</span>
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <MetricCard title="Unlinked Issues" count={unlinkedCount} textColor="text-brand-500!" />
            <MetricCard title="Highly Urgent Issues" count={urgentCount} textColor="text-red-600!" />
            <MetricCard title="Issues Resolved" count={resolvedCount} textColor="text-green-600!" />
          </div>

          <div className="bg-brand-50/60 p-1.5 rounded-md flex gap-7 border border-brand-100">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <Button
                  key={tab.id}
                  type="button"
                  variant={isActive ? "default" : "ghost"}
                  onClick={() => setActiveTab(tab.id)}
                  className="flex-1"
                >
                  {Icon && <Icon className="w-4 h-4" />}
                  {tab.label}
                </Button>
              );
            })}
          </div>

          {isError ? (
            <div className="py-16 text-center text-destructive text-sm">
              Failed to load issues. Please refresh the page to try again.
            </div>
          ) : isLoading && issues.length === 0 ? (
            <div className="py-16 text-center text-muted-foreground text-sm">
              Loading issues…
            </div>
          ) : (
            <IssueBox
              title={`${activeTab} Issues`}
              issues={activeIssues}
              totalSystemCount={issues.length}
              onIssueClick={(issue) => setSelectedIssue(issue)}
            />
          )}
        </main>
      </div>

      <IssueDetailsModal
        issue={selectedIssue}
        open={Boolean(selectedIssue)}
        onClose={() => setSelectedIssue(null)}
      />

      <IssueReportingModal
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
        projectId={projectId}
      />
    </>
  );
};

export default IssueDashboard;