import { forwardRef, InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    error?: string | boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
    ({ className = "", error, ...props }, ref) => {
        const hasError = Boolean(error);
        const errorMessage = typeof error === "string" ? error : undefined;

        return (
            <div className="w-full">
                <input
                    ref={ref}
                    className={`w-full px-3.5 py-2.5 rounded-lg border bg-white text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:border-transparent transition-all ${
                        hasError 
                            ? "border-red-400 focus:ring-red-400" 
                            : "border-gray-300 focus:ring-indigo-500"
                    } ${className}`}
                    {...props}
                />
				<p className="text-xs h-1 text-red-500 mt-1">
					{errorMessage}
				</p>
            </div>
        );
    },
);

Input.displayName = "Input";