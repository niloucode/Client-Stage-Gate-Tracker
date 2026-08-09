"use client";

import { useFieldContext } from "../contexts";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
	fromDateTimeLocalInput,
	toDateTimeLocalInput,
} from "@/shared/lib/scheduling/dateInput";
import { firstFieldError } from "./TextField";

interface DateTimeFieldProps {
	label?: string;
	required?: boolean;
	className?: string;
}

/**
 * `datetime-local` input bound to a TanStack Form `Date | null` field.
 * All Date <-> input-string conversion goes through the shared scheduling
 * date adapter (`@/shared/lib/scheduling/dateInput`) — never inline
 * `getTimezoneOffset()` math in forms.
 */
export function DateTimeField({
	label,
	required,
	className,
}: DateTimeFieldProps) {
	const field = useFieldContext<Date | null>();
	const error = firstFieldError(field.state.meta.errors);

	return (
		<div className={cn("flex flex-col gap-1", className)}>
			{label && (
				<Label htmlFor={field.name} required={required} error={!!error}>
					{label}
				</Label>
			)}
			<Input
				id={field.name}
				name={field.name}
				type="datetime-local"
				value={toDateTimeLocalInput(field.state.value)}
				onChange={(e) =>
					field.handleChange(fromDateTimeLocalInput(e.target.value))
				}
				onBlur={field.handleBlur}
				aria-invalid={error ? true : undefined}
			/>
			{error && <p className="text-xs text-destructive">{error}</p>}
		</div>
	);
}
