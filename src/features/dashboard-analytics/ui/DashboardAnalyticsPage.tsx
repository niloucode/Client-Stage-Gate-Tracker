"use client";

import { useState } from "react";
import { Back } from "@/components/ui/back";
import { Button } from "@/components/ui/button";
import { useModulesGantt, usePhasesGantt, useWorkflowsGantt } from "../queries";
import type { GanttLevel, GanttRowData, GanttTab } from "../types";
import { GanttTabs } from "./GanttTabs";
import { LevelFilterPills } from "./LevelFilterPills";
import { ProjectGanttChart } from "./ProjectGanttChart";

const TAB_COPY: Record<GanttTab, { title: string; description: string }> = {
	planned: {
		title: "Planned Gantt Chart",
		description:
			"The Planned Gantt chart displays the scheduled timeline of a project, showing when each task is intended to start and finish before work begins. It helps teams visualize task durations and deadlines, making it easier to plan resources and track progress against the original schedule.",
	},
	actual: {
		title: "Actual Gantt Chart",
		description:
			"The actual Gantt chart shows the real progress of a project by displaying when tasks actually started, finished, or are currently in progress. It provides an accurate timeline of completed and ongoing work, allowing teams to monitor the current status of the project.",
	},
};

const LEVEL_LABEL: Record<GanttLevel, string> = {
	phases: "Phases",
	modules: "Modules",
	workflows: "Workflows",
};

/**
 * Gantt dashboard page: tabs, level pills, and the chart.
 * @returns The result.
 */
export function DashboardAnalyticsPage({ projectId }: { projectId: string }) {
	const [tab, setTab] = useState<GanttTab>("actual");
	const [level, setLevel] = useState<GanttLevel>("phases");
	// Real clock: the nowIndicator and in-progress bar ends must track "now",
	// not a frozen mock date.
	const [today] = useState(() => new Date());

	const phasesQuery = usePhasesGantt(projectId);
	const modulesQuery = useModulesGantt(projectId);
	const workflowsQuery = useWorkflowsGantt(projectId);

	const queryByLevel = {
		phases: phasesQuery,
		modules: modulesQuery,
		workflows: workflowsQuery,
	} satisfies Record<
		GanttLevel,
		{
			data?: GanttRowData[];
			isPending: boolean;
			isError: boolean;
			refetch: () => unknown;
		}
	>;

	const activeQuery = queryByLevel[level];
	const rows = activeQuery.data ?? [];
	const copy = TAB_COPY[tab];

	return (
		<div className="flex flex-1 flex-col gap-6">
			<Back link={`/projects/${projectId}`} />

			<div className="mb-6">
				<h1>Dashboard Analytics</h1>
				<p className="subtitle">
					Track project timelines and progress across phases, modules, and
					workflows.
				</p>
			</div>

			<div className="rounded-md border border-border bg-card p-6">
				<GanttTabs value={tab} onValueChange={setTab} />

				<section className="mt-5 flex flex-col gap-5">
					<div>
						<h3>{copy.title}</h3>
						<p className="subtitle">{copy.description}</p>
					</div>

					<div className="flex justify-end">
						<LevelFilterPills value={level} onValueChange={setLevel} />
					</div>

					{activeQuery.isPending ? (
						<div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
							Loading {LEVEL_LABEL[level].toLowerCase()} timeline…
						</div>
					) : activeQuery.isError ? (
						<div className="flex h-64 flex-col items-center justify-center gap-3 text-sm text-muted-foreground">
							<p>
								Failed to load {LEVEL_LABEL[level].toLowerCase()} for this
								project.
							</p>
							<Button
								variant="outline"
								size="sm"
								onClick={() => void activeQuery.refetch()}
							>
								Retry
							</Button>
						</div>
					) : (
						<ProjectGanttChart
							rows={rows}
							tab={tab}
							level={level}
							today={today}
						/>
					)}
				</section>
			</div>
		</div>
	);
}
