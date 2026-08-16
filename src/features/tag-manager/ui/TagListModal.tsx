"use client";

import { useState, useMemo } from "react";
import type { Tag } from "@/entities/types";
import { Pencil, Trash2, LucideSearch } from "lucide-react";
import { TagBadge } from "@/entities/tag";
import { Lacking } from "@/shared/ui/search-status";
import { matchesTagSearch, sortTagsForDisplay } from "../model/tagOrdering";

/**
 *
 * @returns The result.
 */
export default function TagListModal({
	tags,
	onEditTag,
	onRequestDeleteTag,
}: {
	tags: Tag[];
	onClose: () => void;
	onEditTag: (tag: Tag) => void;
	onRequestDeleteTag: (tag: Tag) => void;
}) {
	const [searchQuery, setSearchQuery] = useState("");

	// Filter by search, then sort: protected (system) tags first, then
	// alphabetical — protection comes from Tags.is_protected, never from
	// hardcoded names (2026-08-15 spec).
	const displayedTags = useMemo(
		() =>
			sortTagsForDisplay(
				tags.filter((tag) => matchesTagSearch(tag, searchQuery)),
			),
		[tags, searchQuery],
	);

	return (
		<div className="px-6 w-full flex flex-col gap-3">
			{/* Search / Filter Bar */}
			<div className="relative flex items-center w-full">
				<LucideSearch className="absolute left-3 w-4 h-4 text-slate-400 pointer-events-none" />
				<label htmlFor="tag-search" className="sr-only">
					Search tags
				</label>
				<input
					id="tag-search"
					type="text"
					value={searchQuery}
					onChange={(e) => setSearchQuery(e.target.value)}
					placeholder="Search tags by name or description..."
					className="w-full pl-9 pr-3 py-2 bg-neutral-surface border border-b border-brand-100 rounded text-sm text-foreground placeholder:text-brand-100 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all"
				/>
			</div>

			{/* Table Container */}
			<div className="w-full bg-neutral-surface overflow-x-auto rounded h-80 overflow-y-auto border border-brand-100">
				{displayedTags.length === 0 ? (
					<Lacking />
				) : (
					<table className="w-full border-collapse text-left">
						{/* Sticky Header */}
						<thead className="sticky top-0 z-10 bg-neutral-subtle border-b-2 border-brand-100 text-xs font-semibold text-neutral-border">
							<tr>
								<th scope="col" className="px-4 py-2.5 w-[30%]">
									NAME
								</th>
								<th scope="col" className="px-4 py-2.5 w-[55%]">
									DESCRIPTION
								</th>
								<th scope="col" className="px-4 py-2.5 w-[15%] text-right">
									<span className="sr-only">Actions</span>
								</th>
							</tr>
						</thead>

						{/* Table Body */}
						<tbody className="bg-neutral-surface">
							{displayedTags.map((tag) => (
								<tr
									key={tag.tag_id}
									className="transition-colors hover:bg-neutral-subtle/20 border-b border-brand-100/60"
								>
									{/* Tag Badge Column */}
									<td className="px-4 py-3 align-middle">
										<TagBadge tag={tag} />
									</td>

									{/* Description Column */}
									<td className="px-4 py-3 align-middle text-sm text-slate-600 whitespace-normal break-words">
										{tag.description || (
											<span className="text-xs text-slate-400 italic">
												No description
											</span>
										)}
									</td>

									{/* Actions Column — delete hidden for protected tags */}
									<td className="px-4 py-3 align-middle text-right">
										<div className="flex items-center justify-end gap-1">
											<button
												type="button"
												onClick={() => onEditTag(tag)}
												title={`Edit ${tag.name}`}
												aria-label={`Edit ${tag.name}`}
												className="p-1.5 rounded-md text-slate-400 hover:text-brand-600 hover:bg-brand-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 cursor-pointer"
											>
												<Pencil size={15} />
											</button>

											{tag.is_protected ? null : (
												<button
													type="button"
													onClick={() => onRequestDeleteTag(tag)}
													title={`Delete ${tag.name}`}
													aria-label={`Delete ${tag.name}`}
													className="p-1.5 rounded-md text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 cursor-pointer"
												>
													<Trash2 size={15} />
												</button>
											)}
										</div>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				)}
			</div>
		</div>
	);
}
