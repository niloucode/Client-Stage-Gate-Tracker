import {Tag} from "@/components/tickets/types";
import {Backdrop, CloseButton, TagBadge} from "@/components/tag/TagModals";

export default function TagListModal({ tags, onClose, onCreateTag, onEditTag, onDeleteTag }: {
    tags: Tag[];
    onClose: () => void;
    onCreateTag: () => void;
    onEditTag: (tag: Tag) => void;
    onDeleteTag: (tag_id: string) => void;
}) {
    return (
        <>
            <Backdrop onClick={onClose} />
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-xl shadow-2xl w-full max-w-xl min-h-[65vh] max-h-[65vh] flex flex-col overflow-hidden">
                    {/* Header */}
                    <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                        <h2 className="text-base font-semibold text-gray-900">Tags</h2>
                        <CloseButton onClick={onClose} />
                    </div>

                    {/* Table Body Area */}
                    <div className="flex-1 overflow-y-auto px-6 flex flex-col">
                        {/* Purple-tinted header — sticky, sits above the scroll area */}
                        <table className="w-full table-fixed">
                            <colgroup>
                                <col style={{ width: "28%" }} />
                                <col style={{ width: "48%" }} />
                                <col style={{ width: "24%" }} />
                            </colgroup>
                            <thead>
                            <tr
                                className="text-xs font-semibold uppercase tracking-wider"
                                style={{ backgroundColor: "#EEF2FF", color: "#6366F1" }}
                            >
                                <th className="text-center py-2.5 px-3 rounded-l-lg">Tag</th>
                                <th className="text-center py-2.5 px-3">Description</th>
                                <th className="text-center py-2.5 px-3 rounded-r-lg">Actions</th>
                            </tr>
                            </thead>
                        </table>

                        {/* Scrollable rows */}
                        <div className="tag-scroll flex-1 overflow-y-auto">
                            <style>{`
                                .tag-scroll::-webkit-scrollbar { width: 5px; }
                                .tag-scroll::-webkit-scrollbar-track { background: #F5F3FF; border-radius: 99px; }
                                .tag-scroll::-webkit-scrollbar-thumb { background: #C7D2FE; border-radius: 99px; }
                                .tag-scroll::-webkit-scrollbar-thumb:hover { background: #A5B4FC; }
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
                                        <td colSpan={3} className="py-8 text-center text-sm text-gray-400">
                                            No tags yet. Create one to get started.
                                        </td>
                                    </tr>
                                )}
                                {tags.map((tag) => (
                                    <tr key={tag.tag_id} className="group hover:bg-indigo-50/50 transition-colors">
                                        <td className="py-3 px-3 align-middle text-center">
                                            <TagBadge tag={tag} />
                                        </td>
                                        <td className="py-3 px-3 text-sm text-gray-500 text-center align-middle">{tag.description}</td>
                                        <td className="py-3 px-3 align-middle">
                                            <div className="flex items-center justify-center gap-2">
                                                <button
                                                    onClick={() => onEditTag(tag)}
                                                    className="text-indigo-400 hover:text-indigo-600 transition-colors"
                                                    aria-label="Edit tag"
                                                >
                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
                                                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                                    </svg>
                                                </button>
                                                <button
                                                    onClick={() => onDeleteTag(tag.tag_id)}
                                                    className="text-red-400 hover:text-red-600 transition-colors"
                                                    aria-label="Delete tag"
                                                >
                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
                                                        <polyline points="3 6 5 6 21 6" />
                                                        <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                                                        <path d="M10 11v6M14 11v6" />
                                                        <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                                                    </svg>
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

                    {/* Footer */}
                    <div className="px-6 py-4 flex justify-end shrink-0 bg-gray-50/50">
                        <button
                            onClick={onCreateTag}
                            className="flex items-center gap-1.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded-lg transition-colors shadow-sm"
                        >
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round">
                                <line x1="12" y1="5" x2="12" y2="19" />
                                <line x1="5" y1="12" x2="19" y2="12" />
                            </svg>
                            Create Tag
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}