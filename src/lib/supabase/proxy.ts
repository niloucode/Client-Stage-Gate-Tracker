import "server-only";
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { env } from "@/env";

/** Middleware session refresh: refreshes cookies and redirects anonymous users to /login.
 * @param request - The incoming request.
 * @returns The (possibly redirected) response.
 */
export async function updateSession(request: NextRequest) {
	let supabaseResponse = NextResponse.next({
		request,
	});

	const supabase = createServerClient(
		env.NEXT_PUBLIC_SUPABASE_URL,
		env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
		{
			cookies: {
				getAll() {
					return request.cookies.getAll();
				},
				setAll(cookiesToSet) {
					cookiesToSet.forEach(({ name, value }) =>
						request.cookies.set(name, value),
					);
					supabaseResponse = NextResponse.next({
						request,
					});
					cookiesToSet.forEach(({ name, value, options }) =>
						supabaseResponse.cookies.set(name, value, options),
					);
				},
			},
		},
	);

	// Do not run code between createServerClient and
	// supabase.auth.getClaims(). A simple mistake could make it very hard to debug
	// issues with users being randomly logged out.

	// IMPORTANT: If you remove getClaims() and you use server-side rendering
	// with the Supabase client, your users may be randomly logged out.
	const user = (await supabase.auth.getClaims())?.data?.claims;

	// Everything requires authentication EXCEPT the public routes below.
	// ('/signup' also covers /signup/* and the /signup-callback OAuth callback.)
	const publicRoutes = ["/login", "/signup"];

	const path = request.nextUrl.pathname;
	const isPublicRoute = publicRoutes.some((route) => path.startsWith(route));

	if (!isPublicRoute && !user) {
		return NextResponse.redirect(new URL("/login", request.url));
	}

	return supabaseResponse;
}
