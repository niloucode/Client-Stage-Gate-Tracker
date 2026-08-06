"use client"

import type { Tag } from "@/entities/types"
import { useState } from "react"
import { ConfirmDeleteModal, TagBadge } from "@/shared/ui"
import TagListModal from "@/features/tag-manager/ui/TagListModal"
import TagFormModal from "@/features/tag-manager/ui/TagFormModal"
import{ Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { Label } from "@/components/ui/label"

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
						<DialogDescription>
						Manage the tags used across your projects.
					</DialogDescription>
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
			<ConfirmDeleteModal
				isOpen
				noun="Tag"
				description={
					<>
						Are you sure you want to delete the tag,{" "}
						<TagBadge tag={selectedTag} />? This action cannot be undone.
					</>
				}
				onCancel={() => setView("list")}
				onConfirm={() => handleConfirmDelete(selectedTag.tag_id)}
			/>
		)
	}

	return null
}
