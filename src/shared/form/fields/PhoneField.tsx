"use client";

import { useFieldContext } from "../contexts";
import { Label } from "@/components/ui/label";
import { PhoneInput } from "@/components/ui/phone-input";
import { cn } from "@/lib/utils";
import { firstFieldError } from "./TextField";

interface PhoneFieldProps {
	label?: string;
	required?: boolean;
	placeholder?: string;
	className?: string;
}

/** PhoneInput bound to a TanStack Form string field. */
export function PhoneField({
	label,
	required,
	placeholder,
	className,
}: PhoneFieldProps) {
	const field = useFieldContext<string>();
	const error = firstFieldError(field.state.meta.errors);

	return (
		<div className={cn("flex flex-col gap-1", className)}>
			{label && (
				<Label htmlFor={field.name} required={required} error={!!error}>
					{label}
				</Label>
			)}
			<PhoneInput
				id={field.name}
				name={field.name}
				value={field.state.value}
				onChange={(value) => field.handleChange(value ?? "")}
				aria-invalid={error ? true : undefined}
				placeholder={placeholder}
			/>
			{error && <p className="text-xs text-destructive">{error}</p>}
		</div>
	);
}
