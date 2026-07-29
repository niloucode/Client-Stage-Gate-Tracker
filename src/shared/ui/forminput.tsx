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
  | {
      variant: "select";
      options: SelectOption[];
      isOpen: boolean;
      onToggleOpen: () => void;
      onSelect: (value: any) => void;
      placeholder?: string;
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
        {maxLength !== undefined && (
          <span className="ml-auto text-[10px] text-muted-foreground">
            {stringValue.length}/{maxLength}
          </span>
        )}
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

      {/* Variant 2: Custom Dropdown */}
      {props.variant === "select" && (
        <>
          <button
            type="button"
            onClick={props.onToggleOpen}
            className={`cursor-pointer w-full flex items-center justify-between px-3.5 py-2.5 bg-neutral-surface border rounded-lg text-sm text-[#0F172A] focus:outline-none focus:ring-2 focus:border-transparent transition-all mt-1 ${
              hasError
                ? "border-red-400 focus:ring-red-400"
                : "border-gray-300 focus:ring-brand-500"
            }`}
          >
            <span className={value ? "" : "text-[#94A3B8]"}>
              {value
                ? props.options.find((opt) => opt.value === value)?.label ?? (props.placeholder ?? "Select...")
                : (props.placeholder ?? "Select...")}
            </span>
            <svg
              width="12"
              height="12"
              viewBox="0 0 12 12"
              fill="none"
              className={`transform transition-transform ${props.isOpen ? "rotate-180" : ""}`}
            >
              <path d="M3 4.5L6 7.5L9 4.5" stroke="#64748B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>

          {props.isOpen && (
            <div className="absolute z-10 mt-1 w-full bg-neutral-surface border border-gray-200 rounded-lg shadow-lg overflow-hidden max-h-48 overflow-y-auto">
              {props.options.map((opt, idx) => (
                <div
                  key={opt.value?.toString() ?? idx}
                  onClick={() => {
                    props.onSelect(opt.value);
                    if (hasError && onClearError) onClearError();
                    props.onToggleOpen();
                  }}
                  className={`px-3.5 py-2.5 text-sm cursor-pointer hover:bg-gray-50 ${
                    opt.value === null ? "text-[#94A3B8]" : ""
                  } ${
                    value === opt.value
                      ? "bg-indigo-50 text-indigo-700 font-medium"
                      : "text-[#0F172A]"
                  }`}
                >
                  {opt.label}
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Variant 3: Base Input / Datepicker (Default) */}
      {(!props.variant || props.variant === "input" || props.variant === "datetime-local") && (
        <Input
          type={props.type ?? "text"}
          value={stringValue}
          maxLength={maxLength}
          placeholder={props.placeholder}
          onChange={(e) => handleValueChange(e, props.onChange)}
          className="mt-1"
        />
      )}

      {/* Error Message Slot */}
      <div className="mt-1 h-1">
        {typeof error === "string" && (
          <p className="text-xs text-destructive">{error}</p>
        )}
      </div>
    </div>
  );
};