"use client";

import { use, useState, useRef, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ModuleCard } from "@/features/stage-editor";
import { PhaseCard } from "@/features/stage-editor";
import type { Phase } from "@/features/stage-editor";
import { useStageTree } from "@/entities/stage";
import { useCurrentUser } from "@/entities/profile";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Back } from "@/components/ui/back";

interface PageParams {
	projectId: string;
	stageId: string;
}

function EditorContent({
	projectId,
	stageId,
}: {
	projectId: string;
	stageId: string;
}) {
	const router = useRouter();
	const searchParams = useSearchParams();
	const { data: stageTree, isLoading, error } = useStageTree(stageId);
	const { data: profile } = useCurrentUser();
	// Spec: client profiles (linked via the contract) are read-only here;
	// project team and project owners have full edit access.
	const isClientProfile = !!profile?.client_id;
	// PhaseNode (stage tree) is structurally assignable to Phase — no cast needed
	const phases: Phase[] = stageTree?.phases ?? [];

	// Restore phase: sessionStorage → URL param → null
	const initialPhase = (() => {
		const stored =
			typeof window !== "undefined"
				? sessionStorage.getItem("stageEditorPhase")
				: null;
		if (stored) return Number(stored);
		const param = searchParams.get("phase");
		return param ? Number(param) : null;
	})();
	const [activePhase, setActivePhaseState] = useState<number | null>(
		initialPhase,
	);
	const stepperRef = useRef<{ openCreateModal: () => void } | null>(null);

	// Wrap setActivePhase: state + sessionStorage + URL (no effect loop)
	const setActivePhase = useCallback(
		(phase: number | null) => {
			setActivePhaseState(phase);
			if (typeof window !== "undefined") {
				if (phase !== null) {
					sessionStorage.setItem("stageEditorPhase", String(phase));
				} else {
					sessionStorage.removeItem("stageEditorPhase");
				}
			}
			const params = new URLSearchParams(searchParams.toString());
			if (phase !== null) {
				params.set("phase", String(phase));
			} else {
				params.delete("phase");
			}
			const newUrl = params.toString()
				? `?${params.toString()}`
				: window.location.pathname;
			router.replace(newUrl, { scroll: false });
		},
		[router, searchParams],
	);

	if (isLoading) {
		return (
			<div className="min-h-screen flex items-center justify-center">
				<p className="text-sm text-neutral-subtle">Loading stage structure…</p>
			</div>
		);
	}

	if (error) {
		return (
			<div className="min-h-screen flex items-center justify-center">
				<p className="text-sm text-red-500">Failed to load stage data.</p>
			</div>
		);
	}

	return (
		<div>
			{/* Navigation Link */}
			<Back link={`/projects/${projectId}`} />

			<div className="flex justify-between items-end my-4">
				<div>
					<h1>{stageTree?.name ?? "Stage Name"}</h1>
					<p className="subtitle w-3/4">
						{stageTree?.description ||
							"Define project phases, modules, and workflows."}
					</p>
				</div>
				{!isClientProfile && (
					<Button onClick={() => stepperRef.current?.openCreateModal()}>
						<Plus />
						Add Phase
					</Button>
				)}
			</div>

			<PhaseCard
				ref={stepperRef}
				phases={phases}
				stageId={stageId}
				activePhase={activePhase}
				setActivePhase={setActivePhase}
				readOnly={isClientProfile}
			/>

			<ModuleCard
				activePhase={activePhase}
				phases={phases}
				projectId={projectId}
				stageId={stageId}
				readOnly={isClientProfile}
			/>
		</div>
	);
}

/** Stage editor route. */
export default function EditorPage({
	params,
}: {
	params: Promise<PageParams>;
}) {
	const { projectId, stageId } = use(params);
	return <EditorContent projectId={projectId} stageId={stageId} />;
}
