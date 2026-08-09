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

// 3. Variant Specific Props (Discriminated Union)
type FormInputProps = BaseFormFieldProps & (
  | {
      variant?: "input" | "datetime-local";
      type?: string;
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
  const stringValue = value?.toString() ?? "";

  // Helper to trigger clear error callback on change
  const handleValueChange = (e: React.ChangeEvent<any>, originalOnChange?: (e: any) => void) => {
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
					{stringValue.length}/{maxLength}
				</span>
			)}
		</div>
      </div>

      {/* Variant 1: Textarea */}
      {props.variant === "textarea" && (
        <textarea
          value={stringValue}
          maxLength={maxLength}
          rows={props.rows ?? 4}
          placeholder={props.placeholder}
          onChange={(e) => handleValueChange(e, props.onChange)}
          className={`w-full mt-1 px-3.5 py-2.5 bg-neutral-surface border rounded-lg text-sm text-[#0F172A] resize-none focus:outline-none focus:ring-2 focus:border-transparent transition-all ${
            hasError
              ? "border-red-400 focus:ring-red-400"
              : "border-gray-300 focus:ring-brand-500"
          }`}
        />
      )}

      {/* Variant 2: Base Input / Datepicker (Default) */}
      {(!props.variant || props.variant === "input" || props.variant === "datetime-local") && (
        <Input
          type={props.type ?? "text"}
          value={stringValue}
          maxLength={maxLength}
          placeholder={props.placeholder}
          onChange={(e) => handleValueChange(e, props.onChange)}
          className={`mt-1 bg-neutral-surface ${hasError
              ? "border-red-400 focus:ring-red-400"
              : "border-gray-300 focus:ring-brand-500"}`}
        />
      )}
    </div>
  );
};