import { z } from "zod";

/** Validates the Planned/Actual tab filter (e.g. if it's ever lifted into the URL). */
export const ganttTabSchema = z.enum(["planned", "actual"]);

/** Validates the Phases/Modules/Workflows sub-filter pill selection. */
export const ganttLevelSchema = z.enum(["phases", "modules", "workflows"]);

export type GanttTabInput = z.infer<typeof ganttTabSchema>;
export type GanttLevelInput = z.infer<typeof ganttLevelSchema>;
