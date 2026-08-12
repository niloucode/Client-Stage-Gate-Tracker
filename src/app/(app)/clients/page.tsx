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
	const { data: clientsData, refetch } = useClients();

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

				<div className="mb-5 flex gap-6 justify-between items-center max-h-10">
					<div className="flex w-[749px] items-center gap-2 rounded-lg border border-border bg-neutral-surface px-4 py-2">
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
				<div className="flex flex-col overflow-hidden rounded-2xl border border-brand-100 bg-neutral-surface">
					<div className="max-h-[calc(60vh)] overflow-auto">
						<table className="w-full min-w-[960px] border-collapse text-left">
							{/* Sticky Header */}
							<thead className="sticky top-0 z-10 border-b border-border bg-neutral-subtle text-[11px] font-bold text-muted-foreground uppercase">
								<tr>
									<th className="w-[22%] px-6 py-3">CLIENT NAME</th>
									<th className="w-[14%] px-6 py-3">TIN</th>
									<th className="w-[18%] px-6 py-3">EMAIL</th>
									<th className="w-[15%] px-6 py-3">CONTACT</th>
									<th className="w-[12%] px-6 py-3">BILLING ADDRESS</th>
									<th className="w-[10%] px-6 py-3">COMPANY CODE</th>
									<th className="w-[8%] px-6 py-3">ACTIONS</th>
								</tr>
							</thead>

							{/* Rows */}
							<tbody className="divide-y divide-border">
								{filteredClients.map((client) => {
									const isCodeVisible = visibleCodes[client.id];

									return (
										<tr
											key={client.id}
											className="transition-colors hover:bg-muted/50"
										>
											{/* Client Name */}
											<td className="px-6 py-5 align-middle text-base font-bold text-foreground whitespace-pre-line">
												{client.name}
											</td>

											{/* TIN */}
											<td className="px-6 py-5 align-middle text-base text-foreground break-all">
												{client.tin}
											</td>

											{/* Email */}
											<td className="px-6 py-5 align-middle text-base text-muted-foreground break-all">
												{client.email}
											</td>

											{/* Contact */}
											<td className="px-6 py-5 align-middle text-base text-muted-foreground break-all">
												{client.contactNumber}
											</td>

											{/* Billing Address */}
											<td className="px-6 py-5 align-middle text-base text-muted-foreground whitespace-pre-line">
												{client.billingAddress}
											</td>

											{/* Company Code */}
											<td className="px-6 py-5 align-middle">
												<div className="flex items-center gap-1">
													<span className="font-mono text-base text-muted-foreground">
														{isCodeVisible ? client.companyCode : "••••••"}
													</span>
													<Button
														variant="ghost"
														size="icon-sm"
														onClick={() => toggleCode(client.id)}
														aria-label={isCodeVisible ? "Hide code" : "Show code"}
													>
														{isCodeVisible ? (
															<EyeOff className="h-4 w-4" />
														) : (
															<Eye className="h-4 w-4" />
														)}
													</Button>
												</div>
											</td>

											{/* Actions */}
											<td className="px-6 py-5 align-middle">
												<div className="flex items-center gap-1">
													<Button
														variant="ghost"
														size="icon-sm"
														onClick={() => setViewMembersClient(client)}
														aria-label="View team members"
														className="rounded-full"
													>
														<User className="h-3 w-3" />
													</Button>
													<Button
														variant="ghost"
														size="icon-sm"
														onClick={() => setEditClient(client)}
														aria-label="Edit client"
														className="rounded-full"
													>
														<Pencil className="h-3 w-3" />
													</Button>
												</div>
											</td>
										</tr>
									);
								})}
							</tbody>
						</table>
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