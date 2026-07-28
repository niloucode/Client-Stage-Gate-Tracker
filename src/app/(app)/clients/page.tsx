"use client";

import { useState } from "react";
import {
	Search,
	User,
	Pencil,
	Eye,
	EyeOff,
	ChevronRight,
	LayoutDashboard,
	FolderKanban,
	Users,
	Plus,
} from "lucide-react";
import { Button } from "@/shared/ui/button";

interface Client {
	id: string;
	name: string;
	email: string;
	contactNumber: string;
	billingAddress: string;
	companyCode: string;
	tin: string;
}

interface ClientListProps {
	clients?: Client[];
	onViewMembers?: (client: Client) => void;
	onEditClient?: (client: Client) => void;
}

const PLACEHOLDER_CLIENTS: Client[] = Array.from({ length: 10 }, (_, i) => ({
	id: String(i + 1),
	name: "Client Name\nInput Over Flow",
	email: "Email input. Will not overflow",
	contactNumber: "Contact Number Here",
	billingAddress: "Billing Address Input\nWill Overflow like this",
	companyCode: "6DIGIT",
	tin: "TIN INPUT",
}));

const NAV_LINKS = [
	{ label: "Dashboard", icon: LayoutDashboard },
	{ label: "Projects", icon: FolderKanban },
	{ label: "Clients", icon: Users },
];

export default function ClientPage({
	clients = PLACEHOLDER_CLIENTS,
	onViewMembers,
	onEditClient,
}: ClientListProps) {
	// All codes hidden by default for Product Team
	const [visibleCodes, setVisibleCodes] = useState<Record<string, boolean>>({});
	const toggleCode = (id: string) =>
		setVisibleCodes((prev) => ({ ...prev, [id]: !prev[id] }));

	return (
		<>
			<main className="flex flex-1 flex-col overflow-hidden">
				<div className="mb-6">
					<h1
						className="text-4xl font-bold tracking-wide text-foreground">
						Client List
					</h1>
					<p className="mt-1 text-base text-neutral-border">
						View the clients your company is working with.
					</p>
				</div>

				<div className="mb-5 flex justify-between items-center max-h-10">
				{/* Search only — no Add Client for Product Team */}
					<div
						className="flex w-[749px] items-center gap-2 rounded-full bg-neutral-surface px-4 py-2"
						style={{ border: "1px solid #c7c4d8" }}
					>
						<Search
							className="h-[18px] w-[18px] shrink-0"
							style={{ color: "#777587" }}
						/>
						<input
							type="text"
							placeholder="Search for client name..."
							className="flex-1 bg-transparent text-base outline-none"
							style={{ color: "#151c27" }}
						/>
					</div>
					<Button className="max-w-35 flex justify-center items-center gap-3">
						<Plus size={14} strokeWidth={3}></Plus>
						Add Client
					</Button>
				</div>
				{/* Table */}
				<div
					className="flex flex-1 flex-col overflow-hidden rounded-2xl bg-neutral-surface"
					style={{ border: "1px solid #c7c4d8" }}
				>
					{/* Unified scroll area for both X & Y axes */}
					<div className="client-scroll max-h-[calc(60vh)] flex-1 overflow-auto">
						<div className="flex flex-col">
							{/* Table header (sticky top) */}
							<div
								className="sticky top-0 z-10 grid shrink-0 items-center px-6 py-3 text-[11px] font-bold"
								style={{
									gridTemplateColumns:
										"226px 198px 1fr 1fr 1fr 113px 141px",
									backgroundColor: "#f8f9ff", // Solid color so rows don't show through on vertical scroll
									borderBottom: "1px solid #c7c4d8",
									color: "#777587",
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
								{clients.map((client, i) => (
									<div
										key={client.id}
										className="grid items-center px-6 py-5 transition-colors hover:bg-gray-50"
										style={{
											gridTemplateColumns:
												"226px 198px 1fr 1fr 1fr 113px 141px",
											borderBottom:
												i < clients.length - 1
													? "1px solid #c7c4d8"
													: "none",
										}}
									>
										{/* Client Name */}
										<span
											className="neutral-surfacespace-pre-line text-base font-bold"
											style={{ color: "#151c27" }}
										>
											{client.name}
										</span>

										{/* TIN */}
										<span
											className="text-base"
											style={{ color: "#151c27" }}
										>
											{client.tin}
										</span>

										{/* Email */}
										<span
											className="truncate text-base"
											style={{ color: "#464555" }}
										>
											{client.email}
										</span>

										{/* Contact */}
										<span
											className="text-base"
											style={{ color: "#464555" }}
										>
											{client.contactNumber}
										</span>

										{/* Billing Address */}
										<span
											className="neutral-surfacespace-pre-line text-base"
											style={{ color: "#464555" }}
										>
											{client.billingAddress}
										</span>

										{/* Company Code */}
										<div className="flex items-center gap-2">
											<span
												className="text-base"
												style={{ color: "#464555" }}
											>
												{visibleCodes[client.id]
													? client.companyCode
													: "••••••"}
											</span>
											<button
												onClick={() => toggleCode(client.id)}
												className="ml-auto mr-8 flex items-center justify-center rounded p-0.5 transition-colors hover:bg-gray-100"
												aria-label={
													visibleCodes[client.id]
														? "Hide code"
														: "Show code"
												}
											>
												{visibleCodes[client.id] ? (
													<Eye
														className="h-4 w-4"
														style={{ color: "#1e1e1e" }}
													/>
												) : (
													<EyeOff
														className="h-4 w-4"
														style={{ color: "#464555" }}
													/>
												)}
											</button>
										</div>

										{/* Actions */}
										<div className="flex items-center gap-3">
											<button
												onClick={() => onViewMembers?.(client)}
												className="flex h-7 w-7 items-center justify-center rounded-full transition-colors hover:bg-gray-100"
												aria-label="View team members"
											>
												<User className="h-4 w-4 text-black" />
											</button>
											<button
												onClick={() => onEditClient?.(client)}
												className="flex h-7 w-7 items-center justify-center rounded-full transition-colors hover:bg-gray-100"
												aria-label="Edit client"
											>
												<Pencil className="h-4 w-4 text-black" />
											</button>
										</div>
									</div>
								))}
							</div>
						</div>
					</div>
				</div>
			</main>
		</>
	);
}
