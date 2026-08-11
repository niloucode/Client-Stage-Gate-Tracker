import { z } from "zod";
import { hasValidActualRange, hasValidPlannedRange } from "./chronology";

/** Normalize the schema's undefined-laden shape to the canonical vocabulary. */
export function toSchedulingDates(d: {
	planStart?: Date | null;
	planEnd?: Date | null;
	actualStart?: Date | null;
	actualEnd?: Date | null;
}): SchedulingDates {
	return {
		planStart: d.planStart ?? null,
		planEnd: d.planEnd ?? null,
		actualStart: d.actualStart ?? null,
		actualEnd: d.actualEnd ?? null,
	};
}

/**
 * Canonical scheduling vocabulary (Task 1.5).
 *
 * One set of names for the four project dates everywhere in TypeScript
 * domain types and UI forms:
 *   - planStart    → Prisma `plan_start_at`
 *   - planEnd      → Prisma `plan_end_at`
 *   - actualStart  → Prisma `actual_start_at`
 *   - actualEnd    → Prisma `actual_end_at`
 *
 * Translation to Prisma column names happens ONLY inside explicit
 * server-side mappers (entity actions). Never use `start_date` /
 * `deadline_date` / `finish_date` / `actl_*` in new domain or UI code.
 */
export interface SchedulingDates {
	planStart: Date | null;
	planEnd: Date | null;
	actualStart: Date | null;
	actualEnd: Date | null;
}

export const schedulingDatesSchema = z
	.object({
		planStart: z.date().nullable().optional(),
		planEnd: z.date().nullable().optional(),
		actualStart: z.date().nullable().optional(),
		actualEnd: z.date().nullable().optional(),
	})
	.refine((d) => hasValidPlannedRange(toSchedulingDates(d)), {
		message: "Plan Start must be before or equal to Plan End",
		path: ["planStart"],
	})
	.refine((d) => hasValidActualRange(toSchedulingDates(d)), {
		message: "Actual Start must be before or equal to Actual End",
		path: ["actualStart"],
	});

export type SchedulingDatesInput = z.input<typeof schedulingDatesSchema>;
export type SchedulingDatesOutput = z.output<typeof schedulingDatesSchema>;
