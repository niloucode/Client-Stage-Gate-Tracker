"use client";

import { useMemo } from "react";
import { Gantt } from "@/components/reui/gantt/gantt";
import { GanttView } from "@/components/reui/gantt/gantt-view";
import { TooltipProvider } from "@/components/ui/tooltip";
import {
	LEVEL_SINGULAR,
	buildGanttEvents,
	buildGanttResources,
	type GanttRowResource,
} from "../lib/ganttMapping";
import type {
	GanttBarEventData,
	GanttLevel,
	GanttRowData,
	GanttTab,
} from "../types";
import { EmptyGanttState } from "./EmptyGanttState";
import { GanttBarContent } from "./GanttBarContent";
import { GanttResourceLabel } from "./GanttResourceLabel";

interface ProjectGanttChartProps {
	rows: GanttRowData[];
	tab: GanttTab;
	level: GanttLevel;
	today: Date;
}

const LEVEL_HEADER_LABEL: Record<GanttLevel, string> = {
	phases: "Phases",
	modules: "Modules",
	workflows: "Workflows",
};

/**
 * Thin wrapper around the reui Gantt engine: maps our normalized rows into
 * its resources/events shape and swaps only the bar CONTENT (GanttBarContent)
 * and the empty state — layout, scroll and the today line stay library-owned.
 */
export function ProjectGanttChart({
	rows,
	tab,
	level,
	today,
}: ProjectGanttChartProps) {
	const resources = useMemo(() => buildGanttResources(rows), [rows]);
	const events = useMemo(
		() => buildGanttEvents(rows, tab, today),
		[rows, tab, today],
	);

	if (resources.length === 0) {
		return <EmptyGanttState level={level} />;
	}

	return (
		<TooltipProvider>
			{/* No border/bg here — this sits inside DashboardAnalyticsPage's outer card now. */}
			<div className="h-128 overflow-hidden rounded-md border-t border-border scroll-smooth">
				<Gantt<GanttBarEventData>
					scale="quarter"
					defaultDate={today}
					resources={resources}
					events={events}
					interactions={{ drag: false, resize: false, selectSlot: false }}
					rowCheckboxes={false}
					zoomControl={false}
					wheelZoom={false}
					dragCreate={false}
					displayCreateTaskHint={false}
					scheduleMode="single"
					timelineLines="both"
					nowIndicator
					infiniteScroll={false}
					barLabel="auto"
					metrics={{
						minRowHeight: 5.5,
						rowPadding: 1,
						laneHeight: 2.25,
						unitWidths: { quarter: 5 },
					}}
					treePanel={{ width: 220 }}
					rowAlign="center"
					i18n={{ labels: { resources: LEVEL_HEADER_LABEL[level] } }}
					renderEvent={(props) => <GanttBarContent {...props} />}
					renderResourceLabel={({ resource }) => (
						<GanttResourceLabel
							resource={resource as GanttRowResource}
							levelSingular={LEVEL_SINGULAR[level]}
						/>
					)}
					className="h-full"
				>
					<GanttView />
				</Gantt>
			</div>
		</TooltipProvider>
	);
}
