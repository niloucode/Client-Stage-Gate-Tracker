import React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

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
		props.placeholder ?? (isTin ? "123-456-789-123" : undefined);

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
		<div className={`relative ${containerClassName}`}>
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

			{/* Variant 1: Textarea */}
			{props.variant === "textarea" && (
				<textarea
					value={displayValue}
					maxLength={maxLength}
					rows={props.rows ?? 4}
					placeholder={props.placeholder}
					onChange={(e) => handleValueChange(e, props.onChange)}
					className={`mt-1 w-full rounded-lg border bg-neutral-surface px-3.5 py-2.5 text-sm text-[#0F172A] resize-none transition-all focus:outline-none focus:ring-2 focus:border-transparent ${
						hasError
							? "border-red-400 focus:ring-red-400"
							: "border-gray-300 focus:ring-brand-500"
					}`}
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
					onChange={(e) => handleValueChange(e, props.onChange)}
					className={`mt-1 bg-neutral-surface ${
						hasError
							? "border-red-400 focus:ring-red-400"
							: "border-gray-300 focus:ring-brand-500"
					}`}
				/>
			)}
		</div>
	);
};
