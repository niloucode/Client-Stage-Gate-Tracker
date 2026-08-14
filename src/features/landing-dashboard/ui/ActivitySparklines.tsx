"use client";

import { ShieldCheck, AlertCircle, Clock } from "lucide-react";
import { Bar, BarChart, XAxis, PieChart, Pie, Sector } from "recharts";
import type { PieSectorShapeProps } from "recharts";
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
	count?: number;
	urgencyLabel?: string;
	isUrgent?: boolean;
	day?: number;
	week?: number;
	month?: number;
}

export interface IssuesBySeverityData {
	high: number;
	low: number;
	medium: number;
}

export interface AssignedVsUnassignedData {
	assigned: number;
	unassigned: number;
}

export interface ActivitySparklinesProps {
	weeklyVelocity: WeeklyVelocityData;
	riskFactor: RiskFactorData;
	upcomingDeadlines: UpcomingDeadlinesData;
	issuesBySeverity: IssuesBySeverityData;
	assignedVsUnassigned: AssignedVsUnassignedData;
}

/* -------------------------------------------------------------------------- */
/*                              Sub-Components                                */
/* -------------------------------------------------------------------------- */

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

const severityChartConfig = {
	High: {
		label: "High",
		color: "var(--color-brand-500, hsl(var(--brand-500)))",
	},
	Medium: {
		label: "Medium",
		color: "var(--color-brand-200, hsl(var(--brand-200)))",
	},
	Low: { label: "Low", color: "var(--color-brand-100, hsl(var(--brand-100)))" },
	high: {
		label: "High",
		color: "var(--color-brand-500, hsl(var(--brand-500)))",
	},
	medium: {
		label: "Medium",
		color: "var(--color-brand-200, hsl(var(--brand-200)))",
	},
	low: { label: "Low", color: "var(--color-brand-100, hsl(var(--brand-100)))" },
	None: { label: "No issues", color: "var(--border)" },
} satisfies ChartConfig;

/**
 * Donut tooltip formatter: the empty-state ring uses a placeholder slice
 * (value 1, purely to draw the circle) — never show that fabricated count.
 */
function donutTooltipFormatter(value: unknown, name: unknown) {
	if (name === "None") {
		return (
			<div className="flex w-full items-center gap-2">
				<span className="text-muted-foreground">No issues</span>
			</div>
		);
	}
	return (
		<div className="flex w-full items-center justify-between gap-2">
			<span className="text-muted-foreground">{String(name)}</span>
			<span className="text-foreground font-semibold tabular-nums">
				{Number(value).toLocaleString()}
			</span>
		</div>
	);
}

const assignmentChartConfig = {
	Assigned: {
		label: "Assigned",
		color: "var(--color-brand-500, hsl(var(--brand-500)))",
	},
	Unassigned: {
		label: "Unassigned",
		color: "var(--color-brand-200, hsl(var(--brand-200)))",
	},
	assigned: {
		label: "Assigned",
		color: "var(--color-brand-500, hsl(var(--brand-500)))",
	},
	unassigned: {
		label: "Unassigned",
		color: "var(--color-brand-200, hsl(var(--brand-200)))",
	},
	None: { label: "No issues", color: "var(--border)" },
} satisfies ChartConfig;

/** Weekly velocity sparkline: one bar per weekday (Mon–Sun). */
function WeeklyVelocityChart({ daily = [] }: { daily?: number[] }) {
	const chartData = WEEKDAY_LABELS.map((day, i) => ({
		day,
		completed: daily[i] ?? 0,
	}));

	return (
		<ChartContainer config={velocityChartConfig} className="h-28 -mb-3 w-full">
			<BarChart accessibilityLayer data={chartData}>
				<XAxis
					dataKey="day"
					tickLine={false}
					axisLine={false}
					tickMargin={4}
					interval={0}
					tick={{ fontSize: 10 }}
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

/** Card 1: Issues by Severity Doughnut Chart */
function IssuesBySeverityCard({ data }: { data?: IssuesBySeverityData }) {
	const chartData = [
		{
			name: "Low",
			value: data?.low ?? 0,
			fillClass: "fill-brand-100",
			color: "var(--color-brand-100, hsl(var(--brand-100)))",
		},
		{
			name: "Medium",
			value: data?.medium ?? 0,
			fillClass: "fill-brand-200",
			color: "var(--color-brand-200, hsl(var(--brand-200)))",
		},
		{
			name: "High",
			value: data?.high ?? 0,
			fillClass: "fill-brand-500",
			color: "var(--color-brand-500, hsl(var(--brand-500)))",
		},
	].filter((item) => item.value > 0);

	const displayData =
		chartData.length > 0
			? chartData
			: [
					{
						name: "None",
						value: 1,
						fillClass: "fill-border",
						color: "var(--border)",
					},
				];

	return (
		<Card className="p-5 border-brand-100 border flex flex-col justify-between">
			<div>
				<h3 className="text-sm font-semibold text-foreground">
					Issues by Severity
				</h3>
				<p className="text-xs text-muted-foreground mt-0.5">
					All reported issues by urgency level
				</p>
			</div>

			<div className="py-2">
				<ChartContainer
					config={severityChartConfig}
					className="mx-auto aspect-square h-40 w-full"
				>
					<PieChart>
						<ChartTooltip
							cursor={false}
							content={
								<ChartTooltipContent
									nameKey="name"
									formatter={donutTooltipFormatter}
								/>
							}
						/>
						<Pie
							data={displayData}
							dataKey="value"
							nameKey="name"
							innerRadius={40}
							outerRadius={70}
							strokeWidth={2}
							stroke="var(--background)"
							// Recharts 3 deprecates Cell — color each slice via the shape prop.
							shape={(props: PieSectorShapeProps) => {
								const entry = props.payload as
									| { color?: string; fillClass?: string }
									| undefined;
								return (
									<Sector
										{...props}
										fill={entry?.color}
										className={entry?.fillClass}
									/>
								);
							}}
						/>
					</PieChart>
				</ChartContainer>

				<div className="flex items-center justify-center gap-3 text-xs font-medium text-muted-foreground pt-1">
					<div className="flex items-center gap-1">
						<span className="h-2 w-2 rounded-sm bg-brand-100" />
						<span>Low</span>
					</div>
					<div className="flex items-center gap-1">
						<span className="h-2 w-2 rounded-sm bg-brand-200" />
						<span>Medium</span>
					</div>
					<div className="flex items-center gap-1">
						<span className="h-2 w-2 rounded-sm bg-brand-500" />
						<span>High</span>
					</div>
				</div>
			</div>
		</Card>
	);
}

/** Card 2: Assigned vs Unassigned Doughnut Chart */
function AssignedVsUnassignedCard({
	data,
}: {
	data?: AssignedVsUnassignedData;
}) {
	const chartData = [
		{
			name: "Assigned",
			value: data?.assigned ?? 0,
			fillClass: "fill-brand-500",
			color: "var(--color-brand-500, hsl(var(--brand-500)))",
		},
		{
			name: "Unassigned",
			value: data?.unassigned ?? 0,
			fillClass: "fill-brand-200",
			color: "var(--color-brand-200, hsl(var(--brand-200)))",
		},
	].filter((item) => item.value > 0);

	const displayData =
		chartData.length > 0
			? chartData
			: [
					{
						name: "None",
						value: 1,
						fillClass: "fill-border",
						color: "var(--border)",
					},
				];

	return (
		<Card className="p-5 border-brand-100 border flex flex-col justify-between">
			<div>
				<h3 className="text-sm font-semibold text-foreground">
					Assigned vs Unassigned
				</h3>
				<p className="text-xs text-muted-foreground mt-0.5">
					Issues linked to a ticket or unassigned
				</p>
			</div>

			<div className="py-2">
				<ChartContainer
					config={assignmentChartConfig}
					className="mx-auto aspect-square h-40 w-full"
				>
					<PieChart>
						<ChartTooltip
							cursor={false}
							content={
								<ChartTooltipContent
									nameKey="name"
									formatter={donutTooltipFormatter}
								/>
							}
						/>
						<Pie
							data={displayData}
							dataKey="value"
							nameKey="name"
							innerRadius={40}
							outerRadius={70}
							strokeWidth={2}
							stroke="var(--background)"
							// Recharts 3 deprecates Cell — color each slice via the shape prop.
							shape={(props: PieSectorShapeProps) => {
								const entry = props.payload as
									| { color?: string; fillClass?: string }
									| undefined;
								return (
									<Sector
										{...props}
										fill={entry?.color}
										className={entry?.fillClass}
									/>
								);
							}}
						/>
					</PieChart>
				</ChartContainer>

				<div className="flex items-center justify-center gap-3 text-xs font-medium text-muted-foreground pt-1">
					<div className="flex items-center gap-1">
						<span className="h-2 w-2 rounded-sm bg-brand-500" />
						<span>Assigned</span>
					</div>
					<div className="flex items-center gap-1">
						<span className="h-2 w-2 rounded-sm bg-brand-200" />
						<span>Unassigned</span>
					</div>
				</div>
			</div>
		</Card>
	);
}

/** Card 3: Weekly Velocity Card */
function VelocityCard({ data }: { data?: WeeklyVelocityData }) {
	const value = data?.value ?? 0;
	const change = data?.change ?? "—";
	const changePositive = data?.changePositive ?? false;
	const daily = data?.daily ?? [];

	return (
		<Card className="p-5 border-brand-100 border flex flex-col justify-between">
			<div>
				<h4 className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
					WEEKLY VELOCITY
				</h4>
				<div className="flex items-baseline gap-2 mt-1">
					<h2 className="text-2xl font-bold tracking-tight text-foreground">
						{value}
					</h2>
					<h4
						className={`text-xs ${
							change === "—"
								? "text-muted-foreground"
								: changePositive
									? "text-emerald-600! dark:text-emerald-500!"
									: "text-destructive"
						}`}
					>
						{change}
					</h4>
				</div>
			</div>
			<WeeklyVelocityChart daily={daily} />
		</Card>
	);
}

/** Card 4: Risk Factor + Upcoming Deadlines Combined (Two Split Sections) */
function RiskAndDeadlinesCard({
	riskFactor,
	upcomingDeadlines,
}: {
	riskFactor?: RiskFactorData;
	upcomingDeadlines?: UpcomingDeadlinesData;
}) {
	const isUrgent = upcomingDeadlines?.isUrgent ?? false;
	const DeadlineIcon = isUrgent ? AlertCircle : Clock;
	const dayCount = upcomingDeadlines?.day ?? upcomingDeadlines?.count ?? 0;
	const weekCount = upcomingDeadlines?.week ?? upcomingDeadlines?.count ?? 0;
	const monthCount = upcomingDeadlines?.month ?? upcomingDeadlines?.count ?? 0;
	const riskLabel = riskFactor?.label ?? "Low";

	return (
		<Card className="p-5 border-brand-100 border flex flex-col justify-between">
			{/* Top section: Risk Factor */}
			<div className="flex flex-col gap-1 pb-6 border-b border-border">
				<div className="flex items-center gap-2">
					<ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-500 shrink-0" />
					<h4 className="text-xs uppercase tracking-wider text-muted-foreground">
						Risk Factor
					</h4>
				</div>
				<h3 className="text-xl text-foreground pl-6">{riskLabel}</h3>
			</div>

			{/* Bottom section: Upcoming Deadlines (Stacked Rows) */}
			<div className="flex flex-col gap-1.5 pt-2">
				<div className="flex items-center gap-2">
					<DeadlineIcon
						className={`h-4 w-4 shrink-0 ${
							isUrgent ? "text-destructive" : "text-muted-foreground"
						}`}
					/>
					<h4 className="text-xs uppercase tracking-wider text-muted-foreground">
						Upcoming Deadlines
					</h4>
				</div>

				<div className="space-y-1 text-xs text-muted-foreground">
					<div className="flex items-center gap-2">
						<h3>{dayCount}</h3>
						<h4>Today</h4>
					</div>
					<div className="flex items-center gap-2">
						<h3>{weekCount}</h3>
						<h4>This Week</h4>
					</div>
					<div className="flex items-center gap-2">
						<h3>{monthCount}</h3>
						<h4>This Month</h4>
					</div>
				</div>
			</div>
		</Card>
	);
}

/* -------------------------------------------------------------------------- */
/*                               Main Component                               */
/* -------------------------------------------------------------------------- */

export function ActivitySparklines({
	weeklyVelocity,
	riskFactor,
	upcomingDeadlines,
	issuesBySeverity,
	assignedVsUnassigned,
}: ActivitySparklinesProps) {
	return (
		<div className="w-full grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
			<IssuesBySeverityCard data={issuesBySeverity} />
			<AssignedVsUnassignedCard data={assignedVsUnassigned} />
			<VelocityCard data={weeklyVelocity} />
			<RiskAndDeadlinesCard
				riskFactor={riskFactor}
				upcomingDeadlines={upcomingDeadlines}
			/>
		</div>
	);
}
