export interface TeamMember {
	id: string;
	firstName: string;
	lastName: string;
	fullName: string;
	email: string;
	phone: string;
	jobTitle: string;
	department: string;
}

export type TeamSortField =
	"name" | "email" | "phone" | "jobTitle" | "department";

export type SortDirection = "asc" | "desc";
