export interface Column {
	id: "PENDING" | "IN_PROGRESS" | "FINISHED"
	title: string
	dotColor: string
	textColor: string
}

export const COLUMNS: Column[] = [
	{ id: "PENDING", title: "Pending", dotColor: "bg-yellow-500",textColor:"text-neutral-subtle" },
	{ id: "IN_PROGRESS", title: "In Progress", dotColor: "bg-brand-600",textColor:"text-neutral-subtle" },
	{ id: "FINISHED", title: "Finished", dotColor: "bg-green-500",textColor:"text-neutral-subtle" },
]
