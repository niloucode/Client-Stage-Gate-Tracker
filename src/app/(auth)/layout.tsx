// TODO(backend): re-enable Supabase session guard when Prisma adapter is resolved
// import { createClient } from "@/lib/supabase/server";
// import { redirect } from "next/navigation";

export default function AuthLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	// const supabase = await createClient();
	// const { data } = await supabase.auth.getClaims();
	// if (data?.claims) redirect("/dashboard");

	return <>{children}</>;
}
