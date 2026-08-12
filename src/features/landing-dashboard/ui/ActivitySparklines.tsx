"use client";

import { ShieldCheck, AlertCircle } from "lucide-react";
import { Card } from "@/components/ui/card";

interface SparklineBar {
  opacity: number; // 0–1
  heightPx: number;
}

interface ActivitySparklinesProps {
  weeklyVelocity?: { value: number; change: string; changePositive: boolean };
  riskFactor?: { label: string };
  upcomingDeadlines?: { count: number; urgencyLabel: string; isUrgent: boolean };
}

const SPARKLINE_BARS: SparklineBar[] = [
  { opacity: 0.2, heightPx: 16 },
  { opacity: 0.4, heightPx: 24 },
  { opacity: 0.2, heightPx: 20 },
  { opacity: 0.6, heightPx: 32 },
  { opacity: 1.0, heightPx: 40 },
];

const SPARKLINE_COLOR = "#3525cd";

export function ActivitySparklines({
  weeklyVelocity = { value: 24, change: "+12%", changePositive: true },
  riskFactor = { label: "Low" },
  upcomingDeadlines = { count: 2, urgencyLabel: "Today", isUrgent: true },
}: ActivitySparklinesProps) {
  return (
    <div className="grid grid-cols-3 gap-4">
      {/* Card 1: Weekly Velocity */}
      <Card
        className="flex flex-row items-center gap-4 px-5 py-4"
        style={{ border: "1px solid #c7c4d8", borderRadius: "12px" }}
      >
        {/* Sparkline bars */}
        <div className="flex items-end gap-1" style={{ height: "40px" }}>
          {SPARKLINE_BARS.map((bar, i) => (
            <div
              key={i}
              style={{
                width: "10px",
                height: `${bar.heightPx}px`,
                backgroundColor: SPARKLINE_COLOR,
                opacity: bar.opacity,
                borderRadius: "2px",
              }}
            />
          ))}
        </div>

        {/* Stats */}
        <div className="flex flex-col gap-1">
          <span
            className="text-[11px] font-semibold uppercase tracking-wide"
            style={{ color: "#777587" }}
          >
            Weekly Velocity
          </span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-bold" style={{ color: "#151c27" }}>
              {weeklyVelocity.value}
            </span>
            <span
              className="text-[13px] font-semibold"
              style={{
                color: weeklyVelocity.changePositive ? "#006c49" : "#ba1a1a",
              }}
            >
              {weeklyVelocity.change}
            </span>
          </div>
        </div>
      </Card>

      {/* Card 2: Risk Factor */}
      <Card
        className="flex flex-row items-center gap-4 px-5 py-4"
        style={{ border: "1px solid #c7c4d8", borderRadius: "12px" }}
      >
        <ShieldCheck
          className="h-8 w-8 shrink-0"
          style={{ color: "#006c49" }}
        />
        <div className="flex flex-col gap-1">
          <span
            className="text-[11px] font-semibold uppercase tracking-wide"
            style={{ color: "#777587" }}
          >
            Risk Factor
          </span>
          <span className="text-2xl font-bold" style={{ color: "#151c27" }}>
            {riskFactor.label}
          </span>
        </div>
      </Card>

      {/* Card 3: Upcoming Deadlines */}
      <Card
        className="flex flex-row items-center justify-between px-5 py-4"
        style={{ border: "1px solid #c7c4d8", borderRadius: "12px" }}
      >
        <div className="flex flex-col gap-1">
          <span
            className="text-[11px] font-semibold uppercase tracking-wide"
            style={{ color: "#777587" }}
          >
            Upcoming Deadlines
          </span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-bold" style={{ color: "#151c27" }}>
              {upcomingDeadlines.count}
            </span>
            <span
              className="text-sm font-bold"
              style={{
                color: upcomingDeadlines.isUrgent ? "#ba1a1a" : "#151c27",
              }}
            >
              {upcomingDeadlines.urgencyLabel}
            </span>
          </div>
        </div>
        {upcomingDeadlines.isUrgent && (
          <AlertCircle
            className="h-5 w-5 shrink-0"
            style={{ color: "#ba1a1a" }}
          />
        )}
      </Card>
    </div>
  );
}

export default ActivitySparklines;
