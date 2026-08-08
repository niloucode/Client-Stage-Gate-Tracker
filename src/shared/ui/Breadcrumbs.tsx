"use client"

import { ChevronRight } from "lucide-react"

export interface BreadcrumbItem {
	label: string
	href?: string
}

export function Breadcrumbs({ items }: { items: BreadcrumbItem[] }) {
	return (
		<nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm">
			{items.map((item, i) => {
				const isLast = i === items.length - 1
				return (
					<span key={i} className="flex items-center gap-1.5">
						{i > 0 && (
							<span className="text-gray-700" aria-hidden="true">
								<ChevronRight className="w-3 h-3" />
							</span>
						)}
						{item.href && !isLast ? (
							<a
								href={item.href}
								className="text-gray-700 hover:text-brand-500 transition-colors"
							>
								{item.label}
							</a>
						) : (
							<span
								className={
									isLast ? "text-brand-500" : "text-gray-700"
								}
							>
								{item.label}
							</span>
						)}
					</span>
				)
			})}
		</nav>
	)
}
