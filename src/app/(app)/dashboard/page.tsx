"use client";
// import { redirect } from "next/navigation";
import {
	ActivitySparklines,
	TicketsBoard,
	PendingContracts,
} from "@/features/landing-dashboard";
import { useAuth } from "@/features/auth";
import { useState, useEffect } from "react";

type USER_ROLE_TYPES = "product team" | "product owner" | "client";

// The landing dashboard is not built yet — route to /projects until it is
// (see the previous planned-view description for this intent).
export default function DashboardPage() {
	const { user } = useAuth();
	const [userRole, setUserRole] = useState<USER_ROLE_TYPES | null>(null);
	const [loading, setLoading] = useState(false);

	useEffect(() => {
		//TODO: fetch user role here
		setLoading(true);
		setLoading(false);
	}, []);

	return loading ? (
		<div className="w-full h-full mx-auto flex flex-col items-center justify-center">
			<div>Loading...</div>
		</div>
	) : (
		<div className="w-full h-fit mx-auto flex flex-col items-center justify-center">
			<div className="w-full h-fit pb-4 mb-6 flex flex-col gap-4">
				<div className="w-full h-fit text-3xl">
					<h1>
						{true ? `Personal Dashboard` : `Welcome Back, ${user?.first_name}`}
					</h1>
				</div>
				<div className="subtitle">
					{true
						? `Review your active workload and watched developments.`
						: `Review your active contracts.`}
				</div>
			</div>
			<div>
				
			</div>
			<div className="flex flex-col items-center justify-center gap-10 w-full">
			<TicketsBoard />
			<TicketsBoard variant="watched" />
			<div className="flex w-full justify-between gap-5">
			<PendingContracts />
			</div>
			</div>
		</div>
	);
}
