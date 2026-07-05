"use client";

import { use, useState, useRef } from "react";
import {
	PhaseStepper,
	ActivePhaseDetails,
	ModulesCard,
} from "@/features/stage-editor";
import type { Phase } from "@/features/stage-editor/types";
import { useStageTree } from "@/entities/stage/queries";
import TopNav from "@/shared/ui/TopNav";
import Sidebar from "@/shared/ui/sidebar";

interface PageParams {
	projectId: string;
	stageId: string;
}

function EditorContent({ projectId, stageId }: { projectId: string; stageId: string }) {
	const { data: stageTree, isLoading, error } = useStageTree(stageId);
	const phases = (stageTree?.phases ?? []) as Phase[];
	const [activePhase, setActivePhase] = useState<number | null>(null);
	const stepperRef = useRef<{ openCreateModal: () => void } | null>(null);

	if (isLoading) {
		return (
			<div className="bg-[#F8FAFC] min-h-screen flex items-center justify-center">
				<p className="text-sm text-[#64748B]">Loading stage structure…</p>
			</div>
		);
	}

	if (error) {
		return (
			<div className="bg-[#F8FAFC] min-h-screen flex items-center justify-center">
				<p className="text-sm text-red-500">Failed to load stage data.</p>
			</div>
		);
	}

	return (
		<div className="bg-[#F8FAFC] min-h-screen">
			<Sidebar>
				<TopNav breadcrumbs={["Acesoft", "Project", "Stage Structure"]} />
				<div className="max-w-[1400px] mx-auto p-8">
					<div className="flex justify-between items-end pb-6 mb-6 border-b border-[#E2E8F0]">
						<div>
							<h1 className="text-2xl font-bold text-[#0F172A] tracking-tight">Structure Editor</h1>
							<p className="text-sm text-[#64748B] mt-1">Define project phases, modules, and workflows.</p>
						</div>
						<button
							onClick={() => stepperRef.current?.openCreateModal()}
							className="flex items-center gap-2 px-4 py-2 bg-[#4F46E5] text-white rounded-lg hover:bg-[#4338CA] transition-all shadow-sm"
						>
							<svg width="14" height="14" viewBox="0 0 14 14" fill="none">
								<path d="M7 1V13M1 7H13" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
							</svg>
							<span className="font-semibold text-sm">Add Phase</span>
						</button>
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
			</Sidebar>
		</div>
	);
}

export default function EditorPage({ params }: { params: Promise<PageParams> }) {
	const { projectId, stageId } = use(params);
	return <EditorContent projectId={projectId} stageId={stageId} />;
}
