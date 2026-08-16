"use client";

import { useFieldContext } from "../contexts";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/shared/ui/password-input";
import { cn } from "@/lib/utils";
import { firstFieldError } from "./TextField";

interface PasswordFieldProps {
	label?: string;
	required?: boolean;
	placeholder?: string;
	autoComplete?: string;
	className?: string;
}

/**
 * PasswordInput (eye-toggle) bound to a TanStack Form string field.
 * Render inside `form.AppField` children.
 * @returns The rendered password field.
 */
export function PasswordField({
	label,
	required,
	placeholder,
	autoComplete,
	className,
}: PasswordFieldProps) {
	const field = useFieldContext<string>();
	const error = firstFieldError(field.state.meta.errors);

	return (
		<div className={cn("flex flex-col gap-1", className)}>
			{label && (
				<Label htmlFor={field.name} required={required} error={!!error}>
					{label}
				</Label>
			)}
			<PasswordInput
				id={field.name}
				name={field.name}
				value={field.state.value}
				onChange={(e) => field.handleChange(e.target.value)}
				onBlur={field.handleBlur}
				autoComplete={autoComplete}
				placeholder={placeholder}
				aria-invalid={error ? true : undefined}
			/>
			{error && <p className="text-xs text-destructive">{error}</p>}
		</div>
	);
}
