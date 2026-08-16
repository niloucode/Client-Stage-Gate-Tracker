"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useClients, regenerateClientInviteCode } from "@/entities/client";
import { useDepartment } from "@/entities/department";
import { useAuth } from "@/features/auth";
import { ClientsTable } from "./ClientsTable";
import type { Client, SortField, SortDirection } from "../model/types";
import ClientFormModal from "./ClientFormModal";
import ViewTeamMembersModal from "./ViewTeamMembersModal";
import { ClientCodeModal } from "./ClientCodeModal";

// ─── Page chrome ─────────────────────────────────────────────────────────────

function ClientHeader() {
	return (
		<div className="mb-6">
			<h1 className="text-4xl font-bold tracking-wide text-foreground">
				Clients
			</h1>
			<p className="subtitle">View the clients your company is working with.</p>
		</div>
	);
}

interface ClientToolbarProps {
	searchQuery: string;
	onSearchChange: (value: string) => void;
	onAddClient: () => void;
	// Only the Project Owner can create clients.
	showAddButton: boolean;
}

function ClientToolbar({
	searchQuery,
	onSearchChange,
	onAddClient,
	showAddButton,
}: ClientToolbarProps) {
	return (
		<div className="mb-5 flex gap-6 justify-between items-center max-h-10">
			<div className="flex w-187.25 items-center gap-2 rounded-md border border-border bg-neutral-surface px-4 py-2">
				<Search className="h-4 w-4 shrink-0 text-muted-foreground" />
				<Input
					type="text"
					placeholder="Search for client name..."
					value={searchQuery}
					onChange={(e) => onSearchChange(e.target.value)}
					className="flex-1 bg-transparent border-none shadow-none focus-visible:ring-0"
				/>
			</div>
			{showAddButton && (
				<Button className="flex items-center gap-3" onClick={onAddClient}>
					<Plus size={14} strokeWidth={3} />
					Add Client
				</Button>
			)}
		</div>
	);
}

// ─── Main Component ─────────────────────────────────────────────────────────

/**
 * Clients registry (features layer — the app page only composes this).
 * Role visibility: Project Owner sees everything (add/edit/company code);
 * Project Team sees the list + members only; client profiles are redirected
 * away and never fetch the list.
 */
export function ClientsPage() {
	const router = useRouter();
	const { user, isLoading: isAuthLoading } = useAuth();
	const isClient = !!user?.client_id;
	const { data: department } = useDepartment(user?.department_id ?? undefined);
	const isOwner = department?.name === "Project Owner";

	const { data: clientsData, refetch } = useClients({ enabled: !isClient });

	const [showAddModal, setShowAddModal] = useState(false);
	const [viewMembersClient, setViewMembersClient] = useState<Client | null>(
		null,
	);
	const [editClient, setEditClient] = useState<Client | null>(null);
	const [searchQuery, setSearchQuery] = useState("");
	const [sortField, setSortField] = useState<SortField>("name");
	const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

	// Regenerate-invite-code flow: the new code is shown exactly once.
	const [isRegenerateOpen, setIsRegenerateOpen] = useState(false);
	const [regenerateClient, setRegenerateClient] = useState<Client | null>(null);
	const [newInviteCode, setNewInviteCode] = useState<string | null>(null);
	const [regenerateError, setRegenerateError] = useState<string | null>(null);
	const [isRegenerating, setIsRegenerating] = useState(false);

	// Client profiles have no access to the clients page.
	useEffect(() => {
		if (!isAuthLoading && isClient) {
			router.replace("/dashboard");
		}
	}, [isAuthLoading, isClient, router]);

	// All hooks must run before the early return below (Rules of Hooks) —
	// only plain computations and handlers come after it.
	const clients: Client[] = (clientsData ?? []).map((c) => ({
		id: c.client_id,
		name: c.client_name,
		email: c.email ?? "",
		contactNumber: c.phone ?? "",
		billingAddress: c.billing_address,
		hasInviteCode: c.has_invite_code,
		tin: c.tin,
		profiles: c.Profiles,
	}));

	const filteredClients = useMemo(
		() =>
			clients.filter((c) =>
				c.name.toLowerCase().includes(searchQuery.toLowerCase()),
			),
		[clients, searchQuery],
	);

	const sortedClients = useMemo(() => {
		const sorted = [...filteredClients];
		sorted.sort((a, b) => {
			let aVal: string = "";
			let bVal: string = "";
			switch (sortField) {
				case "name":
					aVal = a.name.toLowerCase();
					bVal = b.name.toLowerCase();
					break;
				case "tin":
					aVal = a.tin.toLowerCase();
					bVal = b.tin.toLowerCase();
					break;
				case "email":
					aVal = a.email.toLowerCase();
					bVal = b.email.toLowerCase();
					break;
				case "contactNumber":
					aVal = a.contactNumber.toLowerCase();
					bVal = b.contactNumber.toLowerCase();
					break;
				case "billingAddress":
					aVal = a.billingAddress.toLowerCase();
					bVal = b.billingAddress.toLowerCase();
					break;
				default:
					return 0;
			}
			if (aVal < bVal) return sortDirection === "asc" ? -1 : 1;
			if (aVal > bVal) return sortDirection === "asc" ? 1 : -1;
			return 0;
		});
		return sorted;
	}, [filteredClients, sortField, sortDirection]);

	// Client profiles never render the page — redirected in the effect above.
	if (isAuthLoading || isClient) return null;

	const handleRegenerateCode = async (client: Client) => {
		setRegenerateClient(client);
		setNewInviteCode(null);
		setRegenerateError(null);
		setIsRegenerating(true);
		setIsRegenerateOpen(true);
		const result = await regenerateClientInviteCode(client.id);
		setIsRegenerating(false);
		if (!result.success) {
			setRegenerateError(result.error);
			return;
		}
		if (result.inviteCode) {
			setNewInviteCode(result.inviteCode);
			void refetch();
		}
	};

	const handleSort = (field: SortField) => {
		if (sortField === field) {
			setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
		} else {
			setSortField(field);
			setSortDirection("asc");
		}
	};

	return (
		<>
			<main className="flex flex-1 flex-col overflow-hidden">
				<ClientHeader />

				<ClientToolbar
					searchQuery={searchQuery}
					onSearchChange={setSearchQuery}
					onAddClient={() => setShowAddModal(true)}
					showAddButton={isOwner}
				/>

				<ClientsTable
					clients={sortedClients}
					sortField={sortField}
					sortDirection={sortDirection}
					onSort={handleSort}
					onRegenerateCode={handleRegenerateCode}
					onViewMembers={setViewMembersClient}
					onEdit={setEditClient}
					showCodeColumn={isOwner}
					showEditButton={isOwner}
				/>
			</main>

			{isOwner && (
				<ClientFormModal
					isOpen={showAddModal}
					onClose={() => {
						setShowAddModal(false);
						void refetch();
					}}
				/>
			)}

			<ViewTeamMembersModal
				isOpen={viewMembersClient !== null}
				members={viewMembersClient?.profiles?.map((p) => ({
					id: p.profile_id,
					firstName: p.first_name,
					lastName: p.last_name,
					email: p.email,
					phone: p.phone,
				}))}
				onClose={() => setViewMembersClient(null)}
			/>

			{isOwner && (
				<ClientFormModal
					isOpen={editClient !== null}
					clientId={editClient?.id}
					initialData={{
						clientName: editClient?.name,
						tin: editClient?.tin,
						email: editClient?.email,
						contactNumber: editClient?.contactNumber,
						billingAddress: editClient?.billingAddress,
					}}
					onClose={() => {
						setEditClient(null);
						void refetch();
					}}
				/>
			)}

			<ClientCodeModal
				isOpen={isRegenerateOpen}
				onClose={() => setIsRegenerateOpen(false)}
				clientName={regenerateClient?.name}
				newInviteCode={newInviteCode}
				isRegenerating={isRegenerating}
				error={regenerateError}
			/>
		</>
	);
}
