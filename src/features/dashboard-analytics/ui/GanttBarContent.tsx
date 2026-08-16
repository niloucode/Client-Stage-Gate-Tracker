"use client";

import type { GanttRenderEventProps } from "@/components/reui/gantt/gantt";
import { cn } from "@/lib/utils";
import type { GanttBarEventData } from "../types";

/**
 * Replaces reui's default translucent-tint bar with a solid fill (Planned tab
 * gets a dashed outline instead) — the engine still owns all positioning,
 * drag/resize wiring and lane packing; this only swaps the bar's content.
 */
export function GanttBarContent({
	occurrence,
}: GanttRenderEventProps<GanttBarEventData>) {
	const { title, color, data } = occurrence.event;
	const isPlanned = data?.tab === "planned";
	const barColor = color ?? "var(--color-primary)";

	return (
		<div
			className={cn(
				"flex h-full w-full items-center px-2 text-xs font-medium",
				isPlanned
					? "border-2 border-dashed bg-transparent"
					: "text-primary-foreground",
			)}
			style={{
				borderColor: isPlanned ? barColor : undefined,
				color: isPlanned ? barColor : undefined,
				backgroundColor: isPlanned ? "transparent" : barColor,
			}}
		>
			<span className="truncate">{title}</span>
		</div>
	);
}
