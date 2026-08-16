"use client";

import { useFieldContext } from "../contexts";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { firstFieldError } from "./TextField";

interface TextAreaFieldProps {
	label?: string;
	required?: boolean;
	placeholder?: string;
	rows?: number;
	maxLength?: number;
	className?: string;
}

/** Shadcn-bound textarea wired to a TanStack Form field. 
 * @returns The rendered textarea field.
 */
export function TextAreaField({
	label,
	required,
	placeholder,
	rows,
	maxLength,
	className,
}: TextAreaFieldProps) {
	const field = useFieldContext<string>();
	const error = firstFieldError(field.state.meta.errors);

	return (
		<div className={cn("flex flex-col gap-1", className)}>
			{label && (
				<Label htmlFor={field.name} required={required} error={!!error}>
					{label}
				</Label>
			)}
			<Textarea
				id={field.name}
				name={field.name}
				value={field.state.value}
				onChange={(e) => field.handleChange(e.target.value)}
				onBlur={field.handleBlur}
				placeholder={placeholder}
				rows={rows}
				maxLength={maxLength}
				aria-invalid={error ? true : undefined}
			/>
			{error && <p className="text-xs text-destructive">{error}</p>}
		</div>
	);
}
