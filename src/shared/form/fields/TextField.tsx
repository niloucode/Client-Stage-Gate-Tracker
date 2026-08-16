"use client";

import { useFieldContext } from "../contexts";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { formErrorToMessage } from "../errors";

/**
 * First error message from a TanStack Form field (string, issue object,
 * Error, ...). Delegates to `formErrorToMessage` so all field modules share
 * one normalization path.
 * @param errors - The field's error list (may be empty).
 * @returns The first error message, or undefined.
 */
export function firstFieldError(
	errors: readonly (string | { message?: string } | undefined)[],
): string | undefined {
	return formErrorToMessage(errors[0]) ?? undefined;
}

interface TextFieldProps {
	label?: string;
	required?: boolean;
	placeholder?: string;
	maxLength?: number;
	autoComplete?: string;
	className?: string;
	type?: string;
}

/**
 * Shadcn-bound text input wired to a TanStack Form field via
 * `useFieldContext`. Render inside `form.AppField` children.
 * @returns The rendered text input field.
 */
export function TextField({
	label,
	required,
	placeholder,
	maxLength,
	autoComplete,
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
				autoComplete={autoComplete}
				placeholder={placeholder}
				maxLength={maxLength}
				aria-invalid={error ? true : undefined}
			/>
			{error && <p className="text-xs text-destructive">{error}</p>}
		</div>
	);
}
