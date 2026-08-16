import { Ban } from "lucide-react";
import type { GanttLevel } from "../types";

const LEVEL_LABEL: Record<GanttLevel, string> = {
	phases: "Phases",
	modules: "Modules",
	workflows: "Workflows",
};

/** Empty-state panel shown when a level has no rows. */
export function EmptyGanttState({ level }: { level: GanttLevel }) {
	return (
		<div className="flex flex-1 flex-col items-center justify-center gap-3 py-20 text-center">
			<Ban className="h-10 w-10 text-muted-foreground" strokeWidth={1.5} />
			<h4>Nothing to show yet</h4>
			<p className="max-w-xs text-sm text-muted-foreground">
				Add {LEVEL_LABEL[level]} to this project to see its timeline here.
			</p>
		</div>
	);
}
