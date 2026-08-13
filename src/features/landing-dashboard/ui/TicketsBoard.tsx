"use client";

import { useState, useMemo } from "react";
import {
  Eye,
  Ticket,
  Calendar,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  ArrowUpDown,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { status as TicketStatus } from "@/lib/generated/prisma";

/* ========================================================================== */
/*                                1. TICKETS                                  */
/* ========================================================================== */

export interface WorkflowData {
  label: string;
}

export interface TagBadgeData {
  label: string;
  bg: string;
  text: string;
}

export interface AssigneeData {
  initials: string;
  avatarBg: string;
  name?: string;
}

export interface TicketItem {
  id: string;
  name: string;
  project: string;
  module: string;
  workflow: WorkflowData | string;
  status: TicketStatus;
  tag: TagBadgeData;
  assignees?: AssigneeData[];
  dueAt?: Date | string;
  dueDate?: string;
  dueDateUrgent?: boolean;
}

export interface TicketsBoardProps {
  variant?: "my" | "watched";
  tickets?: TicketItem[];
  count?: number;
  title?: string;
}

type SortField = "name" | "project" | "status" | "tag" | "assignees" | "dueAt";
type SortDirection = "asc" | "desc";

// Generates 25 mock items with realistic varying dueAt timestamps
const NOW_MS = Date.now();
const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

const MOCK_OFFSET_MS = [
  -2 * HOUR_MS,          // Overdue by 2 hours
  12 * 60 * 1000,        // 12m left
  42 * 60 * 1000,        // 42m left
  2 * HOUR_MS,           // 2h left
  5 * HOUR_MS,           // 5h left
  14 * HOUR_MS,          // 14h left
  1 * DAY_MS + 2 * HOUR_MS,  // 1d left
  2 * DAY_MS,            // 2d left
  3 * DAY_MS + 6 * HOUR_MS,  // 3d left
  5 * DAY_MS,            // 5d left
  8 * DAY_MS,            // 8d left
  12 * DAY_MS,           // 12d left
];

const MOCK_EXTENDED_TICKETS: TicketItem[] = Array.from({ length: 25 }, (_, i) => {
  const dueOffset = MOCK_OFFSET_MS[i % MOCK_OFFSET_MS.length];
  const dueAt = new Date(NOW_MS + dueOffset);

  return {
    id: `ticket-${i + 1}`,
    name: `Ticket Issue #${i + 1} - ${
      ["Implement SSO", "Dashboard Bento Grid Refactor", "Database Indexing", "Stripe Fix", "iOS 17 Compatibility"][i % 5]
    }`,
    project: ["Asceoft", "Portal 2.0", "Core Engine", "Billing", "Mobile App"][i % 5],
    module: ["Auth", "UI/UX", "Infrastructure", "API", "Client"][i % 5],
    workflow: { label: ["Auth Flow", "Dashboard UI", "Core DB", "Billing API", "Client App"][i % 5] },
    status: [TicketStatus.IN_PROGRESS, TicketStatus.PENDING, TicketStatus.FINISHED][i % 3],
    tag: [
      { label: "High Priority", bg: "#ffdad6", text: "#93000a" },
      { label: "Feature", bg: "#6cf8bb", text: "#00714d" },
      { label: "Critical", bg: "#ffdad6", text: "#93000a" },
      { label: "Optimization", bg: "#dce2f3", text: "#777587" },
    ][i % 4],
    assignees: [
      { initials: "JD", avatarBg: "#ffddb8", name: "John Doe" },
      ...(i % 2 === 0 ? [{ initials: "SM", avatarBg: "#e2dfff", name: "Sarah M." }] : []),
      ...(i % 3 === 0 ? [{ initials: "AK", avatarBg: "#bbf7d0", name: "Alex K." }] : []),
    ],
    dueAt,
  };
});

/* -------------------------------------------------------------------------- */
/*                              Sub-Components                                */
/* -------------------------------------------------------------------------- */

/** Status styling matching Kanban board definitions (`src/features/ticket-board`) */
const STATUS_CONFIG: Record<
  TicketStatus,
  { label: string; dot: string; text: string }
> = {
  PENDING: {
    label: "Pending",
    dot: "bg-yellow-500",
    text: "text-yellow-600",
  },
  IN_PROGRESS: {
    label: "In Progress",
    dot: "bg-brand-600",
    text: "text-brand-600",
  },
  FINISHED: {
    label: "Finished",
    dot: "bg-green-500",
    text: "text-green-600",
  },
};

const STATUS_WEIGHT: Record<TicketStatus, number> = {
  PENDING: 1,
  IN_PROGRESS: 2,
  FINISHED: 3,
};

// Mapped exact string titles to SortFields
const COLUMN_FIELD_MAP: Record<string, SortField> = {
  "Ticket Name": "name",
  "Project": "project",
  "Status": "status",
  "Tags": "tag",
  "Assigned To": "assignees",
  "Due Date": "dueAt",
  "due at": "dueAt",
  "Time Left": "dueAt",
};

function StatusCell({ status }: { status: TicketStatus }) {
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.PENDING;

  return (
    <div className="flex items-center gap-1.5">
      <span className={`h-2 w-2 rounded-full ${config.dot}`} />
      <span className={`text-[13px] font-normal ${config.text}`}>
        {config.label}
      </span>
    </div>
  );
}

function TagBadge({ tag }: { tag: TagBadgeData }) {
  return (
    <div>
      <span
        className="inline-block rounded px-2 py-0.5 text-[10px] font-normal"
        style={{ backgroundColor: tag.bg, color: tag.text }}
      >
        {tag.label}
      </span>
    </div>
  );
}

function AssigneesCell({ assignees }: { assignees?: AssigneeData[] }) {
  if (!assignees || assignees.length === 0) {
    return <span className="text-[13px] text-muted-foreground">-</span>;
  }

  return (
    <div className="flex items-center -space-x-1.5 overflow-hidden">
      {assignees.map((person, idx) => (
        <div
          key={idx}
          title={person.name}
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 border-background shadow-2xs"
          style={{ backgroundColor: person.avatarBg }}
        >
          <span className="text-[9px] font-normal uppercase text-foreground">
            {person.initials}
          </span>
        </div>
      ))}
    </div>
  );
}

/** Formats time remaining: Days left -> Hours left -> Minutes left -> Overdue */
function formatTimeLeft(dueAt?: Date | string, fallbackText?: string): { text: string; isUrgent: boolean } {
  if (!dueAt) {
    return { text: fallbackText ?? "No date", isUrgent: false };
  }

  const dateObj = dueAt instanceof Date ? dueAt : new Date(dueAt);
  if (isNaN(dateObj.getTime())) {
    return { text: fallbackText ?? "No date", isUrgent: false };
  }

  const diffMs = dateObj.getTime() - Date.now();

  if (diffMs <= 0) {
    return { text: "Overdue", isUrgent: true };
  }

  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 60) {
    return { text: `${Math.max(1, diffMins)}m left`, isUrgent: true };
  }

  if (diffHours < 24) {
    return { text: `${diffHours}h left`, isUrgent: diffHours < 6 };
  }

  return { text: `${diffDays}d left`, isUrgent: diffDays <= 2 };
}

function DueDateCell({
  dueAt,
  dueDate,
  isUrgent: customUrgent,
}: {
  dueAt?: Date | string;
  dueDate?: string;
  isUrgent?: boolean;
}) {
  const { text, isUrgent: calculatedUrgent } = formatTimeLeft(dueAt, dueDate);
  const isUrgent = customUrgent ?? calculatedUrgent;

  return (
    <div className="flex items-center gap-1.5">
      <Calendar
        className={`h-3 w-3 shrink-0 ${
          isUrgent ? "text-destructive" : "text-muted-foreground"
        }`}
      />
      <span
        className={`text-[13px] font-normal ${
          isUrgent ? "text-destructive" : "text-muted-foreground"
        }`}
      >
        {text}
      </span>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                               Main Component                               */
/* -------------------------------------------------------------------------- */

export function TicketsBoard({
  variant = "my",
  tickets = MOCK_EXTENDED_TICKETS,
  count,
  title,
}: TicketsBoardProps) {
  const isWatched = variant === "watched";
  const totalCount = count ?? tickets.length;
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Sorting state (default: dueAt ascending)
  const [sortField, setSortField] = useState<SortField>("dueAt");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  const handleSort = (field: SortField) => {
    setCurrentPage(1); // Reset page on sort change
    if (sortField === field) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  // Sort tickets dynamically
  const sortedTickets = useMemo(() => {
    return [...tickets].sort((a, b) => {
      let valA: string | number = "";
      let valB: string | number = "";

      switch (sortField) {
        case "name":
          valA = a.name.toLowerCase();
          valB = b.name.toLowerCase();
          break;
        case "project":
          valA = a.project.toLowerCase();
          valB = b.project.toLowerCase();
          break;
        case "status":
          valA = STATUS_WEIGHT[a.status] ?? 0;
          valB = STATUS_WEIGHT[b.status] ?? 0;
          break;
        case "tag":
          valA = a.tag.label.toLowerCase();
          valB = b.tag.label.toLowerCase();
          break;
        case "assignees":
          valA = a.assignees?.[0]?.initials?.toLowerCase() ?? "";
          valB = b.assignees?.[0]?.initials?.toLowerCase() ?? "";
          break;
        case "dueAt": {
          const getMs = (item: TicketItem) => {
            if (!item.dueAt) return Number.MAX_SAFE_INTEGER;
            const d = item.dueAt instanceof Date ? item.dueAt : new Date(item.dueAt);
            return isNaN(d.getTime()) ? Number.MAX_SAFE_INTEGER : d.getTime();
          };
          valA = getMs(a);
          valB = getMs(b);
          break;
        }
      }

      if (valA < valB) return sortDirection === "asc" ? -1 : 1;
      if (valA > valB) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
  }, [tickets, sortField, sortDirection]);

  const totalPages = Math.ceil(sortedTickets.length / pageSize);
  const paginatedTickets = sortedTickets.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  // Column Grid definitions
  const gridColumns = isWatched
    ? "grid-cols-[2fr_1.2fr_1.2fr_1.2fr_1.2fr_1fr]"
    : "grid-cols-[2.5fr_1.5fr_1.5fr_1.2fr_1fr]";

  const columns = [
    "Ticket Name",
    "Project",
    "Status",
    "Tags",
    ...(isWatched ? ["Assigned To"] : []),
    "Due Date",
  ];

  const renderTableHeader = (isModal = false) => (
    <div
      className={`grid ${gridColumns} w-full items-center justify-between border-b border-brand-100 bg-muted/50 ${
        isModal ? "px-8 py-3.5 sticky top-0 bg-muted z-10" : "px-6 py-3"
      } select-none`}
    >
      {columns.map((col, idx) => {
        const field = COLUMN_FIELD_MAP[col];
        const isSorted = sortField === field;
        const isRight = idx === columns.length - 1;

        return (
          <button
            key={col}
            type="button"
            onClick={() => field && handleSort(field)}
            className={`flex items-center gap-1 text-[11px] font-normal uppercase text-muted-foreground hover:text-foreground transition-colors cursor-pointer ${
              isRight ? "justify-end text-right" : "justify-start text-left"
            }`}
          >
            <span>{col}</span>
            {isSorted ? (
              sortDirection === "asc" ? (
                <ChevronUp className="h-3 w-3 shrink-0 text-brand-600" />
              ) : (
                <ChevronDown className="h-3 w-3 shrink-0 text-brand-600" />
              )
            ) : (
              <ArrowUpDown className="h-3 w-3 shrink-0 opacity-40 hover:opacity-100" />
            )}
          </button>
        );
      })}
    </div>
  );

  const renderTableRows = (items: TicketItem[], isModal = false) =>
    items.map((ticket, index) => {
      return (
        <div
          key={ticket.id}
          className={`grid ${gridColumns} w-full items-center justify-between ${
            isModal ? "px-8" : "px-6"
          } py-3.5 ${
            index < items.length - 1 ? "border-b border-brand-100/50" : ""
          }`}
        >
          <span className="truncate text-[13px] font-normal text-foreground">
            {ticket.name}
          </span>
          <span className="text-[13px] font-normal text-muted-foreground">{ticket.project}</span>
          <StatusCell status={ticket.status} />
          <TagBadge tag={ticket.tag} />
          {isWatched && <AssigneesCell assignees={ticket.assignees} />}
          <div className="flex justify-end">
            <DueDateCell
              dueAt={ticket.dueAt}
              dueDate={ticket.dueDate}
              isUrgent={ticket.dueDateUrgent}
            />
          </div>
        </div>
      );
    });

  return (
    <Card className="m-0 flex w-full flex-col gap-0 overflow-hidden rounded-sm border border-brand-100 p-0 shadow-none">
      {/* Header with Dialog Trigger */}
      <Dialog>
        <div className="m-0 flex items-center justify-between border-b border-brand-100 bg-muted/30 px-6 py-4">
          <div className="flex items-center gap-2">
            {isWatched ? (
              <Eye className="h-4 w-4 text-amber-600" />
            ) : (
              <Ticket className="h-4 w-4 text-brand-600" />
            )}
            <h3 className="text-base font-normal text-foreground">
              {title || (isWatched ? "Watching" : "My Tickets")}
            </h3>
            <span
              className={`rounded-md px-2.5 py-0.5 text-[10px] font-normal ${
                isWatched
                  ? "bg-amber-100 text-amber-900"
                  : "bg-brand-100 text-brand-600"
              }`}
            >
              {totalCount}
            </span>
          </div>

          <DialogTrigger>
            <button
              type="button"
              className="text-xs font-normal underline-offset-2 hover:underline"
            >
              <h4 className="hover:text-brand-600! font-normal underline decoration-inherit">
                View All
              </h4>
            </button>
          </DialogTrigger>
        </div>

        {/* Dashboard Preview Table (First 3 sorted items) */}
        <div className="m-0 p-0">
          {renderTableHeader(false)}
          {renderTableRows(sortedTickets.slice(0, 3))}
        </div>

        {/* POPUP MODAL DIALOG WITH 10 ROWS & PAGINATION */}
        <DialogContent className="flex max-h-[85vh] w-full max-w-5xl flex-col gap-0 overflow-hidden p-0">
          <DialogHeader className="m-0 border-b border-brand-100 bg-muted/30 px-8 pt-6 pb-5">
            <DialogTitle className="flex items-center gap-2 text-base font-normal">
              {isWatched ? (
                <Eye className="h-4 w-4 text-amber-600" />
              ) : (
                <Ticket className="h-4 w-4 text-brand-600" />
              )}
              {title || (isWatched ? "Watching Tickets" : "My Tickets")}
              <span
                className={`ml-2 rounded-md px-3 py-1 text-[12px] font-normal ${
                  isWatched
                    ? "bg-amber-100 text-amber-900"
                    : "bg-brand-100 text-brand-600"
                }`}
              >
                {sortedTickets.length}
              </span>
            </DialogTitle>
          </DialogHeader>

          {/* Modal Table Body */}
          <div className="flex-1 overflow-y-auto">
            {renderTableHeader(true)}
            {renderTableRows(paginatedTickets, true)}
          </div>

          {/* Pagination Controls */}
          <div className="flex items-center justify-between border-t border-brand-100 bg-muted/30 px-8 py-4">
            <span className="text-xs font-normal text-muted-foreground">
              Showing{" "}
              <span className="font-normal text-foreground">
                {(currentPage - 1) * pageSize + 1}
              </span>{" "}
              to{" "}
              <span className="font-normal text-foreground">
                {Math.min(currentPage * pageSize, sortedTickets.length)}
              </span>{" "}
              of <span className="font-normal text-foreground">{sortedTickets.length}</span> tickets
            </span>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                disabled={currentPage === 1}
                className="h-8 w-8 p-0"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-xs font-normal text-foreground">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="h-8 w-8 p-0"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

export default TicketsBoard;