"use client"

import { useState } from "react"
import { phaseCreateSchema } from "@/shared/schemas"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"

interface AddPhaseFormData {
	name: string
	description: string
	start_date: Date | null
	deadline_date: Date | null
	finish_date: Date | null
}

interface AddPhaseProps {
	isOpen: boolean
	onClose: () => void
	onSubmit: (data: AddPhaseFormData) => void
}

const emptyFormData: AddPhaseFormData = {
	name: "",
	description: "",
	start_date: null,
	deadline_date: null,
	finish_date: null,
}

type FieldErrors = Partial<Record<keyof AddPhaseFormData, string>>

export function AddPhase({ isOpen, onClose, onSubmit }: AddPhaseProps) {
	const [formData, setFormData] = useState<AddPhaseFormData>(emptyFormData)
	const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})


	const handleClose = () => {
		setFormData(emptyFormData)
		setFieldErrors({})
		onClose()
	}

	const handleSubmit = () => {
		const result = phaseCreateSchema.safeParse(formData)
		if (!result.success) {
			const flattened = result.error.flatten().fieldErrors
			const mapped: FieldErrors = {}
			for (const [key, msgs] of Object.entries(flattened)) {
				if (msgs && msgs.length > 0)
					mapped[key as keyof AddPhaseFormData] = msgs[0]
			}
			setFieldErrors(mapped)
			return
		}
		onSubmit(formData)
		setFormData(emptyFormData)
		setFieldErrors({})
	}

	return (
		<Dialog open={isOpen} onOpenChange={(open) => { if (!open) handleClose() }}>
			<DialogContent className="sm:max-w-[36rem]">
				<DialogHeader>
					<DialogTitle>{"Create New Phase"}</DialogTitle>
					<DialogDescription>{"Fill in the details to create a new phase."}</DialogDescription>
				</DialogHeader>
				<div>
					<div className="flex justify-between items-center">
					<Label required error={!!fieldErrors.name}>
						Phase Name
					</Label>
						<span className="text-[10px] text-muted-foreground">
							{formData.name.length}/20
						</span>
					</div>
					<input
						type="text"
						maxLength={20}
						value={formData.name}
						onChange={(e) =>
							setFormData({ ...formData, name: e.target.value })
						}
						placeholder="e.g., Discovery"
						className={`w-full px-3 py-2 bg-neutral-surface border rounded-lg text-sm text-[#0F172A] focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all ${fieldErrors.name ? "border-red-400 focus:ring-red-400" : "border-brand-100"}`}
					/>
					<div className="flex justify-between mt-1">
						{fieldErrors.name ? (
							<p className="text-xs text-destructive">{fieldErrors.name}</p>
						) : (
							<span />
						)}
					</div>
				</div>

				<div>
					<label className="block text-xs font-semibold text-[#475569] mb-1.5">
						Description
					</label>
					<textarea
						value={formData.description}
						onChange={(e) =>
							setFormData({ ...formData, description: e.target.value })
						}
						placeholder="Describe the objectives and scope of this phase..."
						rows={3}
						className="w-full px-3 py-2 pr-14 bg-neutral-surface border border-brand-100 rounded-lg text-sm text-[#0F172A] resize-none focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all"
					/>
				</div>

				<div>
					<label className="block text-xs font-semibold text-[#475569] mb-1.5">
						Deadline Date
					</label>
					<input
						type="datetime-local"
						value={
							formData.deadline_date
								? new Date(
										formData.deadline_date.getTime() -
											formData.deadline_date.getTimezoneOffset() * 60000,
									)
										.toISOString()
										.slice(0, 16)
								: ""
						}
						onChange={(e) =>
							setFormData({
								...formData,
								deadline_date: e.target.value
									? new Date(e.target.value)
									: null,
							})
						}
						className="w-full px-3 py-2 pr-14 bg-neutral-surface border border-brand-100 rounded-lg text-sm text-[#0F172A] focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all"
					/>
				</div>
				<DialogFooter>
					<Button onClick={handleClose} variant="ghost">
						Cancel
					</Button>
					<Button onClick={handleSubmit}>
						<Plus />{"Add Phase"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	)
}
