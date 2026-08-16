import React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

// 1. Shared Layout Props
interface BaseFormFieldProps {
	label: string;
	required?: boolean;
	error?: string | boolean;
	maxLength?: number;
	value?: string | number | null;
	containerClassName?: string;
	onClearError?: () => void;
}

// 2. Select Option Type
export interface SelectOption {
	label: string;
	value: string | number | null;
}

// Helper to auto-format TIN (12 digits -> XXX-XXX-XXX-XXX)
const formatTIN = (val: string): string => {
	const digits = val.replace(/\D/g, "").slice(0, 12);
	const parts = digits.match(/.{1,3}/g);
	return parts ? parts.join("-") : "";
};

// Helper to normalize phone numbers (Remove leading 0's)
const normalizePhone = (val: string): string => {
	return val.replace(/^0+/, "");
};

// 3. Variant Specific Props (Discriminated Union)
type FormInputProps = BaseFormFieldProps &
	(
		| {
				variant?: "input" | "datetime-local";
				type?:
					| "text"
					| "tin"
					| "password"
					| "email"
					| "number"
					| "tel"
					| (string & {});
				placeholder?: string;
				onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
		  }
		| {
				variant: "textarea";
				rows?: number;
				placeholder?: string;
				onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
		  }
	);

export const FormInput: React.FC<FormInputProps> = (props) => {
	const {
		label,
		required,
		error,
		maxLength,
		value,
		containerClassName = "",
		onClearError,
	} = props;

	const hasError = !!error;
	const isTin = props.variant !== "textarea" && props.type === "tin";
	const isTel = props.variant !== "textarea" && props.type === "tel";

	// Derive values for TIN type vs Tel type vs standard types
	const stringValue = value?.toString() ?? "";
	const displayValue = isTel
		? normalizePhone(stringValue)
		: isTin
			? formatTIN(stringValue)
			: stringValue;

	const effectiveMaxLength = maxLength ?? (isTin ? 15 : undefined);
	const effectivePlaceholder =
		props.placeholder ?? (isTin ? "855-036-067-089" : undefined);

	// Helper to trigger clear error callback on change
	const handleValueChange = <T extends HTMLInputElement | HTMLTextAreaElement>(
		e: React.ChangeEvent<T>,
		originalOnChange?: (e: React.ChangeEvent<T>) => void,
	) => {
		// If TIN type, format target value before passing event up
		if (isTin) {
			e.target.value = formatTIN(e.target.value);
		}

		// If Tel/Phone type, strip any leading zeros
		if (isTel) {
			e.target.value = normalizePhone(e.target.value);
		}

		if (originalOnChange) originalOnChange(e);
		if (hasError && onClearError) onClearError();
	};

	return (
		<div className={cn("relative", containerClassName)}>
			{/* Label Row */}
			<div className="flex">
				<Label required={required} error={hasError}>
					{label}
				</Label>
				<div className="ml-auto flex items-center">
					{typeof error === "string" && (
						<div className="text-xs text-destructive">{error}</div>
					)}
					{maxLength !== undefined && (
						<span className="ml-2 text-[10px] text-muted-foreground">
							{displayValue.length}/{maxLength}
						</span>
					)}
				</div>
			</div>

			{props.variant === "textarea" && (
				<Textarea
					value={displayValue}
					maxLength={maxLength}
					rows={props.rows ?? 4}
					placeholder={props.placeholder}
					aria-invalid={hasError}
					onChange={(e) => handleValueChange(e, props.onChange)}
					className={cn(
						"placeholder-gray-400 rounded-sm mt-1 bg-neutral-surface resize-none",
						hasError
							? "border-destructive ring-1 ring-destructive/20"
							: "border-gray-200 focus:ring-brand-500",
					)}
				/>
			)}

			{/* Variant 2: Base Input / Datepicker (Default) */}
			{(!props.variant ||
				props.variant === "input" ||
				props.variant === "datetime-local") && (
				<Input
					type={isTin ? "text" : (props.type ?? "text")}
					value={displayValue}
					maxLength={effectiveMaxLength}
					placeholder={effectivePlaceholder}
					aria-invalid={hasError}
					onChange={(e) => handleValueChange(e, props.onChange)}
					className={cn(
						"rounded-sm mt-1 bg-neutral-surface",
						hasError
							? "border-destructive ring-1 ring-destructive/20"
							: "border-gray-200 focus:ring-brand-500",
					)}
				/>
			)}
		</div>
	);
};
