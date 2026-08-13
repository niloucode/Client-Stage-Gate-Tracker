"use client";

import { Ticket, Calendar, AlertTriangle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useMemo } from "react";
import { DashboardTicket } from "@/entities/types";
import { useRouter } from "next/navigation";

// interface WorkflowBadge {
// 	label: string;
// 	bg: string;
// 	stroke: string;
// 	text: string;
// }

// interface TagBadge {
// 	label: string;
// 	bg: string;
// 	text: string;
// }

interface MyTicket {
	id: string;
	name: string;
	project: string;
	module: string;
	workflow: string;
	tags: ({ Tags: { name: string; color: string | null } } & {
		ticket_id: string;
		tag_id: string;
	})[];
	dueDate: Date;
}

interface MyTicketsBoardProps {
	tickets: DashboardTicket[];
	activeCount?: number;
}

const COL_WIDTHS = "grid-cols-[1.67fr_1fr_1fr_1fr_1fr_1fr]";

//IM NOT SURE ABOUT THIS SO JUST CHANGE IT WHENEVER
const REDIR_PATH = "/projects/[projectId]/issues/";

export function MyTicketsBoard({ tickets }: MyTicketsBoardProps) {
	const router = useRouter();
	const myTickets = useMemo<MyTicket[]>(
		() =>
			tickets.map((ticket) => ({
				id: ticket.ticket_id,
				name: ticket.name,
				project: ticket.Workflows.Modules.Phases.Stages.Projects.name,
				module: ticket.Workflows.Modules.name,
				workflow: ticket.Workflows.name,
				tags: ticket.TicketTags,
				dueDate: ticket.plan_end_at,
			})),
		[tickets],
	);
	const activeCount = myTickets.length;

	return (
		<Card
			className="overflow-hidden w-full py-0 gap-0"
			style={{ border: "1px solid #c7c4d8", borderRadius: "12px" }}
		>
			{/* Header */}
			<div
				className="flex items-center justify-between px-6 py-4"
				style={{
					backgroundColor: "#f9f9ff",
					borderBottom: "1px solid #c7c4d8",
				}}
			>
				<div className="flex items-center gap-2">
					<Ticket className="h-4 w-4" style={{ color: "#3525cd" }} />
					<span
						className="text-base font-semibold"
						style={{ color: "#151c27" }}
					>
						My tickets
					</span>
					<span
						className="rounded-full px-2.5 py-0.5 text-[10px] font-bold"
						style={{ backgroundColor: "#e2dfff", color: "#0f0069" }}
					>
						{activeCount} ACTIVE
					</span>
				</div>
				<button
					onClick={() => router.push(REDIR_PATH)}
					className="text-[12px] font-normal underline-offset-2 hover:underline"
					style={{ color: "#3525cd" }}
				>
					View All
				</button>
			</div>

			{/* Table */}
			<div>
				{/* Table header */}
				<div
					className={`grid ${COL_WIDTHS} px-6 py-4`}
					style={{
						backgroundColor: "#f0f3ff",
						borderBottom: "1px solid #c7c4d8",
					}}
				>
					{[
						"Ticket Name",
						"Project",
						"Module",
						"Workflow",
						"Tags",
						"Due Date",
					].map((col) => (
						<span
							key={col}
							className="text-[11px] font-bold uppercase"
							style={{ color: "#777587" }}
						>
							{col}
						</span>
					))}
				</div>

				{/* Rows */}
				{myTickets.map((myTicket, i) => (
					<div
						key={myTicket.id}
						className={`grid ${COL_WIDTHS} items-center px-6 py-4`}
						style={{
							borderBottom:
								i < myTickets.length - 1 ? "1px solid #c7c4d8" : "none",
						}}
					>
						{/* myTicket name */}
						<div
							className="flex flex-auto w-fit max-w-[80%] text-[13px]"
							style={{ color: "#151c27" }}
						>
							{myTicket.name}
						</div>

						{/* Project */}
						<div
							className="flex flex-auto w-fit max-w-[80%] text-[13px]"
							style={{ color: "#464555" }}
						>
							{myTicket.project}
						</div>

						{/* Module */}
						<div
							className="w-fit max-w-[80%] flex flex-auto text-[13px]"
							style={{ color: "#464555" }}
						>
							{myTicket.module}
						</div>

						{/* Workflow badge */}
						<div>
							<div
								className="w-fit max-w-[80%] flex flex-auto rounded-md py-0.5 pt-1 text-[11px] font-semibold text-left px-2"
								style={{
									backgroundColor: "#E2E8F8",
									border: `1px solid #C7C4D84D`,
									color: "#000000",
								}}
							>
								{myTicket.workflow}
							</div>
						</div>

						{/* Tag */}

						{myTicket.tags.map((tag) => (
							<div key={myTicket.id}>
								<div
									className="w-fit max-w-[80%] flex flex-auto rounded px-2 py-0.5 pt-1 text-[10px] font-bold "
									style={{
										backgroundColor: tag.Tags.color ?? "#444444",
										color: "#000000",
									}}
								>
									{tag.Tags.name}
								</div>
							</div>
						))}

						{/* Due date */}
						<div className="w-fit max-w-[80%] xl:break-normal break-all flex flex-auto items-center gap-1.5">
							{myTicket.dueDate.getTime() <= new Date().getTime() ? (
								<AlertTriangle
									className="h-3 w-3 shrink-0"
									style={{ color: "#ba1a1a" }}
								/>
							) : (
								<Calendar
									className="h-3 w-3 shrink-0"
									style={{ color: "#464555" }}
								/>
							)}

							<div
								className="text-[13px]"
								style={{
									color:
										myTicket.dueDate.getTime() <= new Date().getTime()
											? "#ba1a1a"
											: "#464555",
									fontWeight:
										myTicket.dueDate.getTime() <= new Date().getTime()
											? 600
											: 400,
								}}
							>
								{myTicket.dueDate.toDateString()}
							</div>
						</div>
					</div>
				))}
			</div>
		</Card>
	);
}

export default MyTicketsBoard;
