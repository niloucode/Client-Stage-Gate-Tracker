import { getPastelStyle } from "@/shared/lib/colors";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Tag } from "@/entities/types";

/**
 * Pastel tag pill. Built on the shadcn `Badge` (migration plan: replace
 * hand-rolled pill with Badge); the pastel background comes from the tag's
 * color via the shared palette, and the optional hover state turns the
 * badge into a remove affordance (name fades, ✕ appears).
 * @returns The rendered badge.
 */
export function TagBadge({
	tag,
	className = "",
	onClick,
	hover = false,
}: {
	tag: Tag;
	className?: string;
	onClick?: () => void;
	hover?: boolean;
}) {
	const { bg, text } = getPastelStyle(tag?.color ?? "#06B6D4");

	return (
		<Badge
			onClick={onClick}
			style={{ backgroundColor: bg }}
			className={cn(
				"rounded-full px-2.5 text-xs font-medium select-none transition-colors",
				hover && "cursor-pointer hover:bg-neutral-border!",
				className,
			)}
		>
			<span
				className={cn(hover && "group-hover/badge:hidden")}
				style={{ color: text }}
			>
				{tag.name}
			</span>
			{hover && (
				<span className="hidden group-hover/badge:inline font-bold text-background pointer-events-none">
					✕
				</span>
			)}
		</Badge>
	);
}
