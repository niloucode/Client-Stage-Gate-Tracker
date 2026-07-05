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
	onClose,
	onSubmit,
}: {
	mode: "create" | "edit";
	initial?: Tag;
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
	}) => void;
}) {
	const [name, setName] = useState(initial?.name ?? "");
	const [description, setDescription] = useState(initial?.description ?? "");
	const [color, setColor] = useState(initial?.color ?? "#3B82F6");

	function handleSubmit() {
		onSubmit({
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
				<div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
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
								className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
							/>
						</div>

						<div>
							<label className="block text-sm font-medium text-gray-700 mb-1.5">
								Description
							</label>
							<textarea
								value={description}
								onChange={(e) => setDescription(e.target.value)}
								placeholder="Used for critical infrastructure and customer facing assets."
								rows={3}
								className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
							/>
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
							className="text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed px-5 py-2 rounded-lg transition-colors"
						>
							Save Tag
						</button>
					</div>
				</div>
			</div>
		</>
	);
}
