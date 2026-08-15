"use client";

import { useState } from "react";
import type { Tag } from "@/entities/types";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { FormInput } from "@/components/ui/forminput";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ColorPicker } from "@/shared/ui";
import { useResetOnOpen } from "@/shared/hooks/useResetOnOpen";

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
	const currentIsOpen = isOpen ?? true;

	const [name, setName] = useState(initial?.name ?? "");
	const [description, setDescription] = useState(initial?.description ?? "");
	const [color, setColor] = useState(initial?.color ?? "#3B82F6");
	const [fieldError, setFieldError] = useState<string | null>(null);

	// Reset the form fields when the dialog opens (deferred until mount).
	useResetOnOpen(currentIsOpen, () => {
		setName(initial?.name ?? "");
		setDescription(initial?.description ?? "");
		setColor(initial?.color ?? "#3B82F6");
		setFieldError(null);
	});

	async function handleSubmit() {
		if (!name.trim()) {
			setFieldError("Tag name is required");
			return;
		}
		setFieldError(null);
		await onSubmit({
			tag_id: initial?.tag_id,
			name: name.trim(),
			description: description.trim(),
			color: color,
		});
	}

	return (
		<Dialog open={currentIsOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>{mode === "create" ? "Create Tag" : "Edit Tag"}</DialogTitle>
				</DialogHeader>

				{/* Body */}
				<div className="space-y-5">
					{/* Tag Name Input with Error Checking */}
					<FormInput
						label="Tag Name"
						required
						maxLength={12}
						value={name}
						placeholder="e.g. Production"
						error={fieldError || error || undefined}
						onChange={(e) => {
							setName(e.target.value);
							if (fieldError) setFieldError(null);
						}}
					/>

					{/* Description Textarea */}
					<FormInput
						variant="textarea"
						label="Description"
						maxLength={40}
						rows={3}
						value={description}
						placeholder="Used for critical infrastructure."
						onChange={(e) => setDescription(e.target.value)}
					/>

					<Label>Tag Color</Label>
					<div className="flex flex-col items-center">
						<ColorPicker value={color} onChange={setColor} />
					</div>
				</div>

				<DialogFooter>
					<Button
						onClick={handleSubmit}
					>
						Save Tag
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
