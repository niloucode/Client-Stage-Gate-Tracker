"use client";

import { useState, type SyntheticEvent } from "react";
import { Link2, Key, Code2 } from "lucide-react";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { useResetOnOpen } from "@/shared/hooks/useResetOnOpen";
import type { VariableItem, VariableType } from "@/entities/variable";
import type { VariableCreateInput } from "@/shared/schemas/variable";

interface VariableFormModalProps {
	isOpen: boolean;
	variable?: VariableItem | null;
	onClose: () => void;
	/** Resolves true only after the mutation succeeded; the modal closes itself. */
	onSubmit: (data: VariableCreateInput) => Promise<boolean>;
}

const TYPE_OPTIONS: {
	type: VariableType;
	label: string;
	icon: typeof Link2;
	activeClass: string;
}[] = [
	{
		type: "link",
		label: "Link",
		icon: Link2,
		activeClass:
			"bg-emerald-100 text-emerald-800 border-emerald-400 ring-2 ring-emerald-400/20",
	},
	{
		type: "credential",
		label: "Credential",
		icon: Key,
		activeClass:
			"bg-brand-100 text-brand-600 border-brand-200 ring-2 ring-brand-500/20",
	},
	{
		type: "repository",
		label: "Repository",
		icon: Code2,
		activeClass:
			"bg-amber-100 text-amber-900 border-amber-400 ring-2 ring-amber-400/20",
	},
];

/** Create/edit modal for project variables (form-kit based). */
export function VariableFormModal({
	isOpen,
	variable,
	onClose,
	onSubmit,
}: VariableFormModalProps) {
	const isEdit = Boolean(variable);

	const [name, setName] = useState("");
	const [type, setType] = useState<VariableType>("link");
	const [value, setValue] = useState("");
	const [notesTeam, setNotesTeam] = useState("");
	const [notesClient, setNotesClient] = useState("");
	const [errors, setErrors] = useState<Record<string, string>>({});
	const [isSubmitting, setIsSubmitting] = useState(false);

	useResetOnOpen(isOpen, () => {
		if (variable) {
			setName(variable.name);
			setType(variable.type);
			setValue(variable.value);
			setNotesTeam(variable.notesTeam);
			setNotesClient(variable.notesClient);
		} else {
			setName("");
			setType("link");
			setValue("");
			setNotesTeam("");
			setNotesClient("");
		}
		setErrors({});
	});

	const handleClose = () => {
		setErrors({});
		onClose();
	};

	const validate = (): boolean => {
		const newErrors: Record<string, string> = {};
		if (!name.trim()) newErrors.name = "Variable name is required";
		if (name.length > 20) newErrors.name = "Name must be 20 characters or less";
		if (!value.trim()) newErrors.value = "Variable value/address is required";
		if (value.length > 4096)
			newErrors.value = "Value must be 4096 characters or less";

		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	};

	const handleSubmit = async (e: SyntheticEvent) => {
		e.preventDefault();
		if (!validate()) return;

		setIsSubmitting(true);
		const ok = await onSubmit({
			name: name.trim(),
			type,
			value: value.trim(),
			notesTeam: notesTeam.trim(),
			notesClient: notesClient.trim(),
		});
		setIsSubmitting(false);
		if (ok) handleClose();
	};

	return (
		<Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
			<DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle>
						{isEdit ? "Edit Variable Details" : "Add Variable Details"}
					</DialogTitle>
				</DialogHeader>

				<form onSubmit={handleSubmit} className="flex flex-col gap-5 py-1">
					{/* Name Field */}
					<div className="space-y-1">
						<div className="flex justify-between items-center">
							<Label required error={!!errors.name}>
								Name
							</Label>
							<span className="text-[11px] text-muted-foreground">
								{name.length} / 20
							</span>
						</div>
						<Input
							value={name}
							maxLength={20}
							onChange={(e) => {
								setName(e.target.value);
								if (errors.name) setErrors((prev) => ({ ...prev, name: "" }));
							}}
							placeholder="Input Variable Name"
							aria-invalid={!!errors.name}
							className="h-10"
						/>
						{errors.name && (
							<p className="text-xs text-destructive">{errors.name}</p>
						)}
					</div>

					{/* Variable Type Selector */}
					<div className="space-y-2">
						<Label required>Variable Type</Label>
						<div className="flex items-center gap-3 flex-wrap">
							{TYPE_OPTIONS.map((opt) => {
								const isSelected = type === opt.type;
								const Icon = opt.icon;

								return (
									<label
										key={opt.type}
										className={cn(
											"flex items-center gap-2.5 px-3.5 py-2 rounded-full border border-border cursor-pointer transition-all select-none text-xs",
											isSelected
												? opt.activeClass
												: "bg-neutral-surface hover:bg-neutral-subtle text-foreground/80",
										)}
									>
										<input
											type="radio"
											name="variable-type"
											checked={isSelected}
											onChange={() => setType(opt.type)}
											className="sr-only"
										/>
										<span
											className={cn(
												"size-3 rounded-full border flex items-center justify-center",
												isSelected
													? "border-current bg-current"
													: "border-muted-foreground",
											)}
										/>
										<Icon className="size-3.5 shrink-0" />
										<span>{opt.label}</span>
									</label>
								);
							})}
						</div>
					</div>

					{/* Value/Address */}
					<div className="space-y-1">
						<Label required error={!!errors.value}>
							Variable Value/Address
						</Label>
						<Input
							value={value}
							maxLength={4096}
							onChange={(e) => {
								setValue(e.target.value);
								if (errors.value) setErrors((prev) => ({ ...prev, value: "" }));
							}}
							placeholder="Enter the URL, repository address, credential, or secret value..."
							aria-invalid={!!errors.value}
							className="h-10 font-mono text-xs"
						/>
						{errors.value && (
							<p className="text-xs text-destructive">{errors.value}</p>
						)}
					</div>

					{/* Notes to Team */}
					<div className="space-y-1">
						<Label>Notes to the Team</Label>
						<Textarea
							value={notesTeam}
							onChange={(e) => setNotesTeam(e.target.value)}
							placeholder="Add internal notes, instructions, or context visible only to your team..."
							rows={3}
							className="resize-none text-xs"
						/>
					</div>

					{/* Notes to Client */}
					<div className="space-y-1">
						<Label>Notes to the Client</Label>
						<Textarea
							value={notesClient}
							onChange={(e) => setNotesClient(e.target.value)}
							placeholder="Add information or instructions that your client may want to take note of..."
							rows={3}
							className="resize-none text-xs"
						/>
					</div>

					<DialogFooter className="pt-3 border-t border-border">
						<Button
							type="button"
							variant="ghost"
							onClick={handleClose}
							disabled={isSubmitting}
						>
							Cancel
						</Button>
						<Button type="submit" disabled={isSubmitting}>
							{isSubmitting
								? "Saving…"
								: isEdit
									? "Save Changes"
									: "Add Variable Details"}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
