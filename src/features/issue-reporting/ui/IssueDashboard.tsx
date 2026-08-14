"use client";

import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/components/ui/toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Plus,
  ChevronRight,
  ChevronLeft,
  Unlink,
  Link as LinkIcon,
  CheckCircle2,
  AlertCircle,
  Monitor,
  Calendar,
  ArrowUpDown,
  ArrowDown,
  ArrowUp,
  Filter,
} from "lucide-react";

import {
  IssueReportingModal,
  IssueFormState,
} from "./IssueReportingModal";

/* -------------------------------------------------------------------------- */
/* TYPES & INTERFACES                                                        */
/* -------------------------------------------------------------------------- */

import type { UrgencyLevel, BugType, IssueItem, StepItem } from "@/entities/issue";
export type { UrgencyLevel, BugType, StepItem, IssueItem } from "@/entities/issue";
export type UrgencyFilterOption = UrgencyLevel | "all";

export type SortOrder = "desc" | "asc" | "none";

/* -------------------------------------------------------------------------- */
/* CONSTANTS                                                                  */
/* -------------------------------------------------------------------------- */

export const URGENCY_WEIGHT: Record<UrgencyLevel, number> = {
  high: 3,
  medium: 2,
  low: 1,
};

export const BUG_TYPE_LABELS: Record<BugType, string> = {
  feature_request: "Feature Request",
  deadlinks: "Deadlinks",
  missing_fields: "Missing Fields",
  not_saving: "Not Saving to Database",
  slow_loading: "Slow Loading",
  other: "Other",
};

export const TABS = [
  { id: "unlinked", label: "Unlinked Issues", icon: Unlink },
  { id: "linked", label: "Linked Issues", icon: LinkIcon },
  { id: "resolved", label: "Resolved Issues", icon: CheckCircle2 },
] as const;

export const MOCK_ISSUES: IssueItem[] = [
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
  {
    id: "iss-5",
    name: "Broken Navigation Links in Footer",
    type: "deadlinks",
    urgency: "medium",
    status: "unlinked",
    clientName: "Jane Smith",
    reportedAt: "08/04/2026, 09:15",
    description: "Privacy policy link in footer gives 404 error.",
    systemEnv: "Safari / iOS 17",
    timeOfError: "08/04/2026 : 09:10",
    steps: [{ id: "1", description: "Click on Privacy Policy link." }],
  },
  {
    id: "iss-6",
    name: "Database Timeout on Analytics Load",
    type: "slow_loading",
    urgency: "high",
    status: "unlinked",
    clientName: "Michael Scott",
    reportedAt: "08/06/2026, 10:00",
    description: "Analytics tab takes over 15s to load reporting data.",
    systemEnv: "Chrome / Windows 11",
    timeOfError: "08/06/2026 : 09:55",
    steps: [],
  },
  {
    id: "iss-7",
    name: "Profile Picture Upload Error",
    type: "not_saving",
    urgency: "low",
    status: "unlinked",
    clientName: "Pam Beesly",
    reportedAt: "08/06/2026, 11:30",
    description: "Uploading PNG image larger than 2MB causes silent failure.",
    systemEnv: "Edge / Windows 11",
    timeOfError: "08/06/2026 : 11:25",
    steps: [],
  },
  {
    id: "iss-8",
    name: "Form Field Validation Glitch",
    type: "missing_fields",
    urgency: "medium",
    status: "unlinked",
    clientName: "Jim Halpert",
    reportedAt: "08/07/2026, 08:45",
    description: "Email validation field throws error on valid formatted emails.",
    systemEnv: "Safari / macOS",
    timeOfError: "08/07/2026 : 08:40",
    steps: [],
  },
  {
    id: "iss-9",
    name: "Dark Mode Contrast Issues",
    type: "other",
    specificType: "UI Bug",
    urgency: "low",
    status: "unlinked",
    clientName: "Dwight Schrute",
    reportedAt: "08/07/2026, 14:10",
    description: "Text inside table cells becomes illegible in dark theme.",
    systemEnv: "Firefox / Linux",
    timeOfError: "08/07/2026 : 14:00",
    steps: [],
  },
];

/* -------------------------------------------------------------------------- */
/* 1. METRIC CARD COMPONENT (EXPORTED)                                       */
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
      <CardTitle>
        {title}
      </CardTitle>
    </CardHeader>
    <CardContent>
      <h2 className={`${textColor}`}>{count}</h2>
    </CardContent>
  </Card>
);

/* -------------------------------------------------------------------------- */
/* 2. SINGLE ISSUE CARD ROW (EXPORTED)                                        */
/* -------------------------------------------------------------------------- */

export interface IssueCardProps {
  issue: IssueItem;
  onClick?: () => void;
  onLinkClick?: (issue: IssueItem) => void;
  className?: string;
}

export const IssueCard: React.FC<IssueCardProps> = ({
  issue,
  onClick,
  onLinkClick,
  className = "",
}) => {
  const urgencyDotColor =
    issue.urgency === "high"
      ? "bg-red-600"
      : issue.urgency === "medium"
      ? "bg-orange-500"
      : "bg-yellow-600";

  const formattedType =
    issue.type === "other" && issue.specificType
      ? issue.specificType
      : BUG_TYPE_LABELS[issue.type] || issue.type;

  return (
    <div
      onClick={onClick}
      className={`flex items-center justify-between p-3.5 bg-card border border-border rounded-md hover:border-brand-200 hover:bg-brand-10/50 cursor-pointer transition-all group ${className}`}
    >
      <div className="flex items-center gap-3.5 min-w-0">
        {issue.status !== "resolved" && (
          <span className={`h-2.5 w-2.5 rounded-full shrink-0 ${urgencyDotColor}`} />
        )}
        <div className="space-y-0.5 min-w-0">
          <h4 className="text-sm font-bold text-foreground truncate group-hover:text-brand-500 transition-colors">
            {issue.name}
          </h4>
          <p className="text-xs text-muted-foreground truncate">
            {formattedType} • Reported By {issue.clientName} on {issue.reportedAt}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0 ml-4">
        {onLinkClick && (
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={(e) => {
              e.stopPropagation();
              onLinkClick(issue);
            }}
            className="h-8 gap-1.5 text-xs font-semibold text-brand-600 border-brand-200 hover:bg-brand-50 hover:text-brand-700 rounded-md"
          >
            <LinkIcon className="w-3.5 h-3.5" />
            <span>Link</span>
          </Button>
        )}
      </div>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/* 3. ISSUE DETAILS MODAL (EXPORTED)                                          */
/* -------------------------------------------------------------------------- */

export interface IssueDetailsModalProps {
  issue: IssueItem | null;
  open: boolean;
  onClose: () => void;
}

export const IssueDetailsModal: React.FC<IssueDetailsModalProps> = ({
  issue,
  open,
  onClose,
}) => {
  if (!issue) return null;

  return (
    <Dialog open={open} onOpenChange={(val) => !val && onClose()}>
      <DialogContent className="max-w-2xl bg-card border-border rounded-md shadow-2xl">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <DialogTitle className="text-foreground font-bold">Issue Details</DialogTitle>
            {issue.ticketName && (
              <Badge variant="secondary" className="bg-brand-500 text-primary-foreground gap-1.5 px-2.5 py-1 text-xs">
                <LinkIcon className="w-3 h-3" />
                {issue.ticketName}
              </Badge>
            )}
          </div>
        </DialogHeader>

        <div className="space-y-4 max-h-[40rem] overflow-y-auto pr-1">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <span className="text-xs font-semibold text-muted-foreground block">Name</span>
              <p className="text-sm font-semibold text-foreground mt-1">{issue.name}</p>
            </div>
            <div>
              <span className="text-xs font-semibold text-muted-foreground block">Type</span>
              <p className="text-sm font-semibold text-foreground mt-1 capitalize">
                {BUG_TYPE_LABELS[issue.type] || issue.type}
              </p>
            </div>
            <div>
              <span className="text-xs font-semibold text-muted-foreground block">Urgency</span>
              <div className="flex items-center gap-2 mt-1">
                <span
                  className={`h-2.5 w-2.5 rounded-full ${
                    issue.urgency === "high"
                      ? "bg-red-600"
                      : issue.urgency === "medium"
                      ? "bg-yellow-500"
                      : "bg-green-600"
                  }`}
                />
                <span className="text-sm font-semibold capitalize text-foreground">{issue.urgency}</span>
              </div>
            </div>
          </div>

          <Separator className="bg-border" />

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

          <Separator className="bg-border" />

          <div className="space-y-1.5">
            <span className="text-xs font-semibold text-muted-foreground block">Description</span>
            <p className="text-sm leading-relaxed bg-brand-10 p-3 rounded-md border border-border text-foreground">
              {issue.description || "No description provided."}
            </p>
          </div>

          {issue.steps && issue.steps.length > 0 && (
            <>
              <Separator className="bg-border" />
              <div className="space-y-3">
                <span className="text-xs font-semibold text-muted-foreground block">Steps to Reproduce</span>
                <div className="space-y-2.5">
                  {issue.steps.map((step, idx) => (
                    <div key={step.id || idx} className="flex items-center gap-3 bg-brand-10/80 p-3 rounded-md border border-border">
                      <div className="w-6 h-6 rounded-full bg-brand-500 text-primary-foreground text-xs font-semibold flex items-center justify-center shrink-0">
                        {idx + 1}
                      </div>
                      <div className="flex-1 text-xs mt-0.5 text-foreground">
                        {step.description}
                        {step.image && (
                          <img src={step.image} alt="Attachment" className="mt-2 h-16 w-16 object-cover rounded border border-border" />
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
/* 4. COMPARTMENTALIZED ISSUE BOX (EXPORTED STANDALONE COMPONENT)            */
/* -------------------------------------------------------------------------- */

export interface IssueBoxProps {
  title?: string;
  issues: IssueItem[];
  totalSystemCount?: number;
  itemsPerPage?: number;
  defaultSortOrder?: SortOrder;
  defaultUrgencyFilter?: UrgencyFilterOption;
  onIssueClick?: (issue: IssueItem) => void;
  onNewIssueClick?: () => void;
  showNewIssueButton?: boolean;
  onLinkIssue?: (issue: IssueItem) => void;
  className?: string;
}

export const IssueBox: React.FC<IssueBoxProps> = ({
  title = "Unlinked Issues",
  issues,
  totalSystemCount,
  itemsPerPage = 5,
  defaultSortOrder = "desc",
  defaultUrgencyFilter = "all",
  onIssueClick,
  onNewIssueClick,
  showNewIssueButton = true,
  onLinkIssue,
  className = "",
}) => {
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [sortByUrgency, setSortByUrgency] = useState<SortOrder>(defaultSortOrder);
  const [urgencyFilter, setUrgencyFilter] = useState<UrgencyFilterOption>(defaultUrgencyFilter);

  const filteredByUrgency = useMemo(() => {
    if (urgencyFilter === "all") return issues;
    return issues.filter((iss) => iss.urgency === urgencyFilter);
  }, [issues, urgencyFilter]);

  const sortedIssues = useMemo(() => {
    if (sortByUrgency === "none") return filteredByUrgency;

    return [...filteredByUrgency].sort((a, b) => {
      const weightA = URGENCY_WEIGHT[a.urgency];
      const weightB = URGENCY_WEIGHT[b.urgency];

      return sortByUrgency === "desc" ? weightB - weightA : weightA - weightB;
    });
  }, [filteredByUrgency, sortByUrgency]);

  const totalPages = Math.ceil(sortedIssues.length / itemsPerPage) || 1;
  const validPage = Math.min(currentPage, totalPages);
  const startIndex = (validPage - 1) * itemsPerPage;
  const paginatedIssues = sortedIssues.slice(startIndex, startIndex + itemsPerPage);

  const totalCountDenominator = totalSystemCount ?? issues.length;

  const toggleSortOrder = () => {
    setCurrentPage(1);
    setSortByUrgency((prev) => {
      if (prev === "desc") return "asc";
      if (prev === "asc") return "none";
      return "desc";
    });
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setUrgencyFilter(e.target.value as UrgencyFilterOption);
    setCurrentPage(1);
  };

  return (
    <Card className={`shadow-xs rounded-md border border-border overflow-hidden bg-card ${className}`}>
      <div className="px-5 py-2.5 pr-12 border-b border-border flex items-center justify-between flex-wrap gap-2.5">
        <div className="flex items-center gap-2.5 flex-wrap">
          <h3 className="text-base font-bold capitalize text-foreground">
            {title}
          </h3>
          <Badge
            variant="secondary"
            className="bg-brand-50 text-brand-500 dark:bg-brand-900 dark:text-brand-100 font-semibold rounded-full px-2.5 py-0.5 text-xs border-none"
          >
            {filteredByUrgency.length} / {totalCountDenominator}
          </Badge>

          <div className="flex items-center gap-1.5 border border-border bg-card rounded-md px-2.5 h-8 text-xs font-medium text-foreground hover:bg-neutral-subtle transition-colors">
            <Filter className="w-3.5 h-3.5 text-muted-foreground" />
            <select
              value={urgencyFilter}
              onChange={handleFilterChange}
              className="bg-transparent text-xs font-medium text-foreground focus:outline-none cursor-pointer pr-1"
            >
              <option value="all" className="bg-card text-foreground">All Urgencies</option>
              <option value="high" className="bg-card text-foreground">High Urgency</option>
              <option value="medium" className="bg-card text-foreground">Medium Urgency</option>
              <option value="low" className="bg-card text-foreground">Low Urgency</option>
            </select>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={toggleSortOrder}
            className="text-xs h-8 gap-1.5 font-medium rounded-md border-border bg-card hover:bg-neutral-subtle text-foreground"
          >
            {sortByUrgency === "desc" && <ArrowDown className="w-3.5 h-3.5 text-red-600" />}
            {sortByUrgency === "asc" && <ArrowUp className="w-3.5 h-3.5 text-green-600" />}
            {sortByUrgency === "none" && <ArrowUpDown className="w-3.5 h-3.5 text-muted-foreground" />}
            <span>
              Urgency:{" "}
              {sortByUrgency === "desc"
                ? "High → Low"
                : sortByUrgency === "asc"
                ? "Low → High"
                : "Default"}
            </span>
          </Button>
        </div>

        {showNewIssueButton && onNewIssueClick && (
          <div className="flex items-center gap-2">
            <Button
              onClick={onNewIssueClick}
              className="bg-brand-500 hover:bg-brand-600 text-primary-foreground text-xs font-bold px-3.5 h-8 rounded-md flex items-center gap-1.5 shrink-0 shadow-xs"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>New Issue</span>
            </Button>
          </div>
        )}
      </div>

      <CardContent className="space-y-2.5 p-4">
        {paginatedIssues.length === 0 ? (
          <div className="py-10 text-center text-muted-foreground flex flex-col items-center justify-center space-y-2">
            <AlertCircle className="w-8 h-8 text-muted-foreground/40" />
            <p className="text-sm">No issues match the selected urgency criteria.</p>
          </div>
        ) : (
          paginatedIssues.map((issue) => (
            <IssueCard
              key={issue.id}
              issue={issue}
              onClick={() => onIssueClick && onIssueClick(issue)}
              onLinkClick={onLinkIssue}
            />
          ))
        )}
      </CardContent>

      <div className="px-5 py-3 border-t border-border flex items-center justify-center gap-2 text-xs text-muted-foreground font-medium">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
          disabled={validPage <= 1}
          className="h-7 w-7 text-muted-foreground hover:text-foreground disabled:opacity-30"
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <span>
          Page {validPage} of {totalPages}
        </span>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
          disabled={validPage >= totalPages}
          className="h-7 w-7 text-muted-foreground hover:text-foreground disabled:opacity-30"
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </Card>
  );
};

/* -------------------------------------------------------------------------- */
/* 5. MAIN ISSUE DASHBOARD PAGE (DEFAULT EXPORT)                               */
/* -------------------------------------------------------------------------- */

export interface IssueDashboardProps {
  onOpenCreateModal?: () => void;
  initialIssues?: IssueItem[];
}

export const IssueDashboard: React.FC<IssueDashboardProps> = ({
  onOpenCreateModal,
  initialIssues = MOCK_ISSUES,
}) => {
  const [issues, setIssues] = useState<IssueItem[]>(initialIssues);
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

    toast.add({
      title: "Issue Reported",
      description: `"${formData.name}" has been reported successfully.`,
      type: "success",
    });
  };

  return (
    <>
      <div className="flex-1 flex flex-col min-w-0">
        <main className="flex-1 p-6 md:p-10 space-y-8 mx-auto w-full max-w-7xl">
          <div>
            <h1>Issue Reporting</h1>
            <p className="subtitle">
              View the client-specified issues that need to be resolved in the project.
            </p>
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
                  className="flex-1" // <-- Replaces w-full / w-1/3
                >
                  {Icon && <Icon className="w-4 h-4" />}
                  {tab.label}
                </Button>
              );
            })}
          </div>

          <IssueBox
            title={`${activeTab} Issues`}
            issues={activeIssues}
            totalSystemCount={issues.length}
            onIssueClick={(issue) => setSelectedIssue(issue)}
            onNewIssueClick={handleCreateClick}
          />
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
        onSubmitSuccess={handleCreateIssueSuccess}
      />
    </>
  );
};

export default IssueDashboard;