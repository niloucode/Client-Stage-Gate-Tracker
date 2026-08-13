"use client";

import type { ReactNode } from "react";
import { User, Pencil, ArrowUpDown, ChevronUp, ChevronDown, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Client, SortField, SortDirection } from "../model/types";

// ─── Table header ────────────────────────────────────────────────────────────

interface ClientTableHeaderProps {
	onSort: (field: SortField) => void;
	getSortIcon: (field: SortField) => ReactNode;
	// Only the Project Owner sees the invite-code column.
	showCodeColumn: boolean;
}

function ClientTableHeader({
	onSort,
	getSortIcon,
	showCodeColumn,
}: ClientTableHeaderProps) {
	const columns: { key: SortField; label: string; width: string }[] = [
		{ key: "name", label: "CLIENT NAME", width: "w-[22%]" },
		{ key: "tin", label: "TIN", width: "w-[14%]" },
		{ key: "email", label: "EMAIL", width: "w-[18%]" },
		{ key: "contactNumber", label: "CONTACT", width: "w-[15%]" },
		{ key: "billingAddress", label: "BILLING ADDRESS", width: "w-[12%]" },
	];

	return (
		<thead className="sticky top-0 z-10 border-b border-brand-100/50 bg-neutral-subtle text-[11px] font-normal uppercase text-muted-foreground">
			<tr>
				{columns.map((col) => (
					<th key={col.key} className={`${col.width} px-6 py-3`}>
						<button
							type="button"
							onClick={() => onSort(col.key)}
							className="flex items-center gap-1 text-[11px] font-normal uppercase text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
						>
							<span>{col.label}</span>
							{getSortIcon(col.key)}
						</button>
					</th>
				))}
				{showCodeColumn && (
					<th className="w-[10%] px-6 py-3 text-[11px] font-normal uppercase text-muted-foreground">
						COMPANY CODE
					</th>
				)}
				<th className="w-[8%] px-6 py-3 text-[11px] font-normal uppercase text-muted-foreground">
					ACTIONS
				</th>
			</tr>
		</thead>
	);
}

// ─── Row ─────────────────────────────────────────────────────────────────────

interface ClientRowProps {
	client: Client;
	onRegenerateCode: (client: Client) => void;
	onViewMembers: (client: Client) => void;
	onEdit: (client: Client) => void;
	// Owner-only columns: the invite-code cell and the edit pencil.
	showCodeColumn: boolean;
	showEditButton: boolean;
}

function ClientRow({
	client,
	onRegenerateCode,
	onViewMembers,
	onEdit,
	showCodeColumn,
	showEditButton,
}: ClientRowProps) {
	return (
		<tr className="transition-colors hover:bg-muted/50">
			<td className="px-6 py-3.5 align-middle text-[13px] font-normal text-foreground whitespace-pre-line">
				{client.name}
			</td>
			<td className="px-6 py-3.5 align-middle text-[13px] font-normal text-muted-foreground break-all">
				{client.tin}
			</td>
			<td className="px-6 py-3.5 align-middle text-[13px] font-normal text-muted-foreground break-all">
				{client.email}
			</td>
			<td className="px-6 py-3.5 align-middle text-[13px] font-normal text-muted-foreground break-all">
				{client.contactNumber}
			</td>
			<td className="px-6 py-3.5 align-middle text-[13px] font-normal text-muted-foreground whitespace-pre-line">
				{client.billingAddress}
			</td>
			{showCodeColumn && (
				<td className="px-6 py-3.5 align-middle">
					<div className="flex items-center gap-1">
						<span className="font-mono text-[13px] font-normal text-muted-foreground">
							{client.hasInviteCode ? "••••••" : "—"}
						</span>
						<Button
							variant="ghost"
							size="icon-sm"
							onClick={() => onRegenerateCode(client)}
							aria-label="Regenerate invite code"
							title="Regenerate invite code (the new code is shown once)"
							className="rounded-full"
						>
							<RefreshCw className="h-3 w-3" />
						</Button>
					</div>
				</td>
			)}
			<td className="px-6 py-3.5 align-middle">
				<div className="flex items-center gap-1">
					<Button
						variant="ghost"
						size="icon-sm"
						onClick={() => onViewMembers(client)}
						aria-label="View team members"
						className="rounded-full"
					>
						<User className="h-3 w-3" />
					</Button>
					{showEditButton && (
						<Button
							variant="ghost"
							size="icon-sm"
							onClick={() => onEdit(client)}
							aria-label="Edit client"
							className="rounded-full"
						>
							<Pencil className="h-3 w-3" />
						</Button>
					)}
				</div>
			</td>
		</tr>
	);
}

// ─── Table ───────────────────────────────────────────────────────────────────

export interface ClientsTableProps {
	clients: Client[];
	sortField: SortField;
	sortDirection: SortDirection;
	onSort: (field: SortField) => void;
	onRegenerateCode: (client: Client) => void;
	onViewMembers: (client: Client) => void;
	onEdit: (client: Client) => void;
	showCodeColumn: boolean;
	showEditButton: boolean;
}

export function ClientsTable({
	clients,
	sortField,
	sortDirection,
	onSort,
	onRegenerateCode,
	onViewMembers,
	onEdit,
	showCodeColumn,
	showEditButton,
}: ClientsTableProps) {
	const getSortIcon = (field: SortField) => {
		if (sortField !== field) {
			return <ArrowUpDown className="h-3 w-3 shrink-0 opacity-40 hover:opacity-100" />;
		}
		return sortDirection === "asc" ? (
			<ChevronUp className="h-3 w-3 shrink-0 text-brand-600" />
		) : (
			<ChevronDown className="h-3 w-3 shrink-0 text-brand-600" />
		);
	};

	return (
		<div className="flex flex-col overflow-hidden rounded-md border border-brand-100 bg-neutral-surface">
			<div className="max-h-[calc(60vh)] overflow-auto">
				<table className="w-full min-w-240 border-collapse text-left">
					<ClientTableHeader
						onSort={onSort}
						getSortIcon={getSortIcon}
						showCodeColumn={showCodeColumn}
					/>
					<tbody className="divide-y divide-brand-100/50 bg-neutral-surface">
						{clients.map((client) => (
							<ClientRow
								key={client.id}
								client={client}
								onRegenerateCode={onRegenerateCode}
								onViewMembers={onViewMembers}
								onEdit={onEdit}
								showCodeColumn={showCodeColumn}
								showEditButton={showEditButton}
							/>
						))}
					</tbody>
				</table>
			</div>
		</div>
	);
}
