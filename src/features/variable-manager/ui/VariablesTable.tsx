"use client";

import { useState, type ReactNode } from "react";
import {
	ArrowUpDown,
	ChevronUp,
	ChevronDown,
	Eye,
	EyeOff,
	Copy,
	Check,
	Link2,
	Key,
	Code2,
	FileText,
	Pencil,
	Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import type { VariableItem, VariableType } from "@/entities/variable";

export type VariableSortField = "name" | "type" | "clientVisibility";
export type SortDirection = "asc" | "desc";

function TypeBadge({ type }: { type: VariableType }) {
	if (type === "link") {
		return (
			<Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 hover:bg-emerald-100 gap-1.5 text-xs font-medium">
				<Link2 className="size-3" />
				<span>Link</span>
			</Badge>
		);
	}
	if (type === "credential") {
		return (
			<Badge className="bg-brand-100 text-brand-600 border-brand-200 hover:bg-brand-100 gap-1.5 text-xs font-medium">
				<Key className="size-3" />
				<span>Credential</span>
			</Badge>
		);
	}
	return (
		<Badge className="bg-amber-100 text-amber-900 border-amber-200 hover:bg-amber-100 gap-1.5 text-xs font-medium">
			<Code2 className="size-3" />
			<span>Repository</span>
		</Badge>
	);
}

function ValueCell({ value }: { value: string }) {
	const [revealed, setRevealed] = useState(false);
	const [copied, setCopied] = useState(false);

	const handleCopy = () => {
		if (!navigator.clipboard) return;
		navigator.clipboard
			.writeText(value)
			.then(() => {
				setCopied(true);
				toast.add({
					title: "Copied",
					description: "Value copied to clipboard.",
					type: "success",
				});
				setTimeout(() => setCopied(false), 2000);
			})
			.catch(() => {
				toast.add({
					title: "Copy Failed",
					description: "Clipboard access was denied.",
					type: "error",
				});
			});
	};

	const displayString = revealed
		? value.length > 32
			? `${value.slice(0, 32)}…`
			: value
		: "••••••••••••••••••••";

	return (
		<div className="flex items-center gap-2 min-w-0 max-w-sm">
			<span className="font-mono text-xs text-foreground truncate select-all">
				{displayString}
			</span>
			<div className="flex items-center gap-1 shrink-0">
				<Button
					type="button"
					variant="ghost"
					size="icon-xs"
					onClick={() => setRevealed((prev) => !prev)}
					title={revealed ? "Hide value" : "Reveal value"}
				>
					{revealed ? (
						<EyeOff className="size-3.5" />
					) : (
						<Eye className="size-3.5" />
					)}
				</Button>
				<Button
					type="button"
					variant="ghost"
					size="icon-xs"
					onClick={handleCopy}
					title="Copy to clipboard"
				>
					{copied ? (
						<Check className="size-3.5 text-emerald-600" />
					) : (
						<Copy className="size-3.5" />
					)}
				</Button>
			</div>
		</div>
	);
}

interface VariablesTableProps {
	variables: VariableItem[];
	sortField: VariableSortField;
	sortDirection: SortDirection;
	onSort: (field: VariableSortField) => void;
	onToggleVisibilityRequest: (variable: VariableItem) => void;
	onViewNotes: (variable: VariableItem) => void;
	onEdit: (variable: VariableItem) => void;
	onDeleteRequest: (variable: VariableItem) => void;
/**
 * Clients are read-only: no toggle/edit/delete (server-enforced too).
 * @returns The result.
 */
	readOnly?: boolean;
}

/**
 * Sortable variables table with visibility toggles and row actions.
 * @returns The result.
 */
export function VariablesTable({
	variables,
	sortField,
	sortDirection,
	onSort,
	onToggleVisibilityRequest,
	onViewNotes,
	onEdit,
	onDeleteRequest,
	readOnly = false,
}: VariablesTableProps) {
	const getSortIcon = (field: VariableSortField): ReactNode => {
		if (sortField !== field) {
			return (
				<ArrowUpDown className="h-3 w-3 shrink-0 opacity-40 hover:opacity-100" />
			);
		}
		return sortDirection === "asc" ? (
			<ChevronUp className="h-3 w-3 shrink-0 text-brand-600" />
		) : (
			<ChevronDown className="h-3 w-3 shrink-0 text-brand-600" />
		);
	};

	return (
		<div className="flex flex-col overflow-hidden rounded-md border border-brand-100 bg-neutral-surface">
			<div className="max-h-[calc(65vh)] overflow-auto">
				<table className="w-full min-w-240 border-collapse text-left">
					<thead className="sticky top-0 z-10 border-b border-brand-100/50 bg-neutral-subtle text-[11px] font-normal uppercase text-muted-foreground">
						<tr>
							{/* 1. Variable Name (Sortable) */}
							<th className="w-[24%] px-6 py-3">
								<button
									type="button"
									onClick={() => onSort("name")}
									className="flex items-center gap-1 text-[11px] font-normal uppercase text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
								>
									<span>VARIABLE NAME</span>
									{getSortIcon("name")}
								</button>
							</th>

							{/* 2. Type (Sortable) */}
							<th className="w-[16%] px-6 py-3">
								<button
									type="button"
									onClick={() => onSort("type")}
									className="flex items-center gap-1 text-[11px] font-normal uppercase text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
								>
									<span>TYPE</span>
									{getSortIcon("type")}
								</button>
							</th>

							{/* 3. Value / Address (Non-Sortable) */}
							<th className="w-[30%] px-6 py-3 text-[11px] font-normal uppercase text-muted-foreground">
								VALUE / ADDRESS
							</th>

							{/* 4. Client Visibility (Sortable) */}
							<th className="w-[16%] px-6 py-3">
								<button
									type="button"
									onClick={() => onSort("clientVisibility")}
									className="flex items-center gap-1 text-[11px] font-normal uppercase text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
								>
									<span>CLIENT VISIBILITY</span>
									{getSortIcon("clientVisibility")}
								</button>
							</th>

							{/* 5. Actions (Non-Sortable) */}
							<th className="w-[14%] px-6 py-3 text-[11px] font-normal uppercase text-muted-foreground">
								ACTIONS
							</th>
						</tr>
					</thead>

					<tbody className="divide-y divide-brand-100/50 bg-neutral-surface">
						{variables.length === 0 ? (
							<tr>
								<td
									colSpan={5}
									className="py-12 text-center text-sm text-muted-foreground"
								>
									No variables found.
								</td>
							</tr>
						) : (
							variables.map((v) => (
								<tr key={v.id} className="transition-colors hover:bg-muted/50">
									{/* Variable Name */}
									<td className="px-6 py-3.5 align-middle text-[13px] text-foreground truncate max-w-xs">
										{v.name}
									</td>

									{/* Type Badge */}
									<td className="px-6 py-3.5 align-middle">
										<TypeBadge type={v.type} />
									</td>

									{/* Value with Eye and Copy */}
									<td className="px-6 py-3.5 align-middle">
										<ValueCell value={v.value} />
									</td>

									{/* Client Visibility Toggle */}
									<td className="px-6 py-3.5 align-middle">
										<button
											type="button"
											role="switch"
											aria-checked={v.clientVisibility}
											aria-label={`Client visibility for ${v.name}`}
											disabled={readOnly}
											onClick={() => onToggleVisibilityRequest(v)}
											className={cn(
												"relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600",
												v.clientVisibility
													? "bg-brand-600"
													: "bg-neutral-border/40",
												readOnly && "cursor-default opacity-70",
											)}
										>
											<span
												className={cn(
													"pointer-events-none inline-block size-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out",
													v.clientVisibility
														? "translate-x-4"
														: "translate-x-0",
												)}
											/>
										</button>
									</td>

									{/* Action Buttons: Notes, Edit, Delete */}
									<td className="px-6 py-3.5 align-middle">
										<div className="flex items-center gap-1">
											<Button
												variant="ghost"
												size="icon-sm"
												onClick={() => onViewNotes(v)}
												title="View Notes"
												className="rounded-full"
											>
												<FileText className="h-3.5 w-3.5" />
											</Button>
											{!readOnly && (
												<>
													<Button
														variant="ghost"
														size="icon-sm"
														onClick={() => onEdit(v)}
														title="Edit Variable"
														className="rounded-full"
													>
														<Pencil className="h-3.5 w-3.5" />
													</Button>
													<Button
														variant="ghost"
														size="icon-sm"
														onClick={() => onDeleteRequest(v)}
														title="Delete Variable"
														className="rounded-full text-destructive hover:text-destructive hover:bg-red-50"
													>
														<Trash2 className="h-3.5 w-3.5" />
													</Button>
												</>
											)}
										</div>
									</td>
								</tr>
							))
						)}
					</tbody>
				</table>
			</div>
		</div>
	);
}
