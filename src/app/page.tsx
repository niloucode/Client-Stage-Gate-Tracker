import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getProfileById } from "@/entities/profile/profileActions";

// Root route. Anonymous users are already sent to /login by the middleware
// (proxy.ts). Signed-in users get a role-aware redirect that mirrors the
// AuthProvider post-login routing, so clients never see the staff dashboard.
export default async function RootPage() {
	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();
	if (!user) redirect("/login");

	// Entity action (not inline prisma) — picks up soft-delete filtering
	// and the {success, data} contract (Task 4.1).
	const result = await getProfileById(user.id);
	if (result.success && result.data?.client_id) {
		// TODO(client-portal): route clients to their own landing dashboard
		// once built (planned in features/landing-dashboard) — mirrors the
		// AuthProvider post-login routing. Until then clients land on the
		// staff dashboard; server-side authz guards workspace data.
		redirect("/dashboard");
	}
	redirect("/projects");
}
