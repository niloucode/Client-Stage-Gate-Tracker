"use client";

import { Check } from "lucide-react";
import { TAG_COLORS, TAG_COLOR_NAMES } from "@/shared/lib/colors";

/**
 * Color-swatch grid for choosing a tag color.
 * @returns The rendered component.
 */
export function ColorPicker({
	value,
	onChange,
}: {
	value: string;
	onChange: (c: string) => void;
}) {
	return (
		<div className="grid grid-cols-9 gap-1.5 w-full h-20 mt-2">
			{TAG_COLORS.map((color) => {
				const isSelected = value === color;
				return (
					<button
						key={color}
						onClick={() => onChange(color)}
						className="rounded-md transition-all border-2 min-h-8 flex justify-center items-center"
						style={{
							backgroundColor: color,
							boxShadow: isSelected
								? `0 0 0 2px var(--color-neutral-surface), 0 0 0 4px ${color}`
								: "none",
						}}
						aria-label={TAG_COLOR_NAMES[color] ?? color}
					>
						{isSelected && <Check color="var(--color-neutral-surface)" />}
					</button>
				);
			})}
		</div>
	);
}
