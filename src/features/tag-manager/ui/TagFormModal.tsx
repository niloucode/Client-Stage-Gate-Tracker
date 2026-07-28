import { useState } from "react";
import type { Tag } from "@/entities/types";
import {
	Backdrop,
	CloseButton,
	ColorPicker,
} from "@/features/tag-manager/ui/TagModals";

export default function TagFormModal({
	mode,
	initial,
	error,
	onClose,
	onSubmit,
}: {
	mode: "create" | "edit";
	initial?: Tag;
	error?: string | null;
	onClose: () => void;
	onSubmit: ({
		tag_id,
		name,
		description,
		color,
	}: {
		tag_id?: string;
		name: string;
		description?: string;
		color?: string;
	}) => Promise<{ error?: string }>;
}) {
	const [name, setName] = useState(initial?.name ?? "");
	const [description, setDescription] = useState(initial?.description ?? "");
	const [color, setColor] = useState(initial?.color ?? "#3B82F6");

	async function handleSubmit() {
		await onSubmit({
			tag_id: initial?.tag_id,
			name: name,
			description: description,
			color: color,
		});
	}

	return (
		<>
			<Backdrop onClick={onClose} />
			<div className="fixed inset-0 z-50 flex items-center justify-center p-4">
				<div className="bg-neutral-surface rounded-xl shadow-2xl w-full max-w-md">
					{/* Header */}
					<div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
						<h2 className="text-base font-semibold text-gray-900">
							{mode === "create" ? "Create Tag" : "Edit Tag"}
						</h2>
						<CloseButton onClick={onClose} />
					</div>

					{/* Body */}
					<div className="px-6 py-5 space-y-5">
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-1.5">
								Tag Name
							</label>
							<input
								type="text"
								value={name}
								onChange={(e) => setName(e.target.value)}
								placeholder="e.g. Production"
								maxLength={10}
								className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
							/>
							<div className="flex mt-0.5 text-xs">
								{error && <span className="text-red-500">{error}</span>}
								<span className="text-gray-400 ml-auto">{name.length}/10</span>
							</div>
						</div>

						<div>
							<label className="block text-sm font-medium text-gray-700 mb-1.5">
								Description
							</label>
							<textarea
								value={description}
								onChange={(e) => setDescription(e.target.value)}
								placeholder="Used for critical infrastructure."
								rows={3}
								maxLength={35}
								className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent resize-none"
							/>
							<p className="text-xs text-gray-400 text-right mt-0.5">{description.length}/35</p>
						</div>

						<div>
							<label className="block text-sm font-medium text-gray-700 mb-2">
								Tag Color
							</label>
							<ColorPicker value={color} onChange={setColor} />
						</div>
					</div>

					{/* Footer */}
					<div className="px-6 py-4 border-t border-gray-100 flex justify-end">
						<button
							onClick={handleSubmit}
							disabled={!name.trim()}
							className="text-sm font-semibold text-neutral-surface bg-brand-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed px-5 py-2 rounded-lg transition-colors"
						>
							Save Tag
						</button>
					</div>
				</div>
			</div>
		</>
	);
}
