import type { GanttRowResource } from "../lib/ganttMapping";

/** Two-line tree-row label: "PHASE 01" (status-colored) over the row's name. * @returns The rendered label.
 */
export function GanttResourceLabel({
	resource,
	levelSingular,
}: {
	resource: GanttRowResource;
	levelSingular: string;
}) {
	return (
		<div className="flex flex-col gap-1.5 py-2.5 text-left">
			{resource.number !== null && (
				<span
					className="text-[11px] font-medium tracking-wide uppercase"
					style={{ color: resource.color }}
				>
					{levelSingular} {String(resource.number).padStart(2, "0")}
				</span>
			)}
			<span className="truncate text-sm text-foreground">{resource.title}</span>
		</div>
	);
}
