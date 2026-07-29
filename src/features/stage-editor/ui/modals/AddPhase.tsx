"use client"

import { useState } from "react"
import { phaseCreateSchema } from "@/shared/schemas"
import { Label, Button, Modal } from "@/shared/ui/"

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

	if (!isOpen) return null

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
		<Modal
			isOpen={isOpen}
			onClose={onClose}
			title={"Create New Phase"}
			subtitle={"Fill in the details to create a new phase."}
			footer={<>
			<Button onClick={handleClose} variant="transparency">
				Cancel
			</Button>
			<Button onClick={handleSubmit} icon="add">
				{"Add Phase"}
			</Button>
			</>}>
			<div>
				<div className="flex justify-between items-center">
				<Label required error={!!fieldErrors.name}>
					Phase Name
				</Label>
					<span className="text-[10px] text-[#94A3B8]">
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
						<p className="text-xs text-red-500">{fieldErrors.name}</p>
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
					className="w-full px-3 py-2 bg-neutral-surface border border-brand-100 rounded-lg text-sm text-[#0F172A] resize-none focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all"
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
					className="w-full px-3 py-2 bg-neutral-surface border border-brand-100 rounded-lg text-sm text-[#0F172A] focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all"
				/>
			</div>
		</Modal>
	)
}
