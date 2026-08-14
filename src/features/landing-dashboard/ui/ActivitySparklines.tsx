"use client";

import type { ReactNode } from "react";
import { ShieldCheck, AlertCircle, Clock } from "lucide-react";
import { Bar, BarChart, XAxis } from "recharts";
import { Card } from "@/components/ui/card";
import {
	ChartContainer,
	ChartTooltip,
	ChartTooltipContent,
	type ChartConfig,
} from "@/components/ui/chart";

/* -------------------------------------------------------------------------- */
/*                                 Interfaces                                 */
/* -------------------------------------------------------------------------- */

export interface WeeklyVelocityData {
	/** Tickets finished in the current week by the signed-in user. */
	value: number;
	/** e.g. "+12%" or "—" when last week had no completions. */
	change: string;
	changePositive: boolean;
	/** Finished tickets per weekday (index 0 = Monday … 6 = Sunday). */
	daily: number[];
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
	weeklyVelocity: WeeklyVelocityData;
	riskFactor: RiskFactorData;
	upcomingDeadlines: UpcomingDeadlinesData;
}

/* -------------------------------------------------------------------------- */
/*                              Sub-Components                                */
/* -------------------------------------------------------------------------- */

/** Base layout container for all stat cards */
function BaseStatCard({
	visual,
	title,
	children,
}: {
	visual: ReactNode;
	title: string;
	children: ReactNode;
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

const WEEKDAY_LABELS = [
	"Mon",
	"Tue",
	"Wed",
	"Thu",
	"Fri",
	"Sat",
	"Sun",
] as const;

const velocityChartConfig = {
	completed: {
		label: "Completed",
		color: "var(--chart-1)",
	},
} satisfies ChartConfig;

/** Weekly velocity sparkline: one bar per weekday (Mon–Sun). */
function WeeklyVelocityChart({ daily }: { daily: number[] }) {
	const chartData = WEEKDAY_LABELS.map((day, i) => ({
		day,
		completed: daily[i] ?? 0,
	}));

	return (
		<ChartContainer config={velocityChartConfig} className="h-16 w-full">
			<BarChart accessibilityLayer data={chartData}>
				<XAxis
					dataKey="day"
					tickLine={false}
					axisLine={false}
					tickMargin={4}
					interval={0}
					tick={{ fontSize: 9 }}
				/>
				<ChartTooltip
					cursor={false}
					content={<ChartTooltipContent indicator="dot" />}
				/>
				<Bar dataKey="completed" fill="var(--color-completed)" radius={2} />
			</BarChart>
		</ChartContainer>
	);
}

/** Card 1: Weekly Velocity */
function VelocityCard({ data }: { data: WeeklyVelocityData }) {
	return (
		<BaseStatCard
			visual={<WeeklyVelocityChart daily={data.daily} />}
			title="Weekly Velocity"
		>
			<div className="flex items-baseline gap-2">
				<h2 className="text-2xl  tracking-tight text-foreground">
					{data.value}
				</h2>
				<h4
					className={`text-xs  ${
						data.change === "—"
							? "text-muted-foreground"
							: data.changePositive
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
			<h2 className="text-2xl  tracking-tight text-foreground">{data.label}</h2>
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
	weeklyVelocity,
	riskFactor,
	upcomingDeadlines,
}: ActivitySparklinesProps) {
	return (
		<div className="w-full grid grid-cols-1 gap-4 sm:grid-cols-3">
			<VelocityCard data={weeklyVelocity} />
			<RiskFactorCard data={riskFactor} />
			<UpcomingDeadlinesCard data={upcomingDeadlines} />
		</div>
	);
}
