"use client";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ganttTabSchema } from "../lib/schema";
import type { GanttTab } from "../types";

const TAB_LABEL: Record<GanttTab, string> = {
	planned: "Planned Gantt",
	actual: "Actual Gantt",
};

/** Planned/Actual tab switcher for the gantt. */
export function GanttTabs({
	value,
	onValueChange,
}: {
	value: GanttTab;
	onValueChange: (tab: GanttTab) => void;
}) {
	return (
		<Tabs
			value={value}
			onValueChange={(next) => {
				const parsed = ganttTabSchema.safeParse(next);
				if (parsed.success) onValueChange(parsed.data);
			}}
		>
			<TabsList variant="line" className="h-auto gap-6 p-0">
				{(Object.keys(TAB_LABEL) as GanttTab[]).map((tab) => {
					const isActive = tab === value;
					return (
						<TabsTrigger
							key={tab}
							value={tab}
							className="relative h-auto flex-none rounded-none px-0.5 py-2 text-sm font-medium after:hidden"
							style={{
								color: isActive ? "var(--primary)" : "var(--muted-foreground)",
							}}
						>
							{TAB_LABEL[tab]}
							{/*
							 * A real element instead of the library's after: pseudo class:
							 * this project's Tailwind build isn't reliably compiling
							 * data-active/aria-selected-scoped utilities, so the
							 * underline's visibility is driven directly by component
							 * state instead.
							 */}
							<span
								aria-hidden
								className="absolute inset-x-0 -bottom-1.25 h-0.5"
								style={{
									backgroundColor: isActive ? "var(--primary)" : "transparent",
								}}
							/>
						</TabsTrigger>
					);
				})}
			</TabsList>
		</Tabs>
	);
}
