import { ButtonHTMLAttributes } from 'react'

type ButtonVariant = 'primary' | 'ghost'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    'bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-medium',
  ghost:
    'bg-transparent text-indigo-600 hover:text-indigo-500',
}

export function Button({
  variant = 'primary',
  className = '',
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`w-full py-2.5 px-4 rounded-lg text-sm transition-colors ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}
