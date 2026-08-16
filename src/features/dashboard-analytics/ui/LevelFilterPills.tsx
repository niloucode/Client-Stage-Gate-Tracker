"use client";

import { Layers, LayoutGrid, Workflow as WorkflowIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { ganttLevelSchema } from "../lib/schema";
import type { GanttLevel } from "../types";

const LEVEL_OPTIONS: {
	level: GanttLevel;
	label: string;
	icon: typeof Layers;
}[] = [
	{ level: "phases", label: "Phases", icon: Layers },
	{ level: "modules", label: "Modules", icon: LayoutGrid },
	{ level: "workflows", label: "Workflows", icon: WorkflowIcon },
];

export function LevelFilterPills({
	value,
	onValueChange,
}: {
	value: GanttLevel;
	onValueChange: (level: GanttLevel) => void;
}) {
	return (
		<div className="flex items-center gap-1 rounded-md bg-muted p-1">
			{LEVEL_OPTIONS.map(({ level, label, icon: Icon }) => {
				const isActive = level === value;
				return (
					<button
						key={level}
						type="button"
						onClick={() => {
							// Runtime guard mirrors the schema (single source of truth).
							if (ganttLevelSchema.safeParse(level).success) {
								onValueChange(level);
							}
						}}
						aria-pressed={isActive}
						className={cn(
							"flex items-center gap-1.5 rounded-sm px-3 py-1.5 text-sm font-medium transition-colors",
							isActive
								? "border border-border bg-card text-foreground"
								: "border border-transparent text-muted-foreground hover:text-foreground",
						)}
					>
						<Icon className="h-3.5 w-3.5" />
						{label}
					</button>
				);
			})}
		</div>
	);
}
