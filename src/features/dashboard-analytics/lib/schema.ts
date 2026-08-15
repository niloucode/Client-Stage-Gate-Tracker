import { z } from "zod";

/** Validates the Planned/Actual tab filter (Tabs onValueChange is a string). */
export const ganttTabSchema = z.enum(["planned", "actual"]);

/** Validates the Phases/Modules/Workflows sub-filter pill selection. */
export const ganttLevelSchema = z.enum(["phases", "modules", "workflows"]);

export type GanttTab = z.infer<typeof ganttTabSchema>;
export type GanttLevel = z.infer<typeof ganttLevelSchema>;
