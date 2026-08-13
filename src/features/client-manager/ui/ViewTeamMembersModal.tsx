"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

// 1. Defined TeamMember Interface
export interface TeamMember {
	id: string
	firstName: string
	lastName: string
	email: string
	phone: string | null
}

interface ViewTeamMembersModalProps {
	isOpen: boolean
	members?: TeamMember[]
	onClose: () => void
}

export default function ViewTeamMembersModal({
	isOpen,
	members,
	onClose,
}: ViewTeamMembersModalProps) {
	// Cache members so they remain visible during the exit/closing transition.
	// "Adjust state during render" pattern (React docs): the prop is cleared
	// (undefined) while the dialog animates out, so snapshot the last list —
	// INCLUDING an empty one — so a different client with no members never
	// shows the previous client's team. No setState-in-effect.
	const [cachedMembers, setCachedMembers] = useState<TeamMember[] | undefined>(members)
	const [prevMembers, setPrevMembers] = useState<TeamMember[] | undefined>(members)
	if (members !== prevMembers) {
		setPrevMembers(members)
		if (members !== undefined) {
			setCachedMembers(members)
		}
	}

	// Fallback to cached members if the prop gets cleared/reset while closing
	const displayMembers = members?.length ? members : cachedMembers

	return (
		<Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
			<DialogContent className="max-w-2xl">
				<DialogHeader>
					<DialogTitle>Team Members</DialogTitle>
				</DialogHeader>
				<div>
					{/* Table header */}
					<div
						className="grid px-4 pb-2 border-b border-border"
						style={{ gridTemplateColumns: "1fr 1fr 1fr" }}
					>
						{["Member", "Email", "Phone Number"].map((col) => (
							<span key={col} className="text-xs font-bold text-muted-foreground">
								{col}
							</span>
						))}
					</div>
					{/* Scrollable rows */}
					{displayMembers && displayMembers.length > 0 ? (
						<div className="max-h-75 overflow-y-auto">
							{displayMembers.map((member, i) => (
								<div
									key={member.id}
									className="grid items-center px-4 py-4"
									style={{
										gridTemplateColumns: "1fr 1fr 1fr",
										borderBottom:
											i < displayMembers.length - 1 ? "1px solid hsl(var(--border))" : "none",
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
									<span className="text-sm text-muted-foreground truncate">
										{member.email}
									</span>

									{/* Phone */}
									<span className="text-sm text-muted-foreground">
										{member.phone}
									</span>
								</div>
							))}
						</div>
					) : (
						<p className="px-4 py-8 text-center text-sm text-muted-foreground">
							No team members yet.
						</p>
					)}
				</div>
			</DialogContent>
		</Dialog>
	)
}