import { useState } from "react";
import type { Tag } from "@/entities/types";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
	ColorPicker,
} from "@/features/tag-manager/ui/TagModals";

export default function TagFormModal({
	mode,
	initial,
	error,
	onClose,
	onSubmit,
	isOpen,
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
	isOpen?: boolean;
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
		<Dialog open={isOpen ?? true} onOpenChange={(open) => { if (!open) onClose() }}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>{mode === "create" ? "Create Tag" : "Edit Tag"}</DialogTitle>
				</DialogHeader>

				{/* Body */}
				<div className="space-y-5">
					<div>
						<Label required>
							Tag Name
						</Label>
						<Input
							type="text"
							value={name}
							onChange={(e) => setName(e.target.value)}
							placeholder="e.g. Production"
							maxLength={10}
						/>
						<div className="flex mt-0.5 text-xs">
							{error && <span className="text-red-500">{error}</span>}
							<span className="text-gray-400 ml-auto">{name.length}/10</span>
						</div>
					</div>

					<div>
						<Label>
							Description
						</Label>
						<Textarea
							value={description}
							onChange={(e) => setDescription(e.target.value)}
							placeholder="Used for critical infrastructure."
							rows={3}
							maxLength={35}
						/>
						<p className="text-xs text-gray-400 text-right mt-0.5">{description.length}/35</p>
					</div>

					<div>
						<Label>
							Tag Color
						</Label>
						<ColorPicker value={color} onChange={setColor} />
					</div>
				</div>

				<DialogFooter>
					<Button
						onClick={handleSubmit}
						disabled={!name.trim()}
					>
						Save Tag
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
