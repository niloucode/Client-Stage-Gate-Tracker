"use client";

import { useState, useMemo } from "react";
import { Search, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { INITIAL_VARIABLES } from "../model/mockData";
import { VariablesTable } from "./VariablesTable";
import { VariableFormModal } from "./VariableFormModal";
import { VariableConfirmModal } from "./VariableConfirmModal";
import { VariableNotesModal } from "./VariableNotesModal";
import type {
	VariableItem,
	VariableFormData,
	VariableSortField,
	SortDirection,
} from "../model/types";

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
}

function VariablesToolbar({
	searchQuery,
	onSearchChange,
	onAddVariable,
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
			<Button className="flex items-center gap-2" onClick={onAddVariable}>
				<Plus className="w-3.5 h-3.5" />
				Add Variable
			</Button>
		</div>
	);
}

export function VariablesPage() {
	const [variables, setVariables] = useState<VariableItem[]>(INITIAL_VARIABLES);
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

	const handleSaveVariable = (data: VariableFormData) => {
		if (editingVariable) {
			setVariables((prev) =>
				prev.map((v) =>
					v.id === editingVariable.id ? { ...v, ...data } : v
				)
			);
			toast.add({
				title: "Variable Updated",
				description: `"${data.name}" has been updated.`,
				type: "success",
			});
		} else {
			const newVar: VariableItem = {
				id: `var-${Date.now()}`,
				...data,
				clientVisibility: false,
				createdAt: new Date().toISOString().split("T")[0],
			};
			setVariables((prev) => [newVar, ...prev]);
			toast.add({
				title: "Variable Added",
				description: `"${data.name}" has been added.`,
				type: "success",
			});
		}
		setEditingVariable(null);
	};

	const handleConfirmToggleVisibility = () => {
		if (!visibilityTarget) return;
		const nextState = !visibilityTarget.clientVisibility;

		setVariables((prev) =>
			prev.map((v) =>
				v.id === visibilityTarget.id
					? { ...v, clientVisibility: nextState }
					: v
			)
		);

		toast.add({
			title: nextState ? "Visible to Client" : "Hidden from Client",
			description: `"${visibilityTarget.name}" client visibility changed.`,
			type: "info",
		});
		setVisibilityTarget(null);
	};

	const handleConfirmDelete = () => {
		if (!deleteTarget) return;

		setVariables((prev) => prev.filter((v) => v.id !== deleteTarget.id));
		toast.add({
			title: "Variable Deleted",
			description: `"${deleteTarget.name}" has been deleted.`,
			type: "delete",
		});
		setDeleteTarget(null);
	};

	return (
		<>
			<main className="flex flex-1 flex-col overflow-hidden">
				<VariablesHeader />

				<VariablesToolbar
					searchQuery={searchQuery}
					onSearchChange={setSearchQuery}
					onAddVariable={() => {
						setEditingVariable(null);
						setIsFormOpen(true);
					}}
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
					onConfirm={handleConfirmToggleVisibility}
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
					onConfirm={handleConfirmDelete}
				/>
			)}

			{/* 4. Notes Modal */}
			<VariableNotesModal
				isOpen={Boolean(notesVariable)}
				variable={notesVariable}
				onClose={() => setNotesVariable(null)}
			/>
		</>
	);
}