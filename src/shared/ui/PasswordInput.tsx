"use client";

import { useState, forwardRef, InputHTMLAttributes } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";

interface PasswordInputProps extends Omit<
	InputHTMLAttributes<HTMLInputElement>,
	"type"
> {}

export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
	({ className = "", ...props }, ref) => {
		const [show, setShow] = useState(false);

		return (
			<div className="relative">
				<Input
					ref={ref}
					type={show ? "text" : "password"}
					className={`pr-11 ${className}`}
					{...props}
				/>
				<button
					type="button"
					onClick={() => setShow((v) => !v)}
					className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
					aria-label={show ? "Hide password" : "Show password"}
				>
					{show ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
				</button>
			</div>
		);
	},
);

PasswordInput.displayName = "PasswordInput";
