"use client";

import { Eye, Calendar, AlertTriangle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useMemo } from "react";
import { DashboardTicket } from "@/entities/types";

interface WatchedTicket {
	id: string;
	name: string;
	project: string;
	module: string;
	workflow: string;
	tags: ({ Tags: { name: string; color: string | null } } & {
		ticket_id: string;
		tag_id: string;
	})[];
	assignees: string[];
	dueDate: Date;
}

interface WatchedTicketsBoardProps {
	tickets: DashboardTicket[];
}

const COL_WIDTHS = "grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr_1fr]";

export function WatchedTicketsBoard({ tickets }: WatchedTicketsBoardProps) {
	const watchedTickets = useMemo<WatchedTicket[]>(
		() =>
			tickets.map((ticket) => {
				const names: string[] = [];
				const ta = ticket.TicketAssigned;

				for (let j = 0; j < ta.length; j++)
					names.push(`${ta[j].Profile.first_name} ${ta[j].Profile.last_name}`);

				if (names.length === 0) names.push("None");

				const tempTags = ticket.TicketTags.length == 0 ? [] : ticket.TicketTags;

				return {
					id: ticket.ticket_id,
					name: ticket.name,
					project: ticket.Workflows.Modules.Phases.Stages.Projects.name,
					module: ticket.Workflows.Modules.name,
					workflow: ticket.Workflows.name,
					tags: tempTags,
					assignees: names,
					dueDate: ticket.plan_end_at,
				};
			}),
		[tickets],
	);

	return (
		<Card
			className="overflow-hidden w-full py-0 gap-0"
			style={{ border: "1px solid #c7c4d8", borderRadius: "12px" }}
		>
			{/* Header */}
			<div
				className="flex items-center gap-2 px-6 py-4"
				style={{
					backgroundColor: "#f9f9ff",
					borderBottom: "1px solid #c7c4d8",
				}}
			>
				<Eye className="h-4 w-4" style={{ color: "#684000" }} />
				<span className="text-base font-semibold" style={{ color: "#151c27" }}>
					Watching
				</span>
				{/* <span
					className="rounded-full px-2.5 py-0.5 text-[10px] font-bold"
					style={{ backgroundColor: "#ffddb8", color: "#2a1700" }}
				>
					{updatesCount} UPDATES
				</span> */}
			</div>

			{/* Table */}
			<div>
				{/* Table header */}
				<div
					className={`grid ${COL_WIDTHS} px-6 py-3`}
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
						"Assigned To",
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
				{watchedTickets.map((watchedTicket, i) => (
					<div
						key={watchedTicket.id}
						className={`grid ${COL_WIDTHS} items-center px-6 py-4`}
						style={{
							borderBottom:
								i < watchedTickets.length - 1 ? "1px solid #c7c4d8" : "none",
						}}
					>
						{/* watchedTicket name */}
						<div
							className="w-fit max-w-[80%] xl:break-normal break-all flex flex-auto text-[13px]"
							style={{ color: "#151c27" }}
						>
							{watchedTicket.name}
						</div>

						{/* Project */}
						<div
							className="w-fit max-w-[80%] xl:break-normal break-all flex flex-auto text-[13px]"
							style={{ color: "#464555" }}
						>
							{watchedTicket.project}
						</div>

						{/* Module */}
						<div
							className="w-fit max-w-[80%] xl:break-normal break-all flex flex-auto text-[13px]"
							style={{ color: "#464555" }}
						>
							{watchedTicket.module}
						</div>

						{/* Workflow badge */}
						<div>
							<div
								className="w-fit max-w-[80%] xl:break-normal break-all flex flex-auto rounded-md py-0.5 pt-1 text-[11px] font-semibold px-2"
								style={{
									backgroundColor: "#E2E8F8",
									border: `1px solid #C7C4D84D`,
									color: "#000000",
								}}
							>
								{watchedTicket.workflow}
							</div>
						</div>

						{/* Tag */}
						{watchedTicket.tags.length > 0 &&
							watchedTicket.tags.map((tag, i) => (
								<div key={watchedTicket.id}>
									{" "}
									<div
										className="w-fit max-w-[80%] xl:break-normal break-all flex flex-auto rounded px-2 py-0.5 pt-1 text-[10px] text-center font-bold "
										style={{
											backgroundColor: tag.Tags.color ?? "#444444",
											color: "#000000",
										}}
									>
										{tag.Tags.name}
									</div>
								</div>
							))}

						{watchedTicket.tags.length === 0 && (
							<div key={watchedTicket.id}></div>
						)}

						{/* Assigned to */}
						{watchedTicket.assignees.map((a, i) => (
							<div
								key={i}
								className="w-fit max-w-[80%] xl:break-normal break-all flex flex-auto items-center gap-2"
							>
								<div
									className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full"
									style={{ backgroundColor: "#E2DFFF" }}
								>
									<div
										className="text-[8px] font-bold"
										style={{ color: "#151c27" }}
									>
										{a == "None"
											? ""
											: a
													.split(" ")
													.map((word) => word.charAt(0))
													.join(" ")}
									</div>
								</div>
								<div className="text-[13px]" style={{ color: "#464555" }}>
									{a}
								</div>
							</div>
						))}

						{/* Due date */}
						<div className="w-fit max-w-[80%] xl:break-normal break-all flex flex-auto items-center gap-1.5">
							{watchedTicket.dueDate.getTime() <= new Date().getTime() ? (
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
										watchedTicket.dueDate.getTime() <= new Date().getTime()
											? "#ba1a1a"
											: "#464555",
									fontWeight:
										watchedTicket.dueDate.getTime() <= new Date().getTime()
											? 600
											: 400,
								}}
							>
								{watchedTicket.dueDate.toDateString()}
							</div>
						</div>
					</div>
				))}
			</div>
		</Card>
	);
}

export default WatchedTicketsBoard;
