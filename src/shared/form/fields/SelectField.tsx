"use client";

import { useFieldContext } from "../contexts";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { firstFieldError } from "./TextField";

export interface SelectOption {
	value: string;
	label: string;
}

interface SelectFieldProps {
	label?: string;
	required?: boolean;
	placeholder?: string;
	options: SelectOption[];
	className?: string;
}

/**
 * Shadcn Select bound to a TanStack Form string field.
 * Render inside `form.AppField` children.
 */
export function SelectField({
	label,
	required,
	placeholder = "Select…",
	options,
	className,
}: SelectFieldProps) {
	const field = useFieldContext<string>();
	const error = firstFieldError(field.state.meta.errors);

	return (
		<div className={cn("flex flex-col gap-1", className)}>
			{label && (
				<Label id={`${field.name}-label`} required={required} error={!!error}>
					{label}
				</Label>
			)}
			<Select
				value={field.state.value}
				onValueChange={(value) => field.handleChange(value ?? "")}
			>
				<SelectTrigger
					className={cn("w-full", error && "border-destructive")}
					aria-invalid={error ? true : undefined}
				>
					<SelectValue placeholder={placeholder} />
				</SelectTrigger>
				<SelectContent>
					{options.map((option) => (
						<SelectItem key={option.value} value={option.value}>
							{option.label}
						</SelectItem>
					))}
				</SelectContent>
			</Select>
			{error && <p className="text-xs text-destructive">{error}</p>}
		</div>
	);
}
