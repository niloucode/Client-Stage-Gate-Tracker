import { useSyncExternalStore } from "react";

export type UrgencyLevel = "low" | "medium" | "high";

export type BugType =
  | "feature_request"
  | "deadlinks"
  | "missing_fields"
  | "not_saving"
  | "slow_loading"
  | "other";

export interface StepItem {
  id: string;
  description: string;
  image?: string;
}

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
  ticketId?: string;
  steps: StepItem[];
}

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

export const INITIAL_ISSUES: IssueItem[] = [
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

let issuesState: IssueItem[] = [...INITIAL_ISSUES];
const listeners = new Set<() => void>();

export const issueStore = {
  getIssues(): IssueItem[] {
    return issuesState;
  },
  subscribe(listener: () => void): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  addIssue(issue: IssueItem) {
    issuesState = [issue, ...issuesState];
    listeners.forEach((l) => l());
  },
  linkIssue(issueId: string, ticketName: string, ticketId?: string) {
    issuesState = issuesState.map((iss) =>
      iss.id === issueId
        ? { ...iss, status: "linked", ticketName, ticketId }
        : iss
    );
    listeners.forEach((l) => l());
  },
  unlinkIssue(issueId: string) {
    issuesState = issuesState.map((iss) =>
      iss.id === issueId
        ? { ...iss, status: "unlinked", ticketName: undefined, ticketId: undefined }
        : iss
    );
    listeners.forEach((l) => l());
  },
  getIssueById(issueId: string): IssueItem | undefined {
    return issuesState.find((iss) => iss.id === issueId);
  },
};

export function useIssues(): IssueItem[] {
  return useSyncExternalStore(
    issueStore.subscribe,
    issueStore.getIssues,
    issueStore.getIssues
  );
}