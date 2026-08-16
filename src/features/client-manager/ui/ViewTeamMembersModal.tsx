"use client";

import { useState } from "react";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export interface TeamMember {
	id: string;
	firstName: string;
	lastName: string;
	email: string;
	phone: string | null;
}

interface ViewTeamMembersModalProps {
	isOpen: boolean;
	members?: TeamMember[];
	onClose: () => void;
}

function getInitials(firstName: string, lastName: string): string {
	return `${firstName[0] ?? ""}${lastName[0] ?? ""}`.toUpperCase();
}

/** Read-only client team member list dialog. */
export default function ViewTeamMembersModal({
	isOpen,
	members,
	onClose,
}: ViewTeamMembersModalProps) {
	// Cache members so they remain visible during the exit transition
	const [cachedMembers, setCachedMembers] = useState<TeamMember[] | undefined>(
		members,
	);
	const [prevMembers, setPrevMembers] = useState<TeamMember[] | undefined>(
		members,
	);
	if (members !== prevMembers) {
		setPrevMembers(members);
		if (members !== undefined) {
			setCachedMembers(members);
		}
	}

	const displayMembers = members?.length ? members : cachedMembers;

	return (
		<Dialog
			open={isOpen}
			onOpenChange={(open) => {
				if (!open) onClose();
			}}
		>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Team Members</DialogTitle>
					<DialogDescription>
						View all team members associated with this client.
					</DialogDescription>
				</DialogHeader>

				<div className="-m-4 -mx-5 -mb-11 ">
					{/* Table Column Headers */}
					<div className="border-b border-brand-100 grid grid-cols-3 px-4 py-2.5 text-[11px] font-bold tracking-wider text-muted-foreground uppercase bg-neutral-subtle">
						<span>MEMBER</span>
						<span>EMAIL</span>
						<span>PHONE NUMBER</span>
					</div>

					{/* Scrollable Members List */}
					{displayMembers && displayMembers.length > 0 ? (
						<div className="max-h-75 overflow-y-auto space-y-1">
							{displayMembers.map((member) => (
								<div
									key={member.id}
									className="grid grid-cols-3 items-center px-4 py-3 rounded-md transition-colors hover:bg-neutral-subtle/30 border-b border-brand-100/30 last:border-b-0"
								>
									{/* Member Info */}
									<div className="flex items-center gap-3 min-w-0 pr-2">
										<Avatar className="h-9 w-9 shrink-0">
											<AvatarFallback className="bg-lavender-100 text-xs font-semibold text-brand-600">
												{getInitials(member.firstName, member.lastName)}
											</AvatarFallback>
										</Avatar>
										<span className="text-sm font-semibold leading-tight text-foreground truncate">
											{member.firstName} {member.lastName}
										</span>
									</div>

									{/* Email */}
									<span className="text-xs text-muted-foreground truncate pr-2">
										{member.email}
									</span>

									{/* Phone */}
									<span className="text-xs text-muted-foreground truncate">
										{member.phone || "—"}
									</span>
								</div>
							))}
						</div>
					) : (
						<p className="px-4 py-8 text-center text-sm text-muted-foreground">
							No team members found.
						</p>
					)}
				</div>

				<DialogFooter className="mt-6" showCloseButton={false}>
					<Button type="button" variant="ghost" onClick={onClose}>
						Close
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
