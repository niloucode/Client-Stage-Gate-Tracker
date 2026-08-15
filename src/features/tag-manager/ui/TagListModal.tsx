"use client";

import { useState, useMemo } from "react";
import type { Tag } from "@/entities/types";
import { Pencil, Trash2, LucideSearch } from "lucide-react";
import { TagBadge } from "@/entities/tag/ui/TagBadge";
import { Lacking } from "@/shared/ui/search-status";

const PINNED_TAGS = ["API", "Bugs", "Integration", "Production"] as const;

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

	// 1. Filter by search query, 2. Keep the 4 hardcoded tags at top, 3. Sort remainder alphabetically
	const displayedTags = useMemo(() => {
		const q = searchQuery.toLowerCase().trim();

		const matchesSearch = (tag: Tag) => {
			if (!q) return true;
			return (
				tag.name.toLowerCase().includes(q) ||
				(tag.description && tag.description.toLowerCase().includes(q))
			);
		};

		const pinned: Tag[] = [];
		const others: Tag[] = [];

		tags.forEach((tag) => {
			if (!matchesSearch(tag)) return;

			const isPinned = PINNED_TAGS.some(
				(p) => p.toLowerCase() === tag.name.toLowerCase(),
			);

			if (isPinned) {
				pinned.push(tag);
			} else {
				others.push(tag);
			}
		});

		// Sort pinned according to the PINNED_TAGS array order
		pinned.sort((a, b) => {
			const idxA = PINNED_TAGS.findIndex(
				(p) => p.toLowerCase() === a.name.toLowerCase(),
			);
			const idxB = PINNED_TAGS.findIndex(
				(p) => p.toLowerCase() === b.name.toLowerCase(),
			);
			return idxA - idxB;
		});

		// Sort all other tags alphabetically by name
		others.sort((a, b) =>
			a.name.localeCompare(b.name, undefined, { sensitivity: "base" }),
		);

		return [...pinned, ...others];
	}, [tags, searchQuery]);

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

									{/* Actions Column */}
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

											{/* SIR SKY I AM SO SORRY FOR THIS WARCRIME... DEADLINES WERE IMMINENT */}

											{!(tag.name === "API" ||
											tag.name === "Bugs" ||
											tag.name === "Integration" ||
											tag.name === "Production") ? (
												<button
													type="button"
													onClick={() => onRequestDeleteTag(tag)}
													title={`Delete ${tag.name}`}
													aria-label={`Delete ${tag.name}`}
													className="p-1.5 rounded-md text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 cursor-pointer"
												>
													<Trash2 size={15} />
												</button>
											) : (
												""
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