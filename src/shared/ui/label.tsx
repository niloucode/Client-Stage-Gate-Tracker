import { LabelHTMLAttributes } from "react";

interface LabelProps extends LabelHTMLAttributes<HTMLLabelElement> {
	required?: boolean;
	error?: boolean;
}

export function Label({
	className = "",
	required,
	error,
	children,
	...props
}: LabelProps) {
	return (
		<label
			className={`block text-sm font-medium text-gray-700 ${className}`}
			{...props}
		>
			{children}
			{required && (
				<span className={error ? "text-red-500" : "text-gray-400"}> *</span>
			)}
		</label>
	);
}
