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
} from "lucide-react";

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
	onAddClient?: () => void;
	onViewMembers?: (client: Client) => void;
	onEditClient?: (client: Client) => void;
}

const PLACEHOLDER_CLIENTS: Client[] = Array.from({ length: 5 }, (_, i) => ({
	id: String(i + 1),
	name: "Client Name\nInput Over Flow",
	email: "Email input. Will not overflow",
	contactNumber: "Contact Number Here",
	billingAddress: "Billing Address Input\nWill Overflow like this",
	companyCode: i === 0 ? "6DIGIT" : "6DIGIT",
	tin: "TIN INPUT",
}));

const NAV_LINKS = [
	{ label: "Dashboard", icon: LayoutDashboard },
	{ label: "Projects", icon: FolderKanban },
	{ label: "Clients", icon: Users },
];

export default function ClientList({
	clients = PLACEHOLDER_CLIENTS,
	onAddClient,
	onViewMembers,
	onEditClient,
}: ClientListProps) {
	// Per-row code visibility
	const [visibleCodes, setVisibleCodes] = useState<Record<string, boolean>>({
		"1": true,
	});
	const toggleCode = (id: string) =>
		setVisibleCodes((prev) => ({ ...prev, [id]: !prev[id] }));

	return (
		<>
			<style>{`
        .client-scroll::-webkit-scrollbar { width: 6px; height: 6px; }
        .client-scroll::-webkit-scrollbar-track { background: #f1f0f8; border-radius: 9999px; }
        .client-scroll::-webkit-scrollbar-thumb { background: #c7c4d8; border-radius: 9999px; }
        .client-scroll::-webkit-scrollbar-thumb:hover { background: #9c99b8; }
      `}</style>

			<div className="flex h-screen w-full overflow-hidden bg-white">
				{/* Sidebar */}
				<aside
					className="flex w-[200px] shrink-0 flex-col bg-white"
					style={{ borderRight: "1px solid #c7c4d8" }}
				>
					{/* Logo */}
					<div className="flex items-center gap-3 px-4 py-5">
						<div
							className="flex h-8 w-8 items-center justify-center rounded"
							style={{ backgroundColor: "#dce2f3" }}
						>
							<span className="text-xs font-bold" style={{ color: "#151c27" }}>
								A
							</span>
						</div>
						<div className="flex flex-col">
							<span
								className="text-base font-bold"
								style={{ color: "#151c27" }}
							>
								Asceoft
							</span>
							<span
								className="text-[11px] font-medium"
								style={{ color: "#464555" }}
							>
								STUDIO PORTAL
							</span>
						</div>
					</div>

					{/* Nav */}
					<nav className="flex flex-col gap-1 px-2 pt-2">
						{NAV_LINKS.map(({ label, icon: Icon }) => {
							const isActive = label === "Clients";
							return (
								<div
									key={label}
									className="relative flex cursor-pointer items-center gap-3 rounded px-3 py-2 transition-colors hover:bg-gray-50"
								>
									{isActive && (
										<span
											className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r"
											style={{ backgroundColor: "#3525cd" }}
										/>
									)}
									<Icon
										className="h-[18px] w-[18px]"
										style={{ color: isActive ? "#151c27" : "#464555" }}
									/>
									<span
										className="text-[13px]"
										style={{ color: isActive ? "#151c27" : "#464555" }}
									>
										{label}
									</span>
								</div>
							);
						})}
					</nav>
				</aside>

				{/* Main */}
				<div className="flex flex-1 flex-col overflow-hidden">
					{/* Top nav */}
					<header
						className="flex h-[57px] shrink-0 items-center justify-between px-6"
						style={{
							backgroundColor: "#ffffff",
							borderBottom: "1px solid #c7c4d8",
						}}
					>
						<div className="flex items-center gap-1 text-[13px]">
							<span style={{ color: "#464555" }}>Asceoft</span>
							<ChevronRight className="h-3 w-3" style={{ color: "#777587" }} />
							<span style={{ color: "#3525cd" }}>Profile</span>
						</div>
						<div className="flex items-center gap-3">
							<div
								className="h-6 w-px"
								style={{ backgroundColor: "#c7c4d8" }}
							/>
							<div
								className="flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold text-white"
								style={{
									backgroundColor: "#4f46e5",
									border: "1px solid #c7c4d8",
								}}
							>
								AM
							</div>
						</div>
					</header>

					{/* Page content */}
					<main className="flex flex-1 flex-col overflow-hidden px-8 py-8">
						{/* Page header */}
						<div className="mb-6">
							<h1
								className="text-4xl font-extrabold tracking-wide"
								style={{ color: "#151c27" }}
							>
								CLIENT LIST
							</h1>
							<p className="mt-1 text-base" style={{ color: "#464555" }}>
								View the clients your company is working with.
							</p>
						</div>

						{/* Controls */}
						<div className="mb-5 flex items-center justify-between gap-4">
							<div
								className="flex flex-1 max-w-[749px] items-center gap-2 rounded-full bg-white px-4 py-3"
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
							<button
								onClick={onAddClient}
								className="shrink-0 rounded-xl px-5 py-3 text-base font-bold text-white transition-colors hover:opacity-90"
								style={{ backgroundColor: "#4f46e5" }}
							>
								+ Add Client
							</button>
						</div>

						{/* Table */}
						<div
							className="flex flex-1 flex-col overflow-hidden rounded-2xl bg-white"
							style={{ border: "1px solid #c7c4d8" }}
						>
							{/* Unified scroll area for both X & Y */}
							<div className="client-scroll flex-1 overflow-auto">
								<div className="flex min-w-[1200px] flex-col">
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
													className="whitespace-pre-line text-base font-bold"
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
													className="whitespace-pre-line text-base"
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
														className="flex items-center justify-center rounded p-0.5 transition-colors hover:bg-gray-100"
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
				</div>
			</div>
		</>
	);
}
