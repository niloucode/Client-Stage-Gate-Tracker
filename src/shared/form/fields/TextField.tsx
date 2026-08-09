"use client";

import { useFieldContext } from "../contexts";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

/** First error message from a TanStack Form field (string or issue object). */
export function firstFieldError(
	errors: readonly (string | { message?: string } | undefined)[],
): string | undefined {
	const err = errors[0];
	if (typeof err === "string") return err;
	return err?.message;
}

interface TextFieldProps {
	label?: string;
	required?: boolean;
	placeholder?: string;
	maxLength?: number;
	className?: string;
	type?: string;
}

/**
 * Shadcn-bound text input wired to a TanStack Form field via
 * `useFieldContext`. Render inside `form.AppField` children.
 */
export function TextField({
	label,
	required,
	placeholder,
	maxLength,
	className,
	type = "text",
}: TextFieldProps) {
	const field = useFieldContext<string>();
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
				type={type}
				value={field.state.value}
				onChange={(e) => field.handleChange(e.target.value)}
				onBlur={field.handleBlur}
				placeholder={placeholder}
				maxLength={maxLength}
				aria-invalid={error ? true : undefined}
			/>
			{error && <p className="text-xs text-destructive">{error}</p>}
		</div>
	);
}
