"use client";

import { Check } from "lucide-react";
import { TAG_COLORS, TAG_COLOR_NAMES } from "@/shared/lib/colors";

export function CloseButton({ onClick }: { onClick: () => void }) {
	return (
		<button
			onClick={onClick}
			className="text-gray-400 hover:text-gray-600 transition-colors"
			aria-label="Close"
		>
			<svg
				width="16"
				height="16"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				strokeWidth={2.5}
				strokeLinecap="round">
				<line x1="18" y1="6" x2="6" y2="18" />
				<line x1="6" y1="6" x2="18" y2="18" />
			</svg>
		</button>
	)
}

// ── Color picker ──────────────────────────────────────────────────────────────

export function ColorPicker({
	value,
	onChange,
}: {
	value: string
	onChange: (c: string) => void
}) {
	return (
		<div className="grid grid-cols-9 gap-1.5 w-full h-[5rem] mt-2">
			{TAG_COLORS.map((color) => {
				const isSelected = value === color
				return (
					<button
						key={color}
						onClick={() => onChange(color)}
						className="rounded-md transition-all border-2 min-h-[2rem] flex justify-center items-center"
						style={{
							backgroundColor: color,
							boxShadow: isSelected ? `0 0 0 2px neutral-surface, 0 0 0 4px ${color}` : "none",
						}}
						aria-label={TAG_COLOR_NAMES[color] ?? color}
					>
						{isSelected && (
							<Check color={"background"}></Check>
						)}
					</button>
				)
			})}
		</div>
	)
}

// ── Modal backdrop ────────────────────────────────────────────────────────────

export function Backdrop({ onClick }: { onClick: () => void }) {
	return <div className="fixed inset-0 bg-foreground/40 z-40" onClick={onClick} />
}
