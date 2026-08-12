"use client"

import { useState } from "react"
import { moduleCreateSchema } from "@/shared/schemas"
import { getFieldErrors } from "@/shared/lib/zod"
import {
	fromDateTimeLocalInput,
	toDateTimeLocalInput,
} from "@/shared/lib/scheduling"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"

interface AddModuleFormData {
	name: string
	planStart: Date | null
	planEnd: Date | null
	actualEnd: Date | null
}

interface AddModuleProps {
	isOpen: boolean
	activePhase: number | null
	onClose: () => void
	onSubmit: (data: AddModuleFormData) => void
}

const emptyFormData: AddModuleFormData = {
	name: "",
	planStart: null,
	planEnd: null,
	actualEnd: null,
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
				prev.actualEnd &&
				next.getTime() + MIN_GAP_MS > prev.actualEnd.getTime()
			) {
				return {
					...prev,
					planStart: next,
					actualEnd: new Date(next.getTime() + MIN_GAP_MS),
				}
			}
			return { ...prev, planStart: next }
		})
	}

	const handleFinishDate = (d: Date | null) => {
		const next = d ? new Date(d) : null
		setFormData((prev) => {
			if (
				next &&
				prev.planStart &&
				prev.planStart.getTime() + MIN_GAP_MS > next.getTime()
			) {
				return {
					...prev,
					actualEnd: next,
					planStart: new Date(next.getTime() - MIN_GAP_MS),
				}
			}
			return { ...prev, actualEnd: next }
		})
	}


	const handleClose = () => {
		setFormData(emptyFormData)
		setFieldErrors({})
		onClose()
	}

	const handleSubmit = () => {
		const result = moduleCreateSchema.safeParse(formData)
		if (!result.success) {
			const mapped = getFieldErrors(result)
			setFieldErrors(mapped)
			return
		}
		onSubmit(formData)
		setFormData(emptyFormData)
		setFieldErrors({})
	}

	return (
		<Dialog open={isOpen} onOpenChange={(open) => { if (!open) handleClose() }}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>{"Create New Module"}</DialogTitle>
					<DialogDescription>{`Fill in the details to create a new module for Phase ${activePhase}.`}</DialogDescription>
				</DialogHeader>
				<div className="space-y-4">
					<div>
						<div className="flex items-center justify-between">
							<Label required error={!!fieldErrors.name}>
								Module Name
							</Label>
							<span className="text-[10px] text-muted-foreground">{formData.name.length}/35</span>
						</div>
						<input
							type="text"
							maxLength={35}
							value={formData.name}
							onChange={(e) =>
								setFormData({ ...formData, name: e.target.value })
							}
							placeholder="e.g., Authentication & Identity"
							className={`w-full px-3 py-2 bg-neutral-surface border rounded-md text-sm text-slate-900 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all ${fieldErrors.name ? "border-red-400 focus:ring-red-400" : "border-brand-100"}`}
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
						<label className="block text-xs font-semibold text-slate-600 mb-1.5">
							Plan End
						</label>
						<input
							type="datetime-local"
							value={toDateTimeLocalInput(formData.planEnd)}
							onChange={(e) =>
								setFormData({
									...formData,
									planEnd: fromDateTimeLocalInput(e.target.value),
								})
							}
							className="w-full px-3 py-2 pr-14 bg-neutral-surface border border-brand-100 rounded-md text-sm text-slate-900 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all"
						/>
					</div>
				</div>
				<DialogFooter>
					<Button onClick={handleClose} variant="ghost">
						Cancel
					</Button>
					<Button onClick={handleSubmit}>
						<Plus />{"Add Module"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	)
}
