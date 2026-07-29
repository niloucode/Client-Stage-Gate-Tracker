"use client"

import type { Tag } from "@/entities/types"
import { TAG_COLORS } from "@/shared/lib/colors"
import { useState } from "react"
import TagModalDelete from "@/features/tag-manager/ui/TagModalDelete"
import TagListModal from "@/features/tag-manager/ui/TagListModal"
import TagFormModal from "@/features/tag-manager/ui/TagFormModal"
import{ Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"

export function CloseButton({ onClick }: { onClick: () => void }) {
	return (
		<button
			onClick={onClick}
			className="text-gray-400 hover:text-gray-600 transition-colors"
			aria-label="Close"
		>
			<svg
				width="16"
				height="16"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				strokeWidth={2.5}
				strokeLinecap="round"
			>
				<line x1="18" y1="6" x2="6" y2="18" />
				<line x1="6" y1="6" x2="18" y2="18" />
			</svg>
		</button>
	)
}

// ── Color picker ──────────────────────────────────────────────────────────────

export function ColorPicker({
	value,
	onChange,
}: {
	value: string
	onChange: (c: string) => void
}) {
	return (
		<div className="grid grid-cols-9 gap-1.5">
			{TAG_COLORS.map((color) => {
				const isSelected = value === color
				return (
					<button
						key={color}
						onClick={() => onChange(color)}
						className="w-7 h-7 rounded-md transition-all hover:scale-110 border-2"
						style={{
							backgroundColor: color,
							borderColor: isSelected ? "#1E1B4B" : "transparent",
							boxShadow: isSelected ? `0 0 0 2px neutral-surface, 0 0 0 4px ${color}` : "none",
						}}
						aria-label={color}
					>
						{isSelected && (
							<span
								style={{
									color: "neutral-surface",
									fontSize: 10,
									lineHeight: 1,
									textShadow: "0 0 2px rgba(0,0,0,0.4)",
								}}
							>
								✓
							</span>
						)}
					</button>
				)
			})}
		</div>
	)
}

// ── Modal backdrop ────────────────────────────────────────────────────────────

export function Backdrop({ onClick }: { onClick: () => void }) {
	return <div className="fixed inset-0 bg-foreground/40 z-40" onClick={onClick} />
}

// ── Tag List Modal ────────────────────────────────────────────────────────────

export function TagManager({
	isOpen,
	onClose,
	onSave,
	onDelete,
	tags,
}: {
	isOpen: boolean
	onClose: () => void
	onSave: ({
		name,
		tag_id,
		description,
		color,
	}: {
		name: string
		tag_id?: string
		description?: string
		color?: string
	}) => Promise<{ error?: string }>
	onDelete: (tag_id: string) => void
	tags: Tag[]
}) {
	const [view, setView] = useState<"list" | "create" | "edit" | "delete" | null>(
		"list",
	)
	const [selectedTag, setSelectedTag] = useState<Tag | null>(null)
	const [formError, setFormError] = useState<string | null>(null)

	function handleClose() {
		setView("list")
		setSelectedTag(null)
		onClose()
	}

	function handleEditTag(tag: Tag) {
		setSelectedTag(tag)
		setView("edit")
	}

	async function handleSaveTag({
		name,
		tag_id,
		description,
		color,
	}: {
		name: string
		tag_id?: string
		description?: string
		color?: string
	}): Promise<{ error?: string }> {
		if (!name.trim()) return {}
		const result = await onSave({
			name: name.trim(),
			description: description?.trim() ?? "",
			color: color,
			tag_id: tag_id ?? "",
		})
		if (result?.error) {
			setFormError(result.error)
			return result
		}
		setFormError(null)
		setView("list")
		setSelectedTag(null)
		return {}
	}

	function handleConfirmDelete(tag_id: string) {
		onDelete(tag_id)
		setView("list")
		setSelectedTag(null)
	}

	function handleRequestDelete(tag: Tag) {
		setSelectedTag(tag)
		setView("delete")
	}

	if (view === "list") {
		return (
			<Dialog open={isOpen} onOpenChange={(open) => { if (!open) handleClose() }}>
				<DialogContent className="sm:max-w-lg">
					<DialogHeader>
						<DialogTitle>Tags</DialogTitle>
						<DialogDescription>Fill in the details for this project.</DialogDescription>
					</DialogHeader>
					<TagListModal
						tags={tags}
						onClose={handleClose}
						onEditTag={handleEditTag}
						onRequestDeleteTag={handleRequestDelete}
					/>
					<DialogFooter>
						<Button onClick={handleClose} variant="ghost">Cancel</Button>
						<Button onClick={()=> setView("create")}><Plus />Create Tag</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		)
	}

	if (view === "create") {
		return (
			<TagFormModal
				mode="create"
				error={formError}
				onClose={() => { 
					setView("list") 
					setFormError(null) 
				}}
				onSubmit={handleSaveTag}
			/>
		)
	}

	if (view === "edit" && selectedTag) {
		return (
			<TagFormModal
				mode="edit"
				initial={selectedTag}
				error={formError}
				onClose={() => { 
					setView("list") 
					setFormError(null) 
				}}
				onSubmit={handleSaveTag}
			/>
		)
	}

	if (view === "delete" && selectedTag) {
		return (
			<TagModalDelete
				tag={selectedTag}
				onClose={() => setView("list")}
				onConfirm={handleConfirmDelete}
			/>
		)
	}

	return null
}
