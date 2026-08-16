import type { ReactNode } from "react";

// Auth group shell — a passthrough layout. Authentication redirects are
// handled by the middleware (src/proxy.ts): anonymous users are sent to
// /login, signed-in users are redirected away from auth pages by the
// client AuthProvider (features/auth).
/** Auth group shell layout (passthrough). */
export default function AuthLayout({ children }: { children: ReactNode }) {
	return <>{children}</>;
}
