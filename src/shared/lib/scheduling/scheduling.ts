import { z } from "zod";

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
	.refine(
		(d) =>
			!d.planStart ||
			!d.planEnd ||
			d.planStart.getTime() <= d.planEnd.getTime(),
		{
			message: "Plan Start must be before or equal to Plan End",
			path: ["planStart"],
		},
	)
	.refine(
		(d) =>
			!d.actualStart ||
			!d.actualEnd ||
			d.actualStart.getTime() <= d.actualEnd.getTime(),
		{
			message: "Actual Start must be before or equal to Actual End",
			path: ["actualStart"],
		},
	);

export type SchedulingDatesInput = z.input<typeof schedulingDatesSchema>;
export type SchedulingDatesOutput = z.output<typeof schedulingDatesSchema>;
