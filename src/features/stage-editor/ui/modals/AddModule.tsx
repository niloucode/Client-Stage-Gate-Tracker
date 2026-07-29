"use client"

import { useState } from "react"
import { moduleCreateSchema } from "@/shared/schemas"
import { Label } from "@/shared/ui/label"
import { Modal } from "@/shared/ui/modal"
import { Button } from "@/shared/ui/button"

interface AddModuleFormData {
	name: string
	start_date: Date | null
	deadline_date: Date | null
	finish_date: Date | null
}

interface AddModuleProps {
	isOpen: boolean
	activePhase: number | null
	onClose: () => void
	onSubmit: (data: AddModuleFormData) => void
}

const emptyFormData: AddModuleFormData = {
	name: "",
	start_date: null,
	deadline_date: null,
	finish_date: null,
}

type FieldErrors = Partial<Record<keyof AddModuleFormData, string>>

export function AddModule({
	isOpen,
	activePhase,
	onClose,
	onSubmit,
}: AddModuleProps) {
	const [formData, setFormData] = useState<AddModuleFormData>(emptyFormData)
	const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})

	const MIN_GAP_MS = 24 * 60 * 60 * 1000

	const handleStartDate = (d: Date | null) => {
		const next = d ? new Date(d) : null
		setFormData((prev) => {
			if (
				next &&
				prev.finish_date &&
				next.getTime() + MIN_GAP_MS > prev.finish_date.getTime()
			) {
				return {
					...prev,
					start_date: next,
					finish_date: new Date(next.getTime() + MIN_GAP_MS),
				}
			}
			return { ...prev, start_date: next }
		})
	}

	const handleFinishDate = (d: Date | null) => {
		const next = d ? new Date(d) : null
		setFormData((prev) => {
			if (
				next &&
				prev.start_date &&
				prev.start_date.getTime() + MIN_GAP_MS > next.getTime()
			) {
				return {
					...prev,
					finish_date: next,
					start_date: new Date(next.getTime() - MIN_GAP_MS),
				}
			}
			return { ...prev, finish_date: next }
		})
	}

	if (!isOpen) return null

	const handleClose = () => {
		setFormData(emptyFormData)
		setFieldErrors({})
		onClose()
	}

	const handleSubmit = () => {
		const result = moduleCreateSchema.safeParse(formData)
		if (!result.success) {
			const flattened = result.error.flatten().fieldErrors
			const mapped: FieldErrors = {}
			for (const [key, msgs] of Object.entries(flattened)) {
				if (msgs && msgs.length > 0)
					mapped[key as keyof AddModuleFormData] = msgs[0]
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
			title={"Create New Module"}
			subtitle={`Fill in the details to create a new module for Phase ${activePhase}.`}
			
			footer={<>
			<Button onClick={handleClose} variant="transparency">
				Cancel
			</Button>
			<Button icon="add" onClick={handleSubmit}>
				{"Add Module"}
			</Button>
			</>}>
			<div className="space-y-4">
				<div>
					<Label required error={!!fieldErrors.name}>
						Module Name
					</Label>
					<input
						type="text"
						maxLength={35}
						value={formData.name}
						onChange={(e) =>
							setFormData({ ...formData, name: e.target.value })
						}
						placeholder="e.g., Authentication & Identity"
						className={`w-full px-3 py-2 bg-neutral-surface border rounded-lg text-sm text-[#0F172A] focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all ${fieldErrors.name ? "border-red-400 focus:ring-red-400" : "border-brand-100"}`}
					/>
					<div className="flex justify-between mt-1">
						{fieldErrors.name ? (
							<p className="text-xs text-red-500">{fieldErrors.name}</p>
						) : (
							<span />
						)}
						<span className="text-[10px] text-[#94A3B8]">
							{formData.name.length}/35
						</span>
					</div>
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
			</div>
		</Modal>
	)
}
