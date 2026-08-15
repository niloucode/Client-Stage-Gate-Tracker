// Auth group shell — a passthrough layout. Authentication redirects are
// handled by the middleware (src/proxy.ts): anonymous users are sent to
// /login, signed-in users are redirected away from auth pages by the
// client AuthProvider (features/auth).
export default function AuthLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return <>{children}</>;
}
