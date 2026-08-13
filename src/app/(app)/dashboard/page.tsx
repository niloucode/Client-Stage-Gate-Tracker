"use client";
// import { redirect } from "next/navigation";
import {
	ActivitySparklines,
	MyTicketsBoard,
	PendingContracts,
	WatchedTicketsBoard,
} from "@/features/landing-dashboard";
import { useAuth } from "@/features/auth";
import { useState, useEffect } from "react";
import {
	getContractsByClientIdWithProject,
	getContractsByProjectOwnerId,
} from "@/entities/contract";
import {
	selectTicketsByWatcherID,
	selectTicketsByProfileID,
} from "@/entities/ticket";
import { getDepartmentById } from "@/entities/department";
import { ContractPayload } from "@/entities/types";
import { DashboardTicket } from "@/entities/types";

// The landing dashboard is not built yet — route to /projects until it is
// (see the previous planned-view description for this intent).
export default function DashboardPage() {
	const { user } = useAuth();
	const [userRole, setUserRole] = useState<string>("");
	const [loading, setLoading] = useState(false);
	const [myTickets, setMyTickets] = useState<DashboardTicket[]>([]);
	const [watchedTickets, setWatchedTickets] = useState<DashboardTicket[]>([]);
	const [contracts, setContracts] = useState<ContractPayload[]>([]);

	const viewTickets =
		userRole === "Project Owner" || userRole === "Project Team";
	const viewContracts = userRole === "Project Owner" || userRole === "Client";
	const viewSparklines = userRole === "Project Team";

	const getData = async () => {
		if (!user) return;

		const role = await getDepartmentById(user.department_id ?? "");
		if (role) setUserRole(role.name);
		else setUserRole("Client");

		const my_tickets = await selectTicketsByProfileID(user.profile_id);
		if (my_tickets.length > 0) setMyTickets(my_tickets);

		const watched_tickets = await selectTicketsByWatcherID(user.profile_id);
		if (watched_tickets.length > 0) setWatchedTickets(watched_tickets);

		//get contracts by client id if user is Client
		if (user.client_id) {
			const contracts = await getContractsByClientIdWithProject(user.client_id);
			//check for success
			if (contracts.success) setContracts(contracts.data ?? []);
			console.log("Contracts: ");
			console.log(contracts.data);
		}
		//get contracts by profile id if user is Project Owner
		else if (role && role.name === "Project Owner") {
			const contracts = await getContractsByProjectOwnerId(user.profile_id);
			//check for success
			if (contracts.success) setContracts(contracts.data ?? []);
			console.log("Contracts: ");
			console.log(contracts.data);
		}
	};

	useEffect(() => {
		//TODO: fetch user role here
		setLoading(true);
		try {
			getData();
			setLoading(false);
		} catch (err: any) {
			console.log(`Error fetching landing dashboard data ${err}`);
			setLoading(false);
		}
	}, [user]);

	return loading ? (
		<div className="bg-[#F9F9FF] w-full h-full mx-auto p-8 flex flex-col items-center justify-center">
			<div>Loading...</div>
		</div>
	) : (
		<div className="bg-[#F9F9FF] w-full h-fit mx-auto p-8 flex flex-col items-center justify-center gap-10">
			<div className="w-full h-fit pb-4 flex flex-col gap-4">
				<div className="w-full h-fit text-3xl">
					<b>
						{true ? `Personal Dashboard` : `Welcome Back, ${user?.first_name}`}
					</b>
				</div>
				<div className="w-full h-fit text-md">
					{true
						? `Review your active workload and watched developments.`
						: `Review your active contracts.`}
				</div>
			</div>
			{viewTickets && <MyTicketsBoard tickets={myTickets} />}
			{viewTickets && <WatchedTicketsBoard tickets={watchedTickets} />}
			{viewContracts && (
				<PendingContracts contracts={contracts} role={userRole} />
			)}
			{/* {viewSparklines && <ActivitySparklines />} */}
		</div>
	);
}
