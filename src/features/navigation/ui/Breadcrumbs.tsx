"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";

export interface BreadcrumbItem {
	label: string;
	href?: string;
}

/**
 * Truncates string after `maxLength` characters with an ellipsis.
 */
function truncateLabel(text: string, maxLength = 20): string {
	if (!text) return "";
	return text.length > maxLength ? `${text.slice(0, maxLength)}…` : text;
}

export function Breadcrumbs({ items }: { items: BreadcrumbItem[] }) {
	return (
		<nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs! min-w-0 flex-wrap">
			{items.map((item, i) => {
				const isLast = i === items.length - 1;
				const displayLabel = truncateLabel(item.label, 20);

				return (
					<span key={i} className="flex items-center gap-1.5 min-w-0 max-w-full">
						{i > 0 && (
							<span className="text-gray-400 shrink-0" aria-hidden="true">
								<ChevronRight className="w-3 h-3" />
							</span>
						)}
						{item.href && !isLast ? (
							<Link href={item.href} title={item.label} className="min-w-0">
								<h4 className="text-sm! line-clamp-1 truncate font-normal text-gray-700! hover:text-brand-500! transition-colors!">
									{displayLabel}
								</h4>
							</Link>
						) : (
							<h4
								title={item.label}
								className={`text-sm! line-clamp-1 truncate font-normal ${
									isLast ? "text-brand-500!" : "text-gray-700!"
								}`}
							>
								{displayLabel}
							</h4>
						)}
					</span>
				);
			})}
		</nav>
	);
}