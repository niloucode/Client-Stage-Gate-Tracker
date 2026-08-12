"use client";

import type { AppForm } from "./useAppForm";
import { cn } from "@/lib/utils";

interface SchedulingFieldNames {
	planStart?: string;
	planEnd?: string;
	actualStart?: string;
	actualEnd?: string;
}

interface SchedulingFieldsProps {
	/** The form instance from `useAppForm`. */
	form: AppForm;
	/** Field names in the form values; defaults to the canonical vocabulary. */
	names?: SchedulingFieldNames;
	/** Hide the actual (execution) date fields. */
	showActuals?: boolean;
	className?: string;
}

/**
 * Reusable scheduling block rendering Plan Start / Plan End and (optionally)
 * Actual Start / Actual End as `DateTimeField`s.
 *
 * Uses the canonical scheduling vocabulary (`planStart`, `planEnd`,
 * `actualStart`, `actualEnd`) — translate to Prisma column names only in
 * server-side mappers. Override `names` when a form stores dates under
 * different keys.
 */
export function SchedulingFields({
	form,
	names = {},
	showActuals = true,
	className,
}: SchedulingFieldsProps) {
	const planStart = names.planStart ?? "planStart";
	const planEnd = names.planEnd ?? "planEnd";
	const actualStart = names.actualStart ?? "actualStart";
	const actualEnd = names.actualEnd ?? "actualEnd";

	return (
		<div className={cn("grid grid-cols-1 gap-3 sm:grid-cols-2", className)}>
			<form.AppField name={planStart}>
				{(field) => <field.DateTimeField label="Plan Start" />}
			</form.AppField>
			<form.AppField name={planEnd}>
				{(field) => <field.DateTimeField label="Plan End" />}
			</form.AppField>
			{showActuals && (
				<>
					<form.AppField name={actualStart}>
						{(field) => <field.DateTimeField label="Actual Start" />}
					</form.AppField>
					<form.AppField name={actualEnd}>
						{(field) => <field.DateTimeField label="Actual End" />}
					</form.AppField>
				</>
			)}
		</div>
	);
}
