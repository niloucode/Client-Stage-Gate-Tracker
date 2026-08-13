"use client"

import { use, useState, useRef, useCallback } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import {
	PhaseCard,
	ModuleCard,
} from "@/features/stage-editor"
import type { Phase } from "@/features/stage-editor/types"
import { useStageTree } from "@/entities/stage/queries"
import { Plus, ChevronLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Back } from "@/components/ui/back"

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
      {/* Navigation Link */}
			<Back link={"/projects/"} />

			<div className="flex justify-between items-end my-4">
				<div>
					<h1>
						Stage Name Here
					</h1>
					<p className="subtitle">
						Define project phases, modules, and workflows.
					</p>
				</div>
				<Button onClick={() => stepperRef.current?.openCreateModal()}><Plus />Add Phase</Button>
			</div>

			<PhaseCard
				ref={stepperRef}
				phases={phases}
				stageId={stageId}
				activePhase={activePhase}
				setActivePhase={setActivePhase}
			/>

			<ModuleCard
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
