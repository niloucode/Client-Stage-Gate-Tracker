"use client";

import { Ticket, Calendar } from "lucide-react";
import { Card } from "@/components/ui/card";

interface WorkflowBadge {
	label: string;
	bg: string;
	stroke: string;
	text: string;
}

interface TagBadge {
	label: string;
	bg: string;
	text: string;
}

interface MyTicket {
	id: string;
	name: string;
	project: string;
	module: string;
	workflow: WorkflowBadge;
	tag: TagBadge;
	dueDate: string;
	dueDateUrgent?: boolean;
}

interface MyTicketsBoardProps {
	tickets?: MyTicket[];
	activeCount?: number;
	onViewAll?: () => void;
}

const PLACEHOLDER_TICKETS: MyTicket[] = [
	{
		id: "1",
		name: "Implement SSO",
		project: "Asceoft",
		module: "Auth",
		workflow: {
			label: "Dev",
			bg: "#e2e8f8",
			stroke: "#c7c4d8",
			text: "#464555",
		},
		tag: { label: "High Priority", bg: "#ffdad6", text: "#93000a" },
		dueDate: "Oct 25",
	},
	{
		id: "2",
		name: "Dashboard Bento Grid Refactor",
		project: "Portal 2.0",
		module: "UI/UX",
		workflow: {
			label: "Review",
			bg: "#885500",
			stroke: "#684000",
			text: "#ffd4a4",
		},
		tag: { label: "Feature", bg: "#6cf8bb", text: "#00714d" },
		dueDate: "Oct 28",
	},
	{
		id: "3",
		name: "Database Indexing Policy",
		project: "Core Engine",
		module: "Infrastructure",
		workflow: {
			label: "Backlog",
			bg: "#e2e8f8",
			stroke: "#c7c4d8",
			text: "#464555",
		},
		tag: { label: "Optimization", bg: "#dce2f3", text: "#777587" },
		dueDate: "Nov 02",
	},
];

const COL_WIDTHS = "grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr]";

export function MyTicketsBoard({
	tickets = PLACEHOLDER_TICKETS,
	activeCount = 3,
	onViewAll,
}: MyTicketsBoardProps) {
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
					onClick={onViewAll}
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
				{tickets.map((ticket, i) => (
					<div
						key={ticket.id}
						className={`grid ${COL_WIDTHS} items-center px-6 py-4`}
						style={{
							borderBottom:
								i < tickets.length - 1 ? "1px solid #c7c4d8" : "none",
						}}
					>
						{/* Ticket name */}
						<span className="text-[13px]" style={{ color: "#151c27" }}>
							{ticket.name}
						</span>

						{/* Project */}
						<span className="text-[13px]" style={{ color: "#464555" }}>
							{ticket.project}
						</span>

						{/* Module */}
						<span className="text-[13px]" style={{ color: "#464555" }}>
							{ticket.module}
						</span>

						{/* Workflow badge */}
						<div>
							<span
								className="inline-block rounded-md px-2 py-0.5 text-[11px] font-semibold"
								style={{
									backgroundColor: ticket.workflow.bg,
									border: `1px solid ${ticket.workflow.stroke}`,
									color: ticket.workflow.text,
								}}
							>
								{ticket.workflow.label}
							</span>
						</div>

						{/* Tag */}
						<div>
							<span
								className="inline-block rounded px-2 py-0.5 text-[10px] font-bold"
								style={{
									backgroundColor: ticket.tag.bg,
									color: ticket.tag.text,
								}}
							>
								{ticket.tag.label}
							</span>
						</div>

						{/* Due date */}
						<div className="flex items-center gap-1.5">
							<Calendar
								className="h-3 w-3 shrink-0"
								style={{ color: ticket.dueDateUrgent ? "#ba1a1a" : "#464555" }}
							/>
							<span
								className="text-[13px]"
								style={{
									color: ticket.dueDateUrgent ? "#ba1a1a" : "#464555",
									fontWeight: ticket.dueDateUrgent ? 600 : 400,
								}}
							>
								{ticket.dueDate}
							</span>
						</div>
					</div>
				))}
			</div>
		</Card>
	);
}

export default MyTicketsBoard;
