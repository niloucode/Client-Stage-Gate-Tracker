"use client";

import { useState } from "react";
import { MOCK_TODAY } from "../lib/mockData";
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

export function DashboardAnalyticsPage({ projectId }: { projectId: string }) {
	const [tab, setTab] = useState<GanttTab>("actual");
	const [level, setLevel] = useState<GanttLevel>("phases");

	const phasesQuery = usePhasesGantt(projectId);
	const modulesQuery = useModulesGantt(projectId);
	const workflowsQuery = useWorkflowsGantt(projectId);

	const rowsByLevel: Record<GanttLevel, GanttRowData[]> = {
		phases: phasesQuery.data ?? [],
		modules: modulesQuery.data ?? [],
		workflows: workflowsQuery.data ?? [],
	};

	const rows = rowsByLevel[level];
	const copy = TAB_COPY[tab];

	function handleTabChange(nextTab: GanttTab) {
		setTab(nextTab);
	}

	function handleLevelChange(nextLevel: GanttLevel) {
		setLevel(nextLevel);
	}

	return (
		<div className="flex flex-1 flex-col gap-6">
			<div className="mb-6">
				<h1>Dashboard Analytics</h1>
				<p className="subtitle">
					Track project timelines and progress across phases, modules, and workflows.
				</p>
			</div>

			<div className="rounded-md border border-border bg-card p-6">
				<GanttTabs value={tab} onValueChange={handleTabChange} />

				<section className="mt-5 flex flex-col gap-5">
					<div>
						<h3>{copy.title}</h3>
						<p className="subtitle">{copy.description}</p>
					</div>

					<div className="flex justify-end">
						<LevelFilterPills value={level} onValueChange={handleLevelChange} />
					</div>

					<ProjectGanttChart rows={rows} tab={tab} level={level} today={MOCK_TODAY} />
				</section>
			</div>
		</div>
	);
}
