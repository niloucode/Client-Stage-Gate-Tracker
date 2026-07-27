"use client";

import { X } from "lucide-react";

interface TeamMember {
	id: string;
	firstName: string;
	lastName: string;
	email: string;
	phone: string;
	avatarUrl?: string;
}

interface ViewTeamMembersModalProps {
	members?: TeamMember[];
	onClose?: () => void;
}

const PLACEHOLDER_MEMBERS: TeamMember[] = [
	{
		id: "1",
		firstName: "Sarah",
		lastName: "Jenkins",
		email: "sarah.j@acme.com",
		phone: "77777777777",
	},
	{
		id: "2",
		firstName: "Sarah",
		lastName: "Jenkins",
		email: "sarah.j@acme.com",
		phone: "77777777777",
	},
	{
		id: "3",
		firstName: "Sarah",
		lastName: "Jenkins",
		email: "sarah.j@acme.com",
		phone: "77777777777",
	},
];

function MemberAvatar({
	firstName,
	lastName,
	avatarUrl,
}: {
	firstName: string;
	lastName: string;
	avatarUrl?: string;
}) {
	const initials = `${firstName[0] ?? ""}${lastName[0] ?? ""}`.toUpperCase();
	if (avatarUrl) {
		return (
			<img
				src={avatarUrl}
				alt={`${firstName} ${lastName}`}
				className="h-10 w-10 rounded-full object-cover"
				style={{ border: "1px solid #c7c4d7" }}
			/>
		);
	}
	return (
		<div
			className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white"
			style={{ backgroundColor: "#4f46e5", border: "1px solid #c7c4d7" }}
		>
			{initials}
		</div>
	);
}

export default function ViewTeamMembersModal({
	members = PLACEHOLDER_MEMBERS,
	onClose,
}: ViewTeamMembersModalProps) {
	return (
		<>
			<style>{`
        .team-scroll::-webkit-scrollbar { width: 6px; }
        .team-scroll::-webkit-scrollbar-track { background: #f1f1f1; border-radius: 9999px; }
        .team-scroll::-webkit-scrollbar-thumb { background: #c7c4d7; border-radius: 9999px; }
        .team-scroll::-webkit-scrollbar-thumb:hover { background: #9c99b8; }
      `}</style>

			<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
				<div
					className="w-full max-w-[672px] overflow-hidden rounded-xl bg-white shadow-xl"
					style={{ border: "1px solid #c7c4d7" }}
				>
					{/* Header */}
					<div
						className="flex items-center justify-between px-6 py-5"
						style={{
							backgroundColor: "#f8f9fc",
							borderBottom: "1px solid #c7c4d7",
						}}
					>
						<h2 className="text-2xl font-semibold" style={{ color: "#191c1e" }}>
							Team Members
						</h2>
						<button
							onClick={onClose}
							className="flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-black/10"
							aria-label="Close"
						>
							<X className="h-4 w-4" style={{ color: "#464555" }} />
						</button>
					</div>

					{/* Content */}
					<div className="p-6">
						{/* Table header */}
						<div
							className="grid px-4 py-4"
							style={{
								gridTemplateColumns: "1fr 1fr 1fr",
								borderBottom: "1px solid #c7c4d7",
							}}
						>
							{["Member", "Email", "Phone Number"].map((col) => (
								<span
									key={col}
									className="text-xs font-bold"
									style={{ color: "#464555" }}
								>
									{col}
								</span>
							))}
						</div>

						{/* Scrollable rows */}
						<div className="team-scroll max-h-[300px] overflow-y-auto">
							{members.map((member, i) => (
								<div
									key={member.id}
									className="grid items-center px-4 py-4"
									style={{
										gridTemplateColumns: "1fr 1fr 1fr",
										borderBottom:
											i < members.length - 1 ? "1px solid #f1f0f8" : "none",
									}}
								>
									{/* Member */}
									<div className="flex items-center gap-3">
										<MemberAvatar
											firstName={member.firstName}
											lastName={member.lastName}
											avatarUrl={member.avatarUrl}
										/>
										<span
											className="text-sm font-semibold leading-snug"
											style={{ color: "#191c1e" }}
										>
											{member.firstName}
											<br />
											{member.lastName}
										</span>
									</div>

									{/* Email */}
									<span className="text-sm" style={{ color: "#464555" }}>
										{member.email}
									</span>

									{/* Phone */}
									<span className="text-sm" style={{ color: "#464555" }}>
										{member.phone}
									</span>
								</div>
							))}
						</div>
					</div>
				</div>
			</div>
		</>
	);
}
