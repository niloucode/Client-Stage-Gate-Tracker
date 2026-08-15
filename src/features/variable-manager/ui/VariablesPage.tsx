"use client";

import { useState, useMemo } from "react";
import { Search, Plus } from "lucide-react";
import { Back } from "@/components/ui/back";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { useCurrentUser } from "@/entities/profile";
import {
	useCreateVariable,
	useDeleteVariable,
	useProjectVariables,
	useToggleVariableVisibility,
	useUpdateVariable,
} from "@/entities/variable";
import type { VariableItem } from "@/entities/variable";
import type { VariableCreateInput } from "@/shared/schemas/variable";
import { VariablesTable } from "./VariablesTable";
import { VariableFormModal } from "./VariableFormModal";
import { VariableConfirmModal } from "./VariableConfirmModal";
import { VariableNotesModal } from "./VariableNotesModal";

function VariablesHeader() {
	return (
		<div className="mb-6">
			<h1 className="text-4xl font-bold tracking-wide text-foreground">
				Project Variables
			</h1>
			<p className="subtitle">
				Manage and share project passwords, credentials, and keys.
			</p>
		</div>
	);
}

interface VariablesToolbarProps {
	searchQuery: string;
	onSearchChange: (value: string) => void;
	onAddVariable: () => void;
	readOnly: boolean;
}

function VariablesToolbar({
	searchQuery,
	onSearchChange,
	onAddVariable,
	readOnly,
}: VariablesToolbarProps) {
	return (
		<div className="mb-5 flex gap-6 justify-between items-center max-h-10">
			<div className="flex w-187.25 items-center gap-2 rounded-md border border-border bg-neutral-surface px-4 py-2">
				<Search className="h-4 w-4 shrink-0 text-muted-foreground" />
				<Input
					type="text"
					placeholder="Search variables by name or value..."
					value={searchQuery}
					onChange={(e) => onSearchChange(e.target.value)}
					className="flex-1 bg-transparent border-none shadow-none focus-visible:ring-0"
				/>
			</div>
			{!readOnly && (
				<Button className="flex items-center gap-2" onClick={onAddVariable}>
					<Plus className="w-3.5 h-3.5" />
					Add Variable
				</Button>
			)}
		</div>
	);
}

type VariableSortField = "name" | "type" | "clientVisibility";
type SortDirection = "asc" | "desc";

export function VariablesPage({ projectId }: { projectId: string }) {
	const {
		data: variables = [],
		isPending,
		isError,
		refetch,
	} = useProjectVariables(projectId);
	const { data: profile } = useCurrentUser();
	const isClientProfile = Boolean(profile?.client_id);

	const createMutation = useCreateVariable(projectId);
	const updateMutation = useUpdateVariable(projectId);
	const toggleMutation = useToggleVariableVisibility(projectId);
	const deleteMutation = useDeleteVariable(projectId);

	const [searchQuery, setSearchQuery] = useState("");
	const [sortField, setSortField] = useState<VariableSortField>("name");
	const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

	// Modals state
	const [isFormOpen, setIsFormOpen] = useState(false);
	const [editingVariable, setEditingVariable] = useState<VariableItem | null>(null);
	const [notesVariable, setNotesVariable] = useState<VariableItem | null>(null);
	const [visibilityTarget, setVisibilityTarget] = useState<VariableItem | null>(null);
	const [deleteTarget, setDeleteTarget] = useState<VariableItem | null>(null);

	const filteredVariables = useMemo(() => {
		const q = searchQuery.toLowerCase().trim();
		if (!q) return variables;
		return variables.filter(
			(v) =>
				v.name.toLowerCase().includes(q) ||
				v.value.toLowerCase().includes(q) ||
				v.type.toLowerCase().includes(q)
		);
	}, [variables, searchQuery]);

	const sortedVariables = useMemo(() => {
		const sorted = [...filteredVariables];
		sorted.sort((a, b) => {
			let aVal: string | boolean = "";
			let bVal: string | boolean = "";

			switch (sortField) {
				case "name":
					aVal = a.name.toLowerCase();
					bVal = b.name.toLowerCase();
					break;
				case "type":
					aVal = a.type.toLowerCase();
					bVal = b.type.toLowerCase();
					break;
				case "clientVisibility":
					aVal = a.clientVisibility;
					bVal = b.clientVisibility;
					break;
			}
			if (aVal < bVal) return sortDirection === "asc" ? -1 : 1;
			if (aVal > bVal) return sortDirection === "asc" ? 1 : -1;
			return 0;
		});
		return sorted;
	}, [filteredVariables, sortField, sortDirection]);

	const handleSort = (field: VariableSortField) => {
		if (sortField === field) {
			setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
		} else {
			setSortField(field);
			setSortDirection("asc");
		}
	};

	/** Returns true only after the mutation succeeded — the modal closes itself. */
	const handleSaveVariable = async (data: VariableCreateInput): Promise<boolean> => {
		try {
			if (editingVariable) {
				await updateMutation.mutateAsync({
					variableId: editingVariable.id,
					input: data,
				});
				toast.add({
					title: "Variable Updated",
					description: `"${data.name}" has been updated.`,
					type: "success",
				});
			} else {
				await createMutation.mutateAsync(data);
				toast.add({
					title: "Variable Added",
					description: `"${data.name}" has been added.`,
					type: "success",
				});
			}
			setEditingVariable(null);
			return true;
		} catch (error) {
			toast.add({
				title: "Save Failed",
				description:
					error instanceof Error ? error.message : "Failed to save the variable.",
				type: "error",
			});
			return false;
		}
	};

	const handleConfirmToggleVisibility = async () => {
		if (!visibilityTarget) return;
		const nextState = !visibilityTarget.clientVisibility;
		try {
			await toggleMutation.mutateAsync(visibilityTarget.id);
			toast.add({
				title: nextState ? "Visible to Client" : "Hidden from Client",
				description: `"${visibilityTarget.name}" client visibility changed.`,
				type: "info",
			});
			setVisibilityTarget(null);
		} catch (error) {
			toast.add({
				title: "Visibility Change Failed",
				description:
					error instanceof Error
						? error.message
						: "Failed to change client visibility.",
				type: "error",
			});
		}
	};

	const handleConfirmDelete = async () => {
		if (!deleteTarget) return;
		try {
			await deleteMutation.mutateAsync(deleteTarget.id);
			toast.add({
				title: "Variable Deleted",
				description: `"${deleteTarget.name}" has been deleted.`,
				type: "delete",
			});
			setDeleteTarget(null);
		} catch (error) {
			toast.add({
				title: "Delete Failed",
				description:
					error instanceof Error ? error.message : "Failed to delete the variable.",
				type: "error",
			});
		}
	};

	if (isPending) {
		return (
			<main className="flex flex-1 flex-col space-y-4">
				<Back link={`/projects/${projectId}`} />
				<VariablesHeader />
				<div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
					Loading variables…
				</div>
			</main>
		);
	}

	if (isError) {
		return (
			<main className="flex flex-1 flex-col space-y-4">
				<Back link={`/projects/${projectId}`} />
				<VariablesHeader />
				<div className="flex h-64 flex-col items-center justify-center gap-3 text-sm text-muted-foreground">
					<p>Failed to load variables for this project.</p>
					<Button variant="outline" size="sm" onClick={() => void refetch()}>
						Retry
					</Button>
				</div>
			</main>
		);
	}

	return (
		<>
			<main className="flex flex-1 flex-col overflow-hidden space-y-4">
				<Back link={`/projects/${projectId}`} />

				<VariablesHeader />

				<VariablesToolbar
					searchQuery={searchQuery}
					onSearchChange={setSearchQuery}
					onAddVariable={() => {
						setEditingVariable(null);
						setIsFormOpen(true);
					}}
					readOnly={isClientProfile}
				/>

				<VariablesTable
					variables={sortedVariables}
					sortField={sortField}
					sortDirection={sortDirection}
					onSort={handleSort}
					onToggleVisibilityRequest={setVisibilityTarget}
					onViewNotes={setNotesVariable}
					onEdit={(v) => {
						setEditingVariable(v);
						setIsFormOpen(true);
					}}
					onDeleteRequest={setDeleteTarget}
					readOnly={isClientProfile}
				/>
			</main>

			{/* 1. Add / Edit Modal */}
			<VariableFormModal
				isOpen={isFormOpen}
				variable={editingVariable}
				onClose={() => {
					setIsFormOpen(false);
					setEditingVariable(null);
				}}
				onSubmit={handleSaveVariable}
			/>

			{/* 2. Client Visibility Toggle Confirmation Modal */}
			{visibilityTarget && (
				<VariableConfirmModal
					isOpen={Boolean(visibilityTarget)}
					title="Confirm Client Visibility Change"
					description={`You are about to change client visibility for "${visibilityTarget.name}". ${
						visibilityTarget.clientVisibility
							? "This will hide the variable from the client portal."
							: "This will make the variable and its client notes visible to your client."
					}`}
					confirmName={visibilityTarget.name}
					actionLabel={
						visibilityTarget.clientVisibility ? "Hide from Client" : "Make Visible"
					}
					onClose={() => setVisibilityTarget(null)}
					onConfirm={() => void handleConfirmToggleVisibility()}
				/>
			)}

			{/* 3. Delete Confirmation Modal */}
			{deleteTarget && (
				<VariableConfirmModal
					isOpen={Boolean(deleteTarget)}
					title="Delete Variable"
					description="This action cannot be undone. This variable will be permanently removed from this project."
					confirmName={deleteTarget.name}
					actionLabel="Delete Variable"
					variant="destructive"
					onClose={() => setDeleteTarget(null)}
					onConfirm={() => void handleConfirmDelete()}
				/>
			)}

			{/* 4. Notes Modal */}
			<VariableNotesModal
				isOpen={Boolean(notesVariable)}
				variable={notesVariable}
				clientView={isClientProfile}
				onClose={() => setNotesVariable(null)}
			/>
		</>
	);
}
