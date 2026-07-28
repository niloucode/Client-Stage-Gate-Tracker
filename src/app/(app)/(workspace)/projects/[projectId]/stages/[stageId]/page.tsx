"use client"

import { use, useState, useRef, useCallback } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import {
	PhaseStepper,
	ActivePhaseDetails,
	ModulesCard,
} from "@/features/stage-editor"
import type { Phase } from "@/features/stage-editor/types"
import { useStageTree } from "@/entities/stage/queries"
import { Plus } from "lucide-react"
import { Button } from "@/shared/ui/button"

interface PageParams {
	projectId: string
	stageId: string
}

function EditorContent({
	projectId,
	stageId,
}: {
	projectId: string
	stageId: string
}) {
	const router = useRouter()
	const searchParams = useSearchParams()
	const { data: stageTree, isLoading, error } = useStageTree(stageId)
	const phases = (stageTree?.phases ?? []) as unknown as Phase[]

	// Restore phase: sessionStorage → URL param → null
	const initialPhase = (() => {
		const stored =
			typeof window !== "undefined"
				? sessionStorage.getItem("stageEditorPhase")
				: null
		if (stored) return Number(stored)
		const param = searchParams.get("phase")
		return param ? Number(param) : null
	})()
	const [activePhase, setActivePhaseState] = useState<number | null>(
		initialPhase,
	)
	const stepperRef = useRef<{ openCreateModal: () => void } | null>(null)

	// Wrap setActivePhase: state + sessionStorage + URL (no effect loop)
	const setActivePhase = useCallback(
		(phase: number | null) => {
			setActivePhaseState(phase)
			if (typeof window !== "undefined") {
				if (phase !== null) {
					sessionStorage.setItem("stageEditorPhase", String(phase))
				} else {
					sessionStorage.removeItem("stageEditorPhase")
				}
			}
			const params = new URLSearchParams(searchParams.toString())
			if (phase !== null) {
				params.set("phase", String(phase))
			} else {
				params.delete("phase")
			}
			const newUrl = params.toString()
				? `?${params.toString()}`
				: window.location.pathname
			router.replace(newUrl, { scroll: false })
		},
		[router, searchParams],
	)

	if (isLoading) {
		return (
			<div className="min-h-screen flex items-center justify-center">
				<p className="text-sm text-neutral-subtle">Loading stage structure…</p>
			</div>
		)
	}

	if (error) {
		return (
			<div className="min-h-screen flex items-center justify-center">
				<p className="text-sm text-red-500">Failed to load stage data.</p>
			</div>
		)
	}

	return (
		<div>
			<div className="flex justify-between items-end mb-6">
				<div>
					<h1 className="text-4xl font-bold text-foreground tracking-tight">
						Structure Editor
					</h1>
					<p className="text-m text-neutral-border mt-1">
						Define project phases, modules, and workflows.
					</p>
				</div>
				<Button onClick={() => stepperRef.current?.openCreateModal()}><Plus></Plus>Add Phase</Button>
			</div>

			<PhaseStepper
				ref={stepperRef}
				phases={phases}
				stageId={stageId}
				activePhase={activePhase}
				setActivePhase={setActivePhase}
			/>

			<ActivePhaseDetails
				activePhase={activePhase}
				phases={phases}
				stageId={stageId}
			/>

			<ModulesCard
				activePhase={activePhase}
				phases={phases}
				projectId={projectId}
				stageId={stageId}
			/>
		</div>
	)
}

export default function EditorPage({
	params,
}: {
	params: Promise<PageParams>
}) {
	const { projectId, stageId } = use(params)
	return <EditorContent projectId={projectId} stageId={stageId} />
}
