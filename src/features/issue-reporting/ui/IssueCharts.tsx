"use client";

import type { CSSProperties } from "react";
import { Cell, Pie, PieChart } from "recharts";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	ChartContainer,
	ChartLegend,
	ChartLegendContent,
	ChartTooltip,
	ChartTooltipContent,
	type ChartConfig,
} from "@/components/ui/chart";
import type { IssueStats } from "@/entities/issue";

/* -------------------------------------------------------------------------- */
/*                         Severity donut (c-chart-21)                        */
/* -------------------------------------------------------------------------- */

const SEVERITY_COLORS: Record<"LOW" | "MEDIUM" | "HIGH", string> = {
	LOW: "var(--chart-5)",
	MEDIUM: "var(--chart-3)",
	HIGH: "var(--chart-4)",
};

const severityChartConfig = {
	LOW: { label: "Low", color: SEVERITY_COLORS.LOW },
	MEDIUM: { label: "Medium", color: SEVERITY_COLORS.MEDIUM },
	HIGH: { label: "High", color: SEVERITY_COLORS.HIGH },
} satisfies ChartConfig;

function SeverityDonut({ data }: { data: IssueStats }) {
	const chartData = data.byUrgency.map((row) => ({
		urgency: row.urgency,
		issues: row.count,
		fill: SEVERITY_COLORS[row.urgency],
	}));

	return (
		<Card className="w-full">
			<CardHeader className="items-center pb-0">
				<CardTitle>Issues by Severity</CardTitle>
				<CardDescription>All reported issues by urgency level</CardDescription>
			</CardHeader>
			<CardContent className="flex-1 pb-0">
				<ChartContainer
					config={severityChartConfig}
					className="mx-auto aspect-square max-h-[240px]"
				>
					<PieChart accessibilityLayer>
						<ChartTooltip
							content={
								<ChartTooltipContent
									className="min-w-40 gap-2.5"
									formatter={(value, name) => (
										<div className="flex w-full items-center justify-between gap-2">
											<div className="flex items-center gap-1.5">
												<div
													className="h-2.5 w-2.5 shrink-0 rounded-xs bg-(--color-bg)"
													style={
														{
															"--color-bg": `var(--color-${name})`,
														} as CSSProperties
													}
												/>
												<span className="text-muted-foreground">
													{severityChartConfig[
														name as keyof typeof severityChartConfig
													]?.label ?? name}
												</span>
											</div>
											<span className="text-foreground font-semibold tabular-nums">
												{Number(value).toLocaleString()}
											</span>
										</div>
									)}
								/>
							}
						/>
						<ChartLegend
							content={<ChartLegendContent nameKey="urgency" />}
							className="-translate-y-2"
						/>
						<Pie
							data={chartData}
							dataKey="issues"
							nameKey="urgency"
							innerRadius={40}
							cornerRadius={4}
							paddingAngle={3}
							stroke="var(--background)"
							strokeWidth={3}
						>
							{chartData.map((entry) => (
								<Cell key={entry.urgency} fill={entry.fill} />
							))}
						</Pie>
					</PieChart>
				</ChartContainer>
			</CardContent>
		</Card>
	);
}

/* -------------------------------------------------------------------------- */
/*                        Assigned / Unassigned donut                          */
/* -------------------------------------------------------------------------- */

const assignmentChartConfig = {
	assigned: { label: "Assigned", color: "var(--chart-1)" },
	unassigned: { label: "Unassigned", color: "var(--chart-2)" },
} satisfies ChartConfig;

function AssignmentDonut({ data }: { data: IssueStats }) {
	const chartData = [
		{
			status: "assigned",
			issues: data.assigned,
			fill: "var(--color-assigned)",
		},
		{
			status: "unassigned",
			issues: data.unassigned,
			fill: "var(--color-unassigned)",
		},
	];

	return (
		<Card className="w-full">
			<CardHeader className="items-center pb-0">
				<CardTitle>Assigned vs Unassigned</CardTitle>
				<CardDescription>
					Issues linked to a ticket or still waiting for assignment
				</CardDescription>
			</CardHeader>
			<CardContent className="flex-1 pb-0">
				<ChartContainer
					config={assignmentChartConfig}
					className="mx-auto aspect-square max-h-[240px]"
				>
					<PieChart accessibilityLayer>
						<ChartTooltip
							content={
								<ChartTooltipContent
									className="min-w-40 gap-2.5"
									formatter={(value, name) => (
										<div className="flex w-full items-center justify-between gap-2">
											<div className="flex items-center gap-1.5">
												<div
													className="h-2.5 w-2.5 shrink-0 rounded-xs bg-(--color-bg)"
													style={
														{
															"--color-bg": `var(--color-${name})`,
														} as CSSProperties
													}
												/>
												<span className="text-muted-foreground">
													{assignmentChartConfig[
														name as keyof typeof assignmentChartConfig
													]?.label ?? name}
												</span>
											</div>
											<span className="text-foreground font-semibold tabular-nums">
												{Number(value).toLocaleString()}
											</span>
										</div>
									)}
								/>
							}
						/>
						<ChartLegend
							content={<ChartLegendContent nameKey="status" />}
							className="-translate-y-2"
						/>
						<Pie
							data={chartData}
							dataKey="issues"
							nameKey="status"
							innerRadius={40}
							cornerRadius={4}
							paddingAngle={3}
							stroke="var(--background)"
							strokeWidth={3}
						>
							{chartData.map((entry) => (
								<Cell key={entry.status} fill={entry.fill} />
							))}
						</Pie>
					</PieChart>
				</ChartContainer>
			</CardContent>
		</Card>
	);
}

/* -------------------------------------------------------------------------- */
/*                               Main Component                               */
/* -------------------------------------------------------------------------- */

export function IssueCharts({ data }: { data: IssueStats }) {
	if (data.total === 0) {
		return (
			<Card className="w-full">
				<CardHeader className="items-center pb-0">
					<CardTitle>Issues</CardTitle>
					<CardDescription>
						No issues reported yet
					</CardDescription>
				</CardHeader>
			</Card>
		);
	}

	return (
		<div className="w-full grid grid-cols-1 gap-4 sm:grid-cols-2">
			<SeverityDonut data={data} />
			<AssignmentDonut data={data} />
		</div>
	);
}
