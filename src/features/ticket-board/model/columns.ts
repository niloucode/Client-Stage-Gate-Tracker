export interface Column {
	id: "PENDING" | "IN_PROGRESS" | "FINISHED";
	title: string;
	dotColor: string;
}

export const COLUMNS: Column[] = [
	{ id: "PENDING", title: "Pending", dotColor: "bg-gray-400" },
	{ id: "IN_PROGRESS", title: "In Progress", dotColor: "bg-brand-600" },
	{ id: "FINISHED", title: "Finished", dotColor: "bg-green-500" },
];
