"use client";

import { useState } from "react";
import {
	Search,
	User,
	Pencil,
	Eye,
	EyeOff,
	Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useClients } from "@/entities/client";
import ClientFormModal from "@/features/client-manager/ui/ClientFormModal";
import ViewTeamMembersModal from "@/features/client-manager/ui/ViewTeamMembersModal";


interface Client {
	id: string;
	name: string;
	email: string;
	contactNumber: string;
	billingAddress: string;
	companyCode: string;
	tin: string;
	profiles?: { profile_id: string; first_name: string; last_name: string; email: string; phone: string | null }[];
}

export default function ClientPage() {
	const { data: clientsData, refetch } = useClients()
		// Live data only (Task 5.8) — no hardcoded placeholder rows; show an
		// empty state until the query returns real clients.
		const clients: Client[] = (clientsData ?? []).map((c) => ({
			id: c.client_id,
			name: c.client_name,
			email: c.email ?? "",
			contactNumber: c.phone ?? "",
			billingAddress: c.billing_address,
			companyCode: "",
			tin: c.tin,
			profiles: c.Profiles,
		}));
	const [showAddModal, setShowAddModal] = useState(false);
	const [viewMembersClient, setViewMembersClient] = useState<Client | null>(null);
	const [editClient, setEditClient] = useState<Client | null>(null);
	const [searchQuery, setSearchQuery] = useState("");
	const [visibleCodes, setVisibleCodes] = useState<Record<string, boolean>>({});
	const toggleCode = (id: string) =>
		setVisibleCodes((prev) => ({ ...prev, [id]: !prev[id] }));
	const filteredClients = clients.filter((c) =>
		c.name.toLowerCase().includes(searchQuery.toLowerCase())
	);

	return (
		<>
			<main className="flex flex-1 flex-col overflow-hidden">
				<div className="mb-6">
					<h1 className="text-4xl font-bold tracking-wide text-foreground">
						Client List
					</h1>
					<p className="mt-1 text-base text-muted-foreground">
						View the clients your company is working with.
					</p>
				</div>

				<div className="mb-5 flex justify-between items-center max-h-10">
					<div className="flex w-[749px] items-center gap-2 rounded-full border border-border bg-neutral-surface px-4 py-2">
						<Search className="h-[18px] w-[18px] shrink-0 text-muted-foreground" />
						<Input
							type="text"
							placeholder="Search for client name..."
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							className="flex-1 bg-transparent border-none shadow-none focus-visible:ring-0"
						/>
					</div>
					<Button className="flex items-center gap-3" onClick={() => setShowAddModal(true)}>
						<Plus size={14} strokeWidth={3} />
						Add Client
					</Button>
				</div>

				{/* Table */}
				<div className="flex flex-1 flex-col overflow-hidden rounded-2xl border border-border bg-neutral-surface">
					<div className="client-scroll max-h-[calc(60vh)] flex-1 overflow-auto">
						<div className="flex flex-col">
							{/* Table header (sticky top) */}
							<div
								className="sticky top-0 z-10 grid shrink-0 gap-x-3 items-center px-6 py-3 text-[11px] font-bold text-muted-foreground border-b border-border"
								style={{
									gridTemplateColumns: "226px 198px 1fr 1fr 1fr 113px 141px",
									backgroundColor: "neutral-subtle",
								}}
							>
								<span>CLIENT NAME</span>
								<span>TIN</span>
								<span>EMAIL</span>
								<span>CONTACT</span>
								<span>BILLING ADDRESS</span>
								<span>COMPANY CODE</span>
								<span>ACTIONS</span>
							</div>

							{/* Rows */}
							<div className="flex flex-col">
								{filteredClients.map((client, i) => (
									<div
										key={client.id}
										className="grid items-center gap-3 px-6 py-5 transition-colors hover:bg-muted/50"
										style={{
											gridTemplateColumns: "226px 198px 1fr 1fr 1fr 113px 141px",
											borderBottom: i < clients.length - 1 ? "1px solid hsl(var(--border))" : "none",
										}}
									>
										{/* Client Name */}
										<span className="whitespace-pre-line text-base font-bold text-foreground">
											{client.name}
										</span>

										{/* TIN */}
										<span className="text-base text-foreground">
											{client.tin}
										</span>

										{/* Email */}
										<span className="truncate text-base text-muted-foreground">
											{client.email}
										</span>

										{/* Contact */}
										<span className="text-base text-muted-foreground">
											{client.contactNumber}
										</span>

										{/* Billing Address */}
										<span className="whitespace-pre-line text-base text-muted-foreground">
											{client.billingAddress}
										</span>

										{/* Company Code */}
										<div className="flex items-center gap-2">
											<span className="text-base text-muted-foreground">
												{visibleCodes[client.id]
													? client.companyCode
													: "••••••"}
											</span>
											<Button
												variant="ghost"
												size="icon-sm"
												onClick={() => toggleCode(client.id)}
												aria-label={visibleCodes[client.id] ? "Hide code" : "Show code"}
												className="ml-auto mr-8"
											>
												{visibleCodes[client.id] ? (
													<Eye className="h-4 w-4" />
												) : (
													<EyeOff className="h-4 w-4" />
												)}
											</Button>
										</div>

										{/* Actions */}
										<div className="flex items-center gap-3">
											<Button
												variant="ghost"
												size="icon-sm"
												onClick={() => setViewMembersClient(client)}
												aria-label="View team members"
												className="rounded-full"
											>
												<User className="h-4 w-4" />
											</Button>
											<Button
												variant="ghost"
												size="icon-sm"
												onClick={() => setEditClient(client)}
												aria-label="Edit client"
												className="rounded-full"
											>
												<Pencil className="h-4 w-4" />
											</Button>
										</div>
									</div>
								))}
							</div>
						</div>
					</div>
				</div>
			</main>
			<ClientFormModal
				isOpen={showAddModal}
				onClose={() => {
					setShowAddModal(false);
					void refetch();
				}}
			/>
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
		</>
	);
}
