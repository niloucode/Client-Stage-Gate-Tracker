// Client registry row shapes (features/client-manager model segment).

export interface ClientProfile {
	profile_id: string;
	first_name: string;
	last_name: string;
	email: string;
	phone: string | null;
}

export interface Client {
	id: string;
	name: string;
	email: string;
	contactNumber: string;
	billingAddress: string;
	// The plain code is shown ONCE at creation/regeneration; only its hash
	// is stored, so the list can only reveal whether a code exists.
	hasInviteCode: boolean;
	tin: string;
	profiles?: ClientProfile[];
}

export type SortField =
	"name" | "tin" | "email" | "contactNumber" | "billingAddress";

export type SortDirection = "asc" | "desc";
