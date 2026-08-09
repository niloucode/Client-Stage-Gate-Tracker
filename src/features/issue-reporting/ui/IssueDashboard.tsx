"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Plus,
  X,
  ChevronRight,
  ChevronLeft,
  Unlink,
  Link as LinkIcon,
  CheckCircle2,
  AlertCircle,
  Monitor,
  Calendar,
} from "lucide-react";

import {
  IssueReportingModal,
  IssueFormState,
} from "./IssueReportingModal";

/* -------------------------------------------------------------------------- */
/* TYPES & INTERFACES                                                        */
/* -------------------------------------------------------------------------- */

export type UrgencyLevel = "low" | "medium" | "high";
export type BugType =
  | "feature_request"
  | "deadlinks"
  | "missing_fields"
  | "not_saving"
  | "slow_loading"
  | "other";

export interface IssueItem {
  id: string;
  name: string;
  type: BugType;
  specificType?: string;
  urgency: UrgencyLevel;
  status: "unlinked" | "linked" | "resolved";
  clientName: string;
  reportedAt: string;
  description: string;
  systemEnv: string;
  timeOfError: string;
  ticketName?: string;
  steps: { id: string; description: string; image?: string }[];
}

interface IssueDashboardProps {
  onOpenCreateModal?: () => void;
  initialIssues?: IssueItem[];
}

/* -------------------------------------------------------------------------- */
/* MOCK DATA & CONSTANTS                                                      */
/* -------------------------------------------------------------------------- */

const MOCK_ISSUES: IssueItem[] = [
  {
    id: "iss-1",
    name: "Authentication Token Expiration Bug",
    type: "not_saving",
    urgency: "high",
    status: "unlinked",
    clientName: "John Doe",
    reportedAt: "08/02/2026, 14:30",
    description: "Session terminates unexpectedly when user submits dynamic form data.",
    systemEnv: "Chrome v126 / macOS Sonoma",
    timeOfError: "08/02/2026 : 14:28",
    steps: [
      { id: "1", description: "Navigate to Studio Portal dashboard." },
      { id: "2", description: "Click on 'Save Project' button repeatedly." },
    ],
  },
  {
    id: "iss-2",
    name: "Client Dropdown Not Populating",
    type: "missing_fields",
    urgency: "medium",
    status: "unlinked",
    clientName: "Jane Smith",
    reportedAt: "08/04/2026, 09:15",
    description: "Dropdown menu appears empty on cold load until manually refreshed.",
    systemEnv: "Safari / iOS 17",
    timeOfError: "08/04/2026 : 09:10",
    steps: [{ id: "1", description: "Open Client modal." }],
  },
  {
    id: "iss-3",
    name: "Dashboard Layout Broken on Mobile",
    type: "slow_loading",
    urgency: "low",
    status: "linked",
    ticketName: "TICK-1042",
    clientName: "Robert Vance",
    reportedAt: "08/05/2026, 11:20",
    description: "Bento grid overflows bounding container on screen sizes under 640px.",
    systemEnv: "Firefox / Android 14",
    timeOfError: "08/05/2026 : 11:15",
    steps: [],
  },
  {
    id: "iss-4",
    name: "Add Export PDF Feature",
    type: "feature_request",
    urgency: "low",
    status: "resolved",
    ticketName: "TICK-908",
    clientName: "Alice Cooper",
    reportedAt: "08/01/2026, 16:45",
    description: "Allow clients to download bug reporting logs directly in PDF format.",
    systemEnv: "All Browsers",
    timeOfError: "N/A",
    steps: [],
  },
];

const TABS = [
  { id: "unlinked", label: "Unlinked Issues", icon: Unlink },
  { id: "linked", label: "Linked Issues", icon: LinkIcon },
  { id: "resolved", label: "Resolved Issues", icon: CheckCircle2 },
] as const;

const BUG_TYPE_LABELS: Record<BugType, string> = {
  feature_request: "Feature Request",
  deadlinks: "Deadlinks",
  missing_fields: "Missing Fields",
  not_saving: "Not Saving to Database",
  slow_loading: "Slow Loading",
  other: "Other",
};

/* -------------------------------------------------------------------------- */
/* SUB-COMPONENTS                                                            */
/* -------------------------------------------------------------------------- */

/** Metric Card Component */
const MetricCard = ({ title, count, textColor }: { title: string; count: number; textColor: string }) => (
  <Card className="shadow-sm hover:shadow-md transition-shadow">
    <CardHeader className="pb-2 space-y-0">
      <CardTitle className="text-xs font-semibold text-muted-foreground tracking-wide">{title}</CardTitle>
    </CardHeader>
    <CardContent>
      <div className={`text-3xl font-bold ${textColor}`}>{count}</div>
    </CardContent>
  </Card>
);

/** Single Issue Row Component */
const IssueCard = ({ issue, onClick }: { issue: IssueItem; onClick: () => void }) => {
  const urgencyDotColor =
    issue.urgency === "high" ? "bg-destructive" : issue.urgency === "medium" ? "bg-yellow-500" : "bg-green-600";
  const formattedType = issue.type === "other" && issue.specificType ? issue.specificType : BUG_TYPE_LABELS[issue.type];

  return (
    <div
      onClick={onClick}
      className="flex items-center justify-between p-4 bg-card border rounded-xl hover:border-primary/40 hover:bg-muted/30 cursor-pointer transition-all group"
    >
      <div className="flex items-center gap-4 min-w-0">
        {issue.status !== "resolved" && <span className={`h-2 w-2 rounded-full shrink-0 ${urgencyDotColor}`} />}
        <div className="space-y-1 min-w-0">
          <h4 className="text-sm font-bold text-foreground truncate group-hover:text-primary transition-colors">
            {issue.name}
          </h4>
          <p className="text-xs text-muted-foreground truncate">
            {formattedType} • Reported By {issue.clientName} on {issue.reportedAt}
          </p>
        </div>
      </div>
      <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground shrink-0 ml-4 transition-colors" />
    </div>
  );
};

/** Read-only Issue Details Modal */
const IssueDetailsModal = ({ issue, open, onClose }: { issue: IssueItem | null; open: boolean; onClose: () => void }) => {
  if (!issue) return null;

  return (
    <Dialog open={open} onOpenChange={(val) => !val && onClose()}>
      <DialogContent>
        <DialogHeader>
          <div className="flex items-center gap-3">
            <DialogTitle>Issue Details</DialogTitle>
            {issue.ticketName && (
              <Badge variant="secondary" className="bg-primary text-primary-foreground gap-1.5 px-2.5 py-1 text-xs">
                <LinkIcon className="w-3 h-3" />
                {issue.ticketName}
              </Badge>
            )}
          </div>
        </DialogHeader>

        <div className="space-y-4 p-5 max-h-[30rem] overflow-y-auto">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <span className="text-xs font-semibold text-muted-foreground block">Name</span>
              <p className="text-sm font-semibold text-foreground mt-1">{issue.name}</p>
            </div>
            <div>
              <span className="text-xs font-semibold text-muted-foreground block">Type</span>
              <p className="text-sm font-semibold text-foreground mt-1 capitalize">{BUG_TYPE_LABELS[issue.type]}</p>
            </div>
            <div>
              <span className="text-xs font-semibold text-muted-foreground block">Urgency</span>
              <div className="flex items-center gap-2 mt-1">
                <span
                  className={`h-2 w-2 rounded-full ${
                    issue.urgency === "high" ? "bg-destructive" : issue.urgency === "medium" ? "bg-yellow-500" : "bg-green-600"
                  }`}
                />
                <span className="text-sm font-semibold capitalize">{issue.urgency}</span>
              </div>
            </div>
          </div>

          <Separator />

          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" /> Time Encountered
              </span>
              <p className="text-sm text-foreground mt-1">{issue.timeOfError}</p>
            </div>
            <div>
              <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                <Monitor className="w-3.5 h-3.5" /> System Environment
              </span>
              <p className="text-sm text-foreground mt-1">{issue.systemEnv || "Not specified"}</p>
            </div>
          </div>

          <Separator />

          <div className="space-y-1.5">
            <span className="text-xs font-semibold text-muted-foreground block">Description</span>
            <p className="text-sm leading-relaxed bg-card p-3 rounded-lg border">
              {issue.description || "No description provided."}
            </p>
          </div>

          {issue.steps && issue.steps.length > 0 && (
            <>
              <Separator />
              <div className="space-y-3">
                <span className="text-xs font-semibold text-muted-foreground block">Steps to Reproduce</span>
                <div className="space-y-2.5">
                  {issue.steps.map((step, idx) => (
                    <div key={step.id} className="flex items-center gap-3 bg-card p-3 rounded-lg border">
                      <div className="w-6 h-6 rounded-full bg-secondary text-secondary-foreground text-xs font-semibold flex items-center justify-center shrink-0">
                        {idx + 1}
                      </div>
                      <div className="flex-1 text-xs mt-0.5">
                        {step.description}
                        {step.image && (
                          <img src={step.image} alt="Attachment" className="mt-2 h-16 w-16 object-cover rounded border" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

/* -------------------------------------------------------------------------- */
/* MAIN DASHBOARD PAGE                                                        */
/* -------------------------------------------------------------------------- */

export const IssueDashboard: React.FC<IssueDashboardProps> = ({
  onOpenCreateModal,
  initialIssues = MOCK_ISSUES,
}) => {
  const [issues, setIssues] = useState<IssueItem[]>(initialIssues);
  const [activeTab, setActiveTab] = useState<"unlinked" | "linked" | "resolved">("unlinked");
  const [selectedIssue, setSelectedIssue] = useState<IssueItem | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Direct calculation without over-engineered hooks
  const filteredIssues = issues.filter((iss) => iss.status === activeTab);
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

  const handleCreateIssueSuccess = (formData: IssueFormState) => {
    const now = new Date();
    const newIssue: IssueItem = {
      id: `iss-${Date.now()}`,
      name: formData.name,
      type: formData.type || "other",
      specificType: formData.specificType,
      urgency: formData.urgency,
      status: "unlinked",
      clientName: "Current Client",
      reportedAt: `${now.toLocaleDateString("en-US", { month: "2-digit", day: "2-digit", year: "numeric" })}, ${now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false })}`,
      description: formData.description,
      systemEnv: formData.systemEnv,
      timeOfError: formData.timeOfError || "Just now",
      steps: formData.steps,
    };

    setIssues((prev) => [newIssue, ...prev]);
    setIsCreateModalOpen(false);
  };

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden font-sans">
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <main className="flex-1 overflow-y-auto p-6 md:p-10 space-y-8 mx-auto w-full max-w-7xl">
          {/* Header Title */}
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Issue Reporting</h2>
            <p className="text-xs md:text-sm text-muted-foreground mt-1">
              View the client-specified issues that need to be resolved in the project.
            </p>
          </div>

          {/* Metric Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <MetricCard title="Unlinked Issues" count={unlinkedCount} textColor="text-primary" />
            <MetricCard title="Highly Urgent Issues" count={urgentCount} textColor="text-destructive" />
            <MetricCard title="Issues Resolved" count={resolvedCount} textColor="text-green-600" />
          </div>

          {/* Filter Tabs Toolbar Row */}
          <div className="bg-secondary/60 p-1.5 rounded-xl flex items-center justify-between gap-3 border">
            <div className="flex items-center gap-2 flex-1">
              {TABS.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <Button
                    key={tab.id}
                    type="button"
                    variant={isActive ? "default" : "ghost"}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex-1 h-10 gap-2 text-xs font-semibold rounded-lg transition-all ${
                      isActive
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground hover:bg-transparent"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{tab.label}</span>
                  </Button>
                );
              })}
            </div>
          </div>

          {/* Issues List Container */}
          <Card className="shadow-sm rounded-xl overflow-hidden">
            <div className="px-5 py-2 pb-4 border-b bg-secondary/20 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <h3 className="text-lg font-bold capitalize">{activeTab} Issues</h3>
                <Badge variant="secondary" className="rounded-full px-2.5">
                  {filteredIssues.length} / {issues.length}
                </Badge>
              </div>
              <Button
                onClick={handleCreateClick}
                className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold px-5 rounded-lg flex items-center gap-2 shrink-0 shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>New Issue</span>
              </Button>
            </div>

            <CardContent className="space-y-3">
              {filteredIssues.length === 0 ? (
                <div className="py-12 text-center text-muted-foreground flex flex-col items-center justify-center space-y-2">
                  <AlertCircle className="w-8 h-8 text-muted-foreground/50" />
                  <p className="text-sm">No {activeTab} issues found.</p>
                </div>
              ) : (
                filteredIssues.map((issue) => (
                  <IssueCard key={issue.id} issue={issue} onClick={() => setSelectedIssue(issue)} />
                ))
              )}
            </CardContent>

            <div className="px-6 py-4 border-t flex items-center justify-between text-xs text-muted-foreground">
              <Button variant="ghost" size="icon" disabled className="h-8 w-8">
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span>Page 1 of 1</span>
              <Button variant="ghost" size="icon" disabled className="h-8 w-8">
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </Card>
        </main>
      </div>

      {/* Details View Modal */}
      <IssueDetailsModal
        issue={selectedIssue}
        open={Boolean(selectedIssue)}
        onClose={() => setSelectedIssue(null)}
      />

      {/* Creation Modal */}
      <IssueReportingModal
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
        onSubmitSuccess={handleCreateIssueSuccess}
      />
    </div>
  );
};

export default IssueDashboard;