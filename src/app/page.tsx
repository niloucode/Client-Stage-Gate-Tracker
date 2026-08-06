import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

// Root route. Anonymous users are already sent to /login by the middleware
// (proxy.ts). Signed-in users get a role-aware redirect that mirrors the
// AuthProvider post-login routing, so clients never see the staff dashboard.
export default async function RootPage() {
	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();
	if (!user) redirect("/login");

	const profile = await prisma.profiles.findUnique({
		where: { profile_id: user.id },
		select: { client_id: true },
	});
	if (profile?.client_id) {
		// TEMPORARY: clients land on /contracts until the Client Portal
		// (/client) is built.
		redirect("/contracts");
	}
	redirect("/projects");
}
