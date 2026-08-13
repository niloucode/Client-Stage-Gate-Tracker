// src/app/(app)/clients/page.tsx
// Thin route wrapper — the whole clients feature lives in
// features/client-manager (FSD: app layer composes, features own the logic).

import { ClientsPage } from "@/features/client-manager";

export default function ClientsRoute() {
	return <ClientsPage />;
}
