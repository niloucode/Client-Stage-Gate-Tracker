"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

interface TeamMember {
	id: string
	firstName: string
	lastName: string
	email: string
	phone: string
	avatarUrl?: string
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
]

interface ViewTeamMembersModalProps {
	isOpen: boolean
	members?: TeamMember[]
	onClose: () => void
}

export default function ViewTeamMembersModal({
	isOpen,
	members = PLACEHOLDER_MEMBERS,
	onClose,
}: ViewTeamMembersModalProps) {
	return (
		<Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
			<DialogContent className="max-w-[672px]">
				<DialogHeader>
					<DialogTitle>Team Members</DialogTitle>
				</DialogHeader>
				<div className="p-6">
					{/* Table header */}
					<div
						className="grid px-4 py-4 border-b border-border"
						style={{ gridTemplateColumns: "1fr 1fr 1fr" }}
					>
						{["Member", "Email", "Phone Number"].map((col) => (
							<span key={col} className="text-xs font-bold text-muted-foreground">
								{col}
							</span>
						))}
					</div>

					{/* Scrollable rows */}
					<div className="max-h-[300px] overflow-y-auto">
						{members.map((member, i) => (
							<div
								key={member.id}
								className="grid items-center px-4 py-4"
								style={{
									gridTemplateColumns: "1fr 1fr 1fr",
									borderBottom:
										i < members.length - 1 ? "1px solid hsl(var(--border))" : "none",
								}}
							>
								{/* Member */}
								<div className="flex items-center gap-3">
									<Avatar className="h-10 w-10">
										<AvatarFallback className="bg-primary text-primary-foreground text-sm font-semibold">
											{`${member.firstName[0] ?? ""}${member.lastName[0] ?? ""}`.toUpperCase()}
										</AvatarFallback>
									</Avatar>
									<span className="text-sm font-semibold leading-snug text-foreground">
										{member.firstName}
										<br />
										{member.lastName}
									</span>
								</div>

								{/* Email */}
								<span className="text-sm text-muted-foreground">
									{member.email}
								</span>

								{/* Phone */}
								<span className="text-sm text-muted-foreground">
									{member.phone}
								</span>
							</div>
						))}
					</div>
				</div>
			</DialogContent>
		</Dialog>
	)
}
