"use client";

import {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useRef,
	type ReactNode,
} from "react";
import { useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { useCurrentUser } from "@/entities/profile";
import { profileKeys } from "@/shared/query/keys";
import type { ProfileType } from "@/shared/types";
import { useRouter, usePathname } from "next/navigation";

// ── Route constants ──────────────────────────────────────────────────────────

const DEFAULT_PROJECT_REDIRECT = "/dashboard";

const AUTH_PAGES = ["/login", "/signup/staff", "/signup/client", "/"] as const;

// ── Context ──────────────────────────────────────────────────────────────────

interface AuthProviderProps {
	children: ReactNode;
}

interface AuthContextValue {
	user: ProfileType | null;
	logout: () => Promise<void>;
	isLoading: boolean;
}

const auth_context = createContext<AuthContextValue>({
	user: null,
	logout: async () => {},
	isLoading: true,
});

export function AuthProvider({ children }: AuthProviderProps) {
	const { data: user, isLoading } = useCurrentUser();
	const queryClient = useQueryClient();
	const supabase = createClient();
	const router = useRouter();
	const pathname = usePathname();
	// Guards logout against re-entry while sign-out is still in flight.
	const loggingOutRef = useRef(false);

	const logout = useCallback(async () => {
		// Re-entrancy guard: a double press while logout is in flight is a
		// no-op (the menu can fire the handler twice on fast clicks).
		if (loggingOutRef.current) return;
		loggingOutRef.current = true;
		try {
			// 1. Sign out from Supabase — LOCAL scope clears the current
			// browser session without a server round-trip, so logout always
			// works even offline (global scope can hang on network failures).
			await supabase.auth.signOut({ scope: "local" });
		} catch (error) {
			console.error("Error during logout:", error);
		} finally {
			// 2. Clear TanStack Query cache so stale user/profile data is
			// wiped immediately, then navigate to the login page.
			// NOTE: no router.refresh() here — refresh re-renders the CURRENT
			// route and can supersede the in-flight push, leaving the user on
			// the (logged-out) app page until a second press. replace() also
			// keeps the app shell out of the history stack.
			queryClient.clear();
			router.replace("/login");
			loggingOutRef.current = false;
		}
		// createClient() returns the same browser client per URL+key, so the
		// closure is stable — excluding it keeps the callback identity stable.
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [queryClient, router]);

	// Keep the subscription for cache invalidation only. The actual
	// post-login redirect is a state-driven effect below, so the profile is
	// always loaded before the role decision — the old listener-based
	// redirect read a stale ref and usually never fired.
	useEffect(() => {
		const {
			data: { subscription },
		} = supabase.auth.onAuthStateChange((event, session) => {
			// Invalidate on sign-in AND sign-out so a session ended elsewhere
			// never leaves stale profile data behind.
			if (event === "SIGNED_OUT" || session?.user?.id) {
				void queryClient.invalidateQueries({
					queryKey: profileKeys.currentUser(),
				});
			}
		});

		return () => subscription.unsubscribe();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	// Redirect signed-in users off auth pages. Runs whenever the resolved
	// profile changes, so there is no race with the profile query.
	useEffect(() => {
		if (isLoading || !user) return;
		if (!(AUTH_PAGES as readonly string[]).includes(pathname)) return;

		// TODO(client-portal): route client profiles (user.client_id set) to
		// their own landing dashboard once it exists (planned in
		// features/landing-dashboard). Until then clients land on the staff
		// dashboard — server-side authz still guards workspace data, and the
		// (app) shell provides the logout affordance.
		router.replace(DEFAULT_PROJECT_REDIRECT);
	}, [user, pathname, isLoading, router]);

	const value = useMemo(
		() => ({ user: user ?? null, isLoading, logout }),
		[user, isLoading, logout],
	);

	return (
		<auth_context.Provider value={value}>
			{children}
		</auth_context.Provider>
	);
}

export function useAuth() {
	return useContext(auth_context);
}
