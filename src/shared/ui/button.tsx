import { ButtonHTMLAttributes } from "react";

type ButtonVariant = "primary" | "ghost";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    "bg-brand-500 hover:bg-brand-600 active:bg-brand-900 text-neutral-surface font-medium focus-visible:ring-2 focus-visible:ring-brand-500/50",
  ghost:
    "bg-transparent text-brand-600 hover:bg-brand-25 hover:text-brand-900 active:bg-brand-200/50 focus-visible:ring-2 focus-visible:ring-brand-500/50",
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "min-w-[4rem] px-3 py-1.5 text-xs rounded-md",    // ~64px min-width
  md: "min-w-[6rem] px-4 py-2.5 text-sm rounded-lg",   // ~96px min-width
  lg: "min-w-[8rem] px-5 py-3 text-base rounded-xl",    // ~128px min-width
};

export function Button({
  variant = "primary",
  size = "md",
  className = "",
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center transition-colors focus:outline-none ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}