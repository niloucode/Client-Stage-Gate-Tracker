"use client";

import { ShieldCheck, AlertCircle, Clock } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Http2ServerRequest } from "http2";

/* -------------------------------------------------------------------------- */
/*                                 Interfaces                                 */
/* -------------------------------------------------------------------------- */

export interface WeeklyVelocityData {
  value: number;
  change: string;
  changePositive: boolean;
}

export interface RiskFactorData {
  label: string;
}

export interface UpcomingDeadlinesData {
  count: number;
  urgencyLabel: string;
  isUrgent: boolean;
}

export interface ActivitySparklinesProps {
  weeklyVelocity?: WeeklyVelocityData;
  riskFactor?: RiskFactorData;
  upcomingDeadlines?: UpcomingDeadlinesData;
}

interface SparklineBar {
  opacity: number;
  heightPx: number;
}

/* -------------------------------------------------------------------------- */
/*                                 Constants                                  */
/* -------------------------------------------------------------------------- */

const SPARKLINE_BARS: SparklineBar[] = [
  { opacity: 0.2, heightPx: 16 },
  { opacity: 0.4, heightPx: 24 },
  { opacity: 0.2, heightPx: 20 },
  { opacity: 0.6, heightPx: 32 },
  { opacity: 1.0, heightPx: 40 },
];

const DEFAULT_VELOCITY: WeeklyVelocityData = {
  value: 24,
  change: "+12%",
  changePositive: true,
};

const DEFAULT_RISK: RiskFactorData = {
  label: "Low",
};

const DEFAULT_DEADLINES: UpcomingDeadlinesData = {
  count: 2,
  urgencyLabel: "Today",
  isUrgent: true,
};


/* -------------------------------------------------------------------------- */
/*                              Sub-Components                                */
/* -------------------------------------------------------------------------- */

/** Base layout container for all stat cards */
function BaseStatCard({
  visual,
  title,
  children,
}: {
  visual: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="p-6 border-brand-100 border max-h-50">
      <div className="flex h-10 items-center">{visual}</div>
      <div className="flex flex-col gap-1">
        <h4 className="text-xs  uppercase tracking-wider text-muted-foreground">
          {title}
        </h4>
        {children}
      </div>
    </Card>
  );
}

/** Visual element rendering sparkline bar chart */
function SparklineBars() {
  return (
    <div className="flex h-10 items-end gap-1">
      {SPARKLINE_BARS.map((bar, i) => (
        <div
          key={i}
          className="w-2.5 rounded-xs bg-brand-600"
          style={{
            height: `${bar.heightPx}px`,
            opacity: bar.opacity,
          }}
        />
      ))}
    </div>
  );
}

/** Card 1: Weekly Velocity */
function VelocityCard({ data }: { data: WeeklyVelocityData }) {
  return (
    <BaseStatCard visual={<SparklineBars />} title="Weekly Velocity">
      <div className="flex items-baseline gap-2">
        <h2 className="text-2xl  tracking-tight text-foreground">
          {data.value}
        </h2>
        <h4
          className={`text-xs  ${
            data.changePositive
              ? "text-emerald-600! dark:text-emerald-500!"
              : "text-destructive"
          }`}
        >
          {data.change}
        </h4>
      </div>
    </BaseStatCard>
  );
}

/** Card 2: Risk Factor */
function RiskFactorCard({ data }: { data: RiskFactorData }) {
  return (
    <BaseStatCard
      visual={
        <ShieldCheck className="h-7 w-7 text-emerald-600 dark:text-emerald-500" />
      }
      title="Risk Factor"
    >
      <h2 className="text-2xl  tracking-tight text-foreground">
        {data.label}
      </h2>
    </BaseStatCard>
  );
}

/** Card 3: Upcoming Deadlines */
function UpcomingDeadlinesCard({ data }: { data: UpcomingDeadlinesData }) {
  const Icon = data.isUrgent ? AlertCircle : Clock;
  const iconStyle = data.isUrgent
    ? "text-destructive"
    : "text-muted-foreground";

  return (
    <BaseStatCard
      visual={<Icon className={`h-7 w-7 ${iconStyle}`} />}
      title="Upcoming Deadlines"
    >
      <div className="flex items-baseline gap-2">
        <h2 className="text-2xl  tracking-tight text-foreground">
          {data.count}
        </h2>
        <h4
          className={`text-xs  ${
            data.isUrgent ? "text-destructive!" : "text-muted-foreground!"
          }`}
        >
          {data.urgencyLabel}
        </h4>
      </div>
    </BaseStatCard>
  );
}

/* -------------------------------------------------------------------------- */
/*                               Main Component                               */
/* -------------------------------------------------------------------------- */

export function ActivitySparklines({
  weeklyVelocity = DEFAULT_VELOCITY,
  riskFactor = DEFAULT_RISK,
  upcomingDeadlines = DEFAULT_DEADLINES,
}: ActivitySparklinesProps) {
  return (
    <div className="w-full grid grid-cols-1 gap-4 sm:grid-cols-3">
      <VelocityCard data={weeklyVelocity} />
      <RiskFactorCard data={riskFactor} />
      <UpcomingDeadlinesCard data={upcomingDeadlines} />
    </div>
  );
}

export default ActivitySparklines;