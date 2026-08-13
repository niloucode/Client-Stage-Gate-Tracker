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
import type { GanttBarEventData, GanttLevel, GanttRowData, GanttTab } from "../types";
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
export function ProjectGanttChart({ rows, tab, level, today }: ProjectGanttChartProps) {
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
			<div className="h-[32rem] overflow-hidden rounded-md border-t border-border">
				<Gantt<GanttBarEventData>
					// Week-unit columns grouped by month (rather than "month" scale's
					// day-by-day columns) — matches the reference design, and its
					// 3-month active range keeps every phase's bar in view without
					// requiring a scroll to reach it.
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
					// Without this the view greedily pre-fills the container width by
					// growing past the 3-month quarter (e.g. a full year on a wide
					// screen), squeezing every week column down to near-nothing.
					// Locking it to the quarter keeps columns legible; horizontal
					// scroll still kicks in if the quarter itself outgrows the viewport.
					infiniteScroll={false}
					// A short-duration bar (e.g. a week-long "in progress" phase inside
					// a week-wide column) has no room for its own label — "auto" moves
					// the title outside the bar instead of clipping it into "…".
					barLabel="auto"
					// Default row height is sized for a single-line label; ours is two
					// lines (the "PHASE 01" badge + name), so it needs more headroom.
					// laneHeight is the bar itself — default reads thin against the
					// taller row, so it's bumped up too.
					metrics={{ minRowHeight: 5.5, rowPadding: 1, laneHeight: 2.25 }}
					// "start" (the default) anchors content to the row's top edge,
					// which reads as lopsided once the row is taller than its
					// content — "center" keeps the label+bar centered in the extra
					// height instead.
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
