"use client";

import { Eye, Calendar } from "lucide-react";
import { Card } from "@/components/ui/card";

interface WorkflowBadge {
  label: string;
  bg: string;
  stroke: string;
  text: string;
}

interface TagBadge {
  label: string;
  bg: string;
  text: string;
}

interface Assignee {
  initials: string;
  name: string;
  avatarBg: string;
}

interface WatchedTicket {
  id: string;
  name: string;
  project: string;
  module: string;
  workflow: WorkflowBadge;
  tag: TagBadge;
  assignee: Assignee;
  dueDate: string;
  dueDateUrgent?: boolean;
}

interface WatchedTicketsBoardProps {
  tickets?: WatchedTicket[];
  updatesCount?: number;
}

const PLACEHOLDER_TICKETS: WatchedTicket[] = [
  {
    id: "1",
    name: "Stripe Integration Fix",
    project: "Billing",
    module: "API",
    workflow: { label: "Testing", bg: "#6cf8bb", stroke: "#006c49", text: "#00714d" },
    tag: { label: "Critical", bg: "#ffdad6", text: "#93000a" },
    assignee: { initials: "JD", name: "John Doe", avatarBg: "#ffddb8" },
    dueDate: "Today",
    dueDateUrgent: true,
  },
  {
    id: "2",
    name: "iOS 17 Compatibility Check",
    project: "Mobile App",
    module: "Client",
    workflow: { label: "In Progress", bg: "#e2e8f8", stroke: "#c7c4d8", text: "#464555" },
    tag: { label: "Compliance", bg: "#dce2f3", text: "#777587" },
    assignee: { initials: "SM", name: "Sarah M.", avatarBg: "#e2dfff" },
    dueDate: "Oct 30",
    dueDateUrgent: false,
  },
];

const COL_WIDTHS = "grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr_1fr]";

export function WatchedTicketsBoard({
  tickets = PLACEHOLDER_TICKETS,
  updatesCount = 2,
}: WatchedTicketsBoardProps) {
  return (
    <Card
      className="overflow-hidden"
      style={{ border: "1px solid #c7c4d8", borderRadius: "12px" }}
    >
      {/* Header */}
      <div
        className="flex items-center gap-2 px-6 py-4"
        style={{
          backgroundColor: "#f9f9ff",
          borderBottom: "1px solid #c7c4d8",
        }}
      >
        <Eye className="h-4 w-4" style={{ color: "#684000" }} />
        <span className="text-base font-semibold" style={{ color: "#151c27" }}>
          Watching
        </span>
        <span
          className="rounded-full px-2.5 py-0.5 text-[10px] font-bold"
          style={{ backgroundColor: "#ffddb8", color: "#2a1700" }}
        >
          {updatesCount} UPDATES
        </span>
      </div>

      {/* Table */}
      <div>
        {/* Table header */}
        <div
          className={`grid ${COL_WIDTHS} px-6 py-3`}
          style={{
            backgroundColor: "#f0f3ff",
            borderBottom: "1px solid #c7c4d8",
          }}
        >
          {["Ticket Name", "Project", "Module", "Workflow", "Tags", "Assigned To", "Due Date"].map((col) => (
            <span
              key={col}
              className="text-[11px] font-bold uppercase"
              style={{ color: "#777587" }}
            >
              {col}
            </span>
          ))}
        </div>

        {/* Rows */}
        {tickets.map((ticket, i) => (
          <div
            key={ticket.id}
            className={`grid ${COL_WIDTHS} items-center px-6 py-4`}
            style={{
              borderBottom: i < tickets.length - 1 ? "1px solid #c7c4d8" : "none",
            }}
          >
            {/* Ticket name */}
            <span className="text-[13px]" style={{ color: "#151c27" }}>
              {ticket.name}
            </span>

            {/* Project */}
            <span className="text-[13px]" style={{ color: "#464555" }}>
              {ticket.project}
            </span>

            {/* Module */}
            <span className="text-[13px]" style={{ color: "#464555" }}>
              {ticket.module}
            </span>

            {/* Workflow badge */}
            <div>
              <span
                className="inline-block rounded-md px-2 py-0.5 text-[11px] font-semibold"
                style={{
                  backgroundColor: ticket.workflow.bg,
                  border: `1px solid ${ticket.workflow.stroke}`,
                  color: ticket.workflow.text,
                }}
              >
                {ticket.workflow.label}
              </span>
            </div>

            {/* Tag */}
            <div>
              <span
                className="inline-block rounded px-2 py-0.5 text-[10px] font-bold"
                style={{
                  backgroundColor: ticket.tag.bg,
                  color: ticket.tag.text,
                }}
              >
                {ticket.tag.label}
              </span>
            </div>

            {/* Assigned to */}
            <div className="flex items-center gap-2">
              <div
                className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full"
                style={{ backgroundColor: ticket.assignee.avatarBg }}
              >
                <span className="text-[8px] font-bold" style={{ color: "#151c27" }}>
                  {ticket.assignee.initials}
                </span>
              </div>
              <span className="text-[13px]" style={{ color: "#464555" }}>
                {ticket.assignee.name}
              </span>
            </div>

            {/* Due date */}
            <div className="flex items-center gap-1.5">
              <Calendar
                className="h-3 w-3 shrink-0"
                style={{ color: ticket.dueDateUrgent ? "#ba1a1a" : "#464555" }}
              />
              <span
                className="text-[13px]"
                style={{
                  color: ticket.dueDateUrgent ? "#ba1a1a" : "#464555",
                  fontWeight: ticket.dueDateUrgent ? 600 : 400,
                }}
              >
                {ticket.dueDate}
              </span>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

export default WatchedTicketsBoard;
