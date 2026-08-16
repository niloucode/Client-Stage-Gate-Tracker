import { Button as ButtonPrimitive } from "@base-ui/react/button";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
	"group/button inline-flex shrink-0 items-center justify-center rounded-sm font-sans font-medium whitespace-nowrap transition-all duration-150 ease-in-out outline-none select-none tracking-[0.02em] cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 [&_.arrow]:inline-block [&_.arrow]:transition-transform [&_.arrow]:duration-200 group-hover/button:[&_.arrow]:translate-x-0.5",
	{
		variants: {
			variant: {
				/* Voltage Purple — Default Primary Brand CTA */
				default:
					"bg-primary text-primary-foreground hover:bg-brand-600 shadow-xs",

				/* Explicit Voltage Purple variant */
				purple: "bg-brand-500 text-white hover:bg-brand-600 shadow-xs",

				/* Lime Signal — Primary High-Impact CTA */
				lime: "bg-lime-300 text-neutral-950 hover:bg-lime-200 shadow-xs font-semibold",

				/* Outline Bordered Variant */
				outline:
					"border border-border bg-background text-foreground hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground dark:border-input dark:bg-input/30 dark:hover:bg-input/50",

				/* Secondary Neutral Surface Variant */
				secondary:
					"bg-neutral-surface text-foreground font-normal border border-gray-200 hover:bg-neutral-subtle",

				/* Ghost / Subtle Variant */
				ghost:
					"bg-transparent text-foreground border border-transparent hover:border-brand-100 hover:bg-muted hover:text-brand-600 aria-expanded:bg-muted aria-expanded:text-foreground",

				/* Asceoft Nav Uppercase Mono Variant */
				nav: "bg-transparent text-primary border border-primary font-mono text-[11px] uppercase tracking-[0.12em] hover:bg-primary hover:text-primary-foreground",

				/* Destructive / Warning Variants */
				destructive:
					"bg-destructive/10 text-destructive hover:bg-destructive/20 focus-visible:border-destructive/40 focus-visible:ring-destructive/20 dark:bg-destructive/20 dark:hover:bg-destructive/30 dark:focus-visible:ring-destructive/40",
				danger:
					"bg-danger text-danger-foreground hover:bg-red-600 focus-visible:border-red-600/40 focus-visible:ring-red-600/20",

				/* Minimal Text Link */
				link: "text-primary underline-offset-4 hover:underline p-0 h-auto",
			},
			size: {
				default:
					"h-9 gap-2 px-3.5 text-xs sm:text-sm has-data-[icon=inline-end]:pr-2.5 has-data-[icon=inline-start]:pl-2.5",
				xs: "h-6 gap-1 rounded-xs px-2 text-xs in-data-[slot=button-group]:rounded-sm has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3",
				sm: "h-7 gap-1.5 rounded-xs px-2.5 text-xs in-data-[slot=button-group]:rounded-sm has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3.5",
				lg: "h-11 gap-2.5 px-6 text-sm sm:text-base has-data-[icon=inline-end]:pr-4 has-data-[icon=inline-start]:pl-4",
				icon: "size-8 p-0",
				"icon-xs":
					"size-6 rounded-xs p-0 in-data-[slot=button-group]:rounded-sm [&_svg:not([class*='size-'])]:size-3",
				"icon-sm":
					"size-7 rounded-xs p-0 in-data-[slot=button-group]:rounded-sm [&_svg:not([class*='size-'])]:size-3.5",
				"icon-lg": "size-9 p-0",
			},
		},
		defaultVariants: {
			variant: "default",
			size: "default",
		},
	},
);

function Button({
	className,
	variant = "default",
	size = "default",
	...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
	return (
		<ButtonPrimitive
			data-slot="button"
			className={cn(buttonVariants({ variant, size, className }))}
			{...props}
		/>
	);
}

export { Button, buttonVariants };
