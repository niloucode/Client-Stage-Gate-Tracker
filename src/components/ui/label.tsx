"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

function Label({
	className,
	required,
	error: _error,
	children,
	...props
}: React.ComponentProps<"label"> & { required?: boolean; error?: boolean }) {
  return (
    <label
      data-slot="label"
      className={cn(
        "flex items-center gap-0.5 mb-1 text-sm leading-none font-medium select-none group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50 peer-disabled:cursor-not-allowed peer-disabled:opacity-50",
        className
      )}
      {...props}
    >
		{children}
		{required && <span className="text-destructive"> *</span>}
	</label>
  )
}

export { Label }
