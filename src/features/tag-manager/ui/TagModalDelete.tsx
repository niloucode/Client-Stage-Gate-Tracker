import type { Tag } from "@/entities/types";

import {
	Backdrop,
	CloseButton,
} from "@/features/tag-manager/ui/TagModals";

import { TagBadge } from "@/shared/ui"

export default function TagModalDelete({
	tag,
	onClose,
	onConfirm,
}: {
	tag: Tag;
	onClose: () => void;
	onConfirm: (tag_id: string) => void;
}) {
	function handleDelete() {
		onConfirm(tag.tag_id);
	}

	return (
		<>
			<Backdrop onClick={onClose} />
			<div className="fixed inset-0 z-50 flex items-center justify-center p-4">
				<div className="bg-neutral-surface rounded-xl shadow-2xl w-full max-w-sm">
					{/* Header */}
					<div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
						<h2 className="text-base font-semibold text-gray-900">Delete Tag</h2>
						<CloseButton onClick={onClose} />
					</div>

					{/* Body */}
					<div className="px-6 py-5">
						<p className="text-sm text-gray-600 leading-relaxed">
							Are you sure you want to remove the tag, <TagBadge tag={tag} />?
						</p>
						<p className="text-sm text-gray-500 mt-2 leading-relaxed">
							Removing this tag will immediately disassociate it from all resources in
							your workspace. This action cannot be undone.
						</p>
					</div>

					{/* Footer */}
					<div className="px-6 py-4 border-t border-gray-100 flex items-center justify-end gap-3">
						<button
							onClick={onClose}
							className="text-sm font-medium text-gray-600 border border-gray-200 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
						>
							Cancel
						</button>
						<button
							onClick={handleDelete}
							className="text-sm font-semibold text-neutral-surface bg-red-500 hover:bg-red-600 px-4 py-2 rounded-lg transition-colors"
						>
							Yes, Delete
						</button>
					</div>
				</div>
			</div>
		</>
	);
}
