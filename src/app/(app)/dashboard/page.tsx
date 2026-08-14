"use client";

import {
	TicketsBoard,
	PendingContracts,
	useDashboardRole,
	useMyTickets,
	useWatchedTickets,
	useMyContracts,
} from "@/features/landing-dashboard";
import { useAuth } from "@/features/auth";

// TODO(landing-dashboard): ActivitySparklines integration is on hold by
// decision — wire weekly velocity / risk / upcoming deadlines after the
// role-based views ship (component already exists in the feature).
export default function DashboardPage() {
	const { user } = useAuth();
	const roleQuery = useDashboardRole();

	const showTickets = roleQuery.data === "staff" || roleQuery.data === "owner";
	const showContracts =
		roleQuery.data === "client" || roleQuery.data === "owner";

	const myTickets = useMyTickets(showTickets);
	const watchedTickets = useWatchedTickets(showTickets);
	const myContracts = useMyContracts(showContracts);

	const loading =
		roleQuery.isLoading ||
		(showTickets && (myTickets.isLoading || watchedTickets.isLoading)) ||
		(showContracts && myContracts.isLoading);

	if (loading) {
		return (
			<div className="flex h-full w-full items-center justify-center">
				<div>Loading...</div>
			</div>
		);
	}

	if (roleQuery.isError) {
		return (
			<div className="flex h-full w-full items-center justify-center">
				<div className="text-sm text-destructive">
					Failed to load your dashboard. Please try again.
				</div>
			</div>
		);
	}

	const isClient = roleQuery.data === "client";

	return (
		<div className="mx-auto flex h-fit w-full flex-col items-center justify-center">
			<div className="mb-6 flex h-fit w-full flex-col gap-4 pb-4">
				<h1 className="h-fit w-full text-3xl">
					{isClient
						? `Welcome Back, ${user?.first_name ?? ""}`
						: "Personal Dashboard"}
				</h1>
				<div className="subtitle">
					{isClient
						? "Review your active contracts."
						: "Review your active workload and watched developments."}
				</div>
			</div>

			<div className="flex w-full flex-col items-center justify-center gap-10">
				{showTickets && (
					<>
						<TicketsBoard tickets={myTickets.data ?? []} />
						<TicketsBoard
							variant="watched"
							tickets={watchedTickets.data ?? []}
						/>
					</>
				)}
				{showContracts && (
					<PendingContracts contracts={myContracts.data ?? []} />
				)}
			</div>
		</div>
	);
}
