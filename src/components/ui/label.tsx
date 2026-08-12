"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

function Label({
	className,
	required,
	error,
	children,
	...props
}: React.ComponentProps<"label"> & { required?: boolean; error?: boolean }) {
	return (
		<label
			data-slot="label"
			className={cn(
				"uppercase text-brand-900/90 flex items-center gap-0.5 mb-1 text-xs font-inter leading-none font-medium select-none group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50 peer-disabled:cursor-not-allowed peer-disabled:opacity-50",
				error && "text-destructive",
				className,
			)}
			{...props}
		>
			{children}
			{required && <span className="text-destructive"> *</span>}
		</label>
	);
}

export { Label };
