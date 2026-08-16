"use client";

import type { Module } from "../../types";
import { useCreateModule, useUpdateModule } from "@/entities/module/mutations";
import {
	ScheduleNodeModal,
	type ScheduleNodeEntity,
} from "./ScheduleNodeModal";

export interface ModuleModalProps {
	isOpen: boolean;
	onClose: () => void;
	/**
	 * Pass a `module` object for Edit mode, or `null`/`undefined` for Create mode.
	 */
	module?: Module | null;
	activePhase?: number | null;
	stageId: string;
	/** Parent phase — required for Create mode. */
	phaseId?: string | null;
	onDelete?: () => void;
}

function toScheduleNode(module: Module): ScheduleNodeEntity {
	return {
		id: module.module_id,
		name: module.name,
		planStart: module.planStart,
		planEnd: module.planEnd,
		actualStart: module.actualStart,
		actualEnd: module.actualEnd,
	};
}

function ModuleModal({
	isOpen,
	onClose,
	module,
	activePhase,
	stageId,
	phaseId,
	onDelete,
}: ModuleModalProps) {
	const createModuleMutation = useCreateModule();
	const updateModuleMutation = useUpdateModule();

	return (
		<ScheduleNodeModal
			isOpen={isOpen}
			onClose={onClose}
			entity={module ? toScheduleNode(module) : null}
			stageId={stageId}
			parentId={phaseId}
			parentLabel={activePhase != null ? `Phase ${activePhase}` : undefined}
			onDelete={onDelete}
			isPending={
				createModuleMutation.isPending || updateModuleMutation.isPending
			}
			config={{
				entityLabel: "Module",
				createdVerb: "added",
				namePlaceholder: "e.g., Authentication & Identity",
				create: (p) =>
					createModuleMutation.mutateAsync({
						phaseId: p.parentId,
						stageId: p.stageId,
						name: p.name,
						planStart: p.planStart,
						planEnd: p.planEnd,
						actualStart: p.actualStart,
						actualEnd: p.actualEnd,
					}),
				update: (p) =>
					updateModuleMutation.mutateAsync({
						moduleId: p.id,
						stageId: p.stageId,
						name: p.name,
						planStart: p.planStart,
						planEnd: p.planEnd,
						actualStart: p.actualStart,
						actualEnd: p.actualEnd,
					}),
			}}
		/>
	);
}

// ── Backward-compatible Aliases ──────────────────────────────────────────────

export function AddModule(props: Omit<ModuleModalProps, "module">) {
	return <ModuleModal {...props} module={null} />;
}

export function EditModule(props: ModuleModalProps) {
	return <ModuleModal {...props} />;
}
