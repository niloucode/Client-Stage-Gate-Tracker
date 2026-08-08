"use client";

import React from "react";
import {
  Check,
  Workflow,
  Plus,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface Stage {
  id: string;
  stageNumber: number;
  stageName: string;
  approved: boolean;
  current?: boolean;
}

interface TicketItem {
  code: string;
  title: string;
  dateRange: string;
}

interface StatItem {
  label: string;
  done: number;
  total: number;
  icon: React.ReactNode;
}

interface StageSequenceProps {
  stages: Stage[];
  selectedId?: string | null;
  onSelectStage?: (id: string) => void;
  onAddStage?: () => void;
  showAddButton?: boolean;
}

// ─── Shared UI Helpers ───────────────────────────────────────────────────────

function SectionLabel({
  icon: Icon,
  label,
  className = "",
}: {
  icon: React.ElementType;
  label: string;
  className?: string;
}) {
  return (
    <div
      className={`flex items-center gap-1.5 text-xs font-semibold tracking-wider text-muted-foreground uppercase ${className}`}
    >
      <Icon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
      <span>{label}</span>
    </div>
  );
}

// ─── Stage Stepper Sub-Components ───────────────────────────────────────────

function StageStep({
  stageNumber,
  stageName,
  status,
  selected,
  badge,
  onClick,
}: {
  stageNumber: number;
  stageName: string;
  status: "approved" | "unapproved";
  selected?: boolean;
  badge?: "approved" | "current" | null;
  onClick?: () => void;
}) {
  const isApproved = status === "approved";
  const isCurrent = badge === "current";

  return (
    <button
      type="button"
      onClick={onClick}
      className={`group flex cursor-pointer flex-col items-center gap-2 text-center transition-transform duration-200 focus:outline-none ${
        selected ? "" : ""
      }`}
    >
      {/* Node Circle */}
      <div
        className={`relative flex h-13 w-13 items-center justify-center rounded-full text-sm font-bold border-2 transition-all shadow-xs ${
          selected
            ? "border-brand-600 bg-brand-600 text-white ring-4 ring-brand-100"
            : isApproved
            ? "border-brand-500 bg-brand-500 text-white"
            : isCurrent
            ? "border-brand-600 bg-brand-50 text-brand-600"
            : "border-warm-gray-200 bg-neutral-subtle text-neutral-border"
        }`}
      >
        {isApproved ? (
          <Check className="h-5 w-5" />
        ) : (
          <span>{stageNumber}</span>
        )}
      </div>

      {/* Badge Tag */}
      {badge && (
        <span
          className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
            badge === "approved"
              ? "border-green-600/30 bg-green-100 text-green-600"
              : "border-brand-500/30 bg-brand-50 text-brand-600"
          }`}
        >
          {badge === "approved" ? "Approved" : "In Progress"}
        </span>
      )}

      {/* Title */}
      <span
        className={`max-w-[100px] text-xs font-semibold leading-tight line-clamp-2 ${
          selected || isCurrent ? "text-brand-600" : "text-neutral-muted"
        }`}
      >
        {stageName}
      </span>
    </button>
  );
}

export function StageSequence({
  stages,
  selectedId,
  onSelectStage,
  onAddStage,
  showAddButton = true,
}: StageSequenceProps) {
  const lastApprovedIdx = stages.reduce(
    (acc, s, i) => (s.approved ? i : acc),
    -1
  );
  const progressPct =
    stages.length > 1 ? (lastApprovedIdx / (stages.length - 1)) * 100 : 0;

  const NODE_SLOT = 120;
  const CIRCLE_CENTER_Y = 26;

  return (
    <div className="w-full">
      {/* Header with Section Label and Add Action */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-4">
        <SectionLabel icon={Workflow} label="Stage Sequence" />
        {showAddButton && (
          <button
            type="button"
            onClick={onAddStage}
            className="flex cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-brand-600 bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-brand-500 w-full sm:w-auto"
          >
            <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
            <span>New Stage</span>
          </button>
        )}
      </div>

      {/* Stepper Timeline */}
      <div className="hide-scrollbar overflow-x-auto py-2">
        <div
          className="relative flex items-start justify-between min-w-full px-2"
          style={{ minWidth: `${stages.length * NODE_SLOT}px` }}
        >
          {/* Progress Connector Line */}
          {stages.length > 1 && (
            <div
              className="absolute -translate-y-1/2 rounded-full"
              style={{
                top: CIRCLE_CENTER_Y,
                left: NODE_SLOT / 2,
                width: `calc(100% - ${NODE_SLOT}px)`,
                height: 3,
                backgroundColor: "#E5E3E0",
              }}
            >
              <div
                className="h-full rounded-full bg-brand-600 transition-all duration-300"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          )}

          {/* Node Items */}
          {stages.map((stage) => {
            const badge = stage.approved
              ? "approved"
              : stage.current
              ? "current"
              : null;

            return (
              <div
                key={stage.id}
                className="relative z-10 flex justify-center"
                style={{ width: NODE_SLOT }}
              >
                <StageStep
                  stageNumber={stage.stageNumber}
                  stageName={stage.stageName}
                  status={stage.approved ? "approved" : "unapproved"}
                  selected={selectedId === stage.id}
                  badge={badge}
                  onClick={() => onSelectStage?.(stage.id)}
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}