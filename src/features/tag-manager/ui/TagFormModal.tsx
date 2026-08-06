import { useState, useEffect } from "react";
import type { Tag } from "@/entities/types";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
	ColorPicker,
} from "@/shared/ui";

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

	// Reset form when modal opens or initial data changes
	useEffect(() => {
		if (!isOpen) return
		setName(initial?.name ?? "")
		setDescription(initial?.description ?? "")
		setColor(initial?.color ?? "#3B82F6")
	}, [isOpen, initial?.name, initial?.description, initial?.color])

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
			<DialogContent>
				<DialogHeader>
					<DialogTitle>{mode === "create" ? "Create Tag" : "Edit Tag"}</DialogTitle>
				</DialogHeader>

				{/* Body */}
				<div className="space-y-5 px-6">
					<div>
						<div className="flex justify-between items-center">
							<Label required>Tag Name</Label>
							<span className="text-[10px] text-muted-foreground">{name.length}/10</span>
						</div>
						<Input
							type="text"
							value={name}
							onChange={(e) => setName(e.target.value)}
							placeholder="e.g. Production"
							maxLength={10}
						/>
					</div>

					<div>
						<div className="flex justify-between items-center">
							<Label>Description</Label>
							<span className="text-[10px] text-muted-foreground">{description.length}/35</span>
						</div>
						<Textarea
							value={description}
							onChange={(e) => setDescription(e.target.value)}
							placeholder="Used for critical infrastructure."
							rows={3}
							maxLength={35}
						/>
					</div>

					<Label>
						Tag Color
					</Label>
					<div className="flex flex-col items-center">
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
