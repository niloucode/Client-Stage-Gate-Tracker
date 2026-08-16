"use client";

import { useState } from "react";
import { useAuth } from "@/features/auth";
import { useDepartment } from "@/entities/department";
import { useClientOwn } from "@/entities/client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
	DropdownMenu,
	DropdownMenuTrigger,
	DropdownMenuContent,
	DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

// TODO(fsd): cross-slice import — features/navigation imports useAuth from
// features/auth (same-layer import, forbidden by FSD rule 4-1). Fix by moving
// the auth context to the app providers layer (src/app) so both slices can
// consume it downward, then delete this comment.
/** User menu: profile info, role/company, and logout. */
export function AccountMenu() {
	const { user, logout } = useAuth();
	// Local pending state so the LOG-OUT button disables while sign-out and
	// the navigation run (the provider additionally guards re-entry).
	const [isLoggingOut, setIsLoggingOut] = useState(false);
	const handleLogout = async () => {
		setIsLoggingOut(true);
		await logout();
	};
	// Department lookup via TanStack Query (cached, keyed by department_id).
	const { data: department } = useDepartment(user?.department_id ?? undefined);
	const departmentName = department?.name ?? "No Department";

	// Client employees have no department — show their company instead. The
	// lookup is scoped to the caller's OWN client row (never the registry).
	const { data: ownClient } = useClientOwn(!!user?.client_id);
	const companyName = ownClient?.client_name ?? "Client";
	const roleLabel = user?.client_id ? companyName : departmentName;

	const userName = user
		? `${user.first_name ?? ""} ${user.last_name ?? ""}`.trim()
		: "User";
	const userEmail = user?.email ?? "";
	const userInitials =
		user?.first_name && user?.last_name
			? `${user.first_name[0]}${user.last_name[0]}`.toUpperCase()
			: "";

	return (
		<DropdownMenu>
			<DropdownMenuTrigger className="flex items-center justify-center w-8 h-8 rounded-full overflow-hidden bg-brand-600 text-xs font-bold text-neutral-surface ring-2 ring-transparent hover:ring-indigo-200 transition-all data-popup-open:ring-indigo-200">
				{userInitials}
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end" className="w-72">
				{/* No profile page yet — this header IS the profile summary. */}
				<div className="flex flex-col items-center text-center p-4">
					<Avatar className="w-16 h-16 text-lg mb-3">
						<AvatarFallback className="bg-brand-600 text-neutral-surface text-lg font-bold">
							{userInitials}
						</AvatarFallback>
					</Avatar>
					<div className="text-foreground text-base">{userName}</div>
					<Badge
						variant="secondary"
						className="mt-1.5 text-[11px] tracking-wide uppercase"
					>
						{roleLabel}
					</Badge>
					{user?.job_title && (
						<div className="mt-1.5 text-xs text-muted-foreground">
							{user.job_title}
						</div>
					)}
					<div className="mt-1.5 text-xs text-muted-foreground">
						{userEmail}
					</div>
					{user?.phone && (
						<div className="mt-1 text-xs text-muted-foreground">
							{user.phone}
						</div>
					)}
				</div>

				<DropdownMenuSeparator />
				<div className="px-4 py-2">
					<button
						type="button"
						onClick={handleLogout}
						disabled={isLoggingOut}
						className="w-full py-2.5 rounded-sm bg-brand-600 hover:bg-brand-500 text-neutral-surface text-sm tracking-wide transition-colors disabled:opacity-60 disabled:cursor-wait"
					>
						{isLoggingOut ? "LOG OUT…" : "LOG OUT"}
					</button>
				</div>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
