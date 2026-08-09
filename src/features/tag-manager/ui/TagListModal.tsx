import type { Tag } from "@/entities/types"
import { Pencil, Trash2 } from "lucide-react"
import { TagBadge } from "@/entities/tag/ui/TagBadge"

export default function TagListModal({
	tags,
	onClose,
	onEditTag,
	onRequestDeleteTag,
}: {
	tags: Tag[]
	onClose: () => void
	onEditTag: (tag: Tag) => void
	onRequestDeleteTag: (tag: Tag) => void
}) {
	return (
		<div className="flex flex-col px-6 items-center ">
			{/* Header */}
					{/* Table Body Area */}
					<div className="overflow-hidden flex flex-col">
						{/* Purple-tinted header — sticky, sits above the scroll area */}
						<table className="w-full table-fixed mt-4">
							<colgroup>
								<col style={{ width: "28%" }} />
								<col style={{ width: "48%" }} />
								<col style={{ width: "24%" }} />
							</colgroup>
							<thead>
								<tr
									className="text-xs font-semibold tracking-wider bg-neutral-subtle text-foreground"
								>
									<th className="text-left py-2.5 px-3">NAME</th>
									<th className="text-left py-2.5 px-3">DESCRIPTION</th>
									<th className="text-left py-2.5 px-3"></th>
								</tr>
							</thead>
						</table>

						{/* Scrollable rows */}
						<div className="tag-scroll overflow-y-auto">
							<style>{`
                                .tag-scroll::-webkit-scrollbar { width: 5px }
                                .tag-scroll::-webkit-scrollbar-track { background: #F5F3FF border-radius: 99px }
                                .tag-scroll::-webkit-scrollbar-thumb { background: #C7D2FE border-radius: 99px }
                                .tag-scroll::-webkit-scrollbar-thumb:hover { background: #A5B4FC }
                            `}</style>
							<table className="w-full table-fixed">
								<colgroup>
									<col style={{ width: "28%" }} />
									<col style={{ width: "48%" }} />
									<col style={{ width: "24%" }} />
								</colgroup>
								<tbody className="divide-y divide-gray-200">
									{tags.length === 0 && (
										<tr>
											<td colSpan={3} className="py-8 text-left text-sm text-gray-400">
												No tags yet. Create one to get started.
											</td>
										</tr>
									)}
									{tags.map((tag) => (
										<tr
											key={tag.tag_id}
											className="group hover:bg-indigo-50/50 transition-colors"
										>
											<td className="py-3 px-3 align-middle text-left">
												<TagBadge tag={tag} />
											</td>
											<td
												className="py-3 px-3 text-sm text-gray-500 text-left align-middle neutral-surfacespace-normal break-words"
											>
												{tag.description}
											</td>
											<td className="py-3 px-3 align-middle">
												<div className="flex items-center justify-end gap-2">
													<button
														onClick={() => onEditTag(tag)}
														className="text-indigo-400 hover:text-brand-600 transition-colors"
														aria-label="Edit tag"
													>
														<Pencil size={14} />
													</button>
													<button
														onClick={() => onRequestDeleteTag(tag)}
														className="text-red-400 hover:text-red-600 transition-colors"
														aria-label="Delete tag"
													>
														<Trash2 size={14} />
													</button>
												</div>
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					</div>

					{/* Footer Divider */}
					<div className="h-px bg-gray-100 shrink-0" />
		</div>
	)
}
