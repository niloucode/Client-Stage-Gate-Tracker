"use client";

import {
	createContext,
	useContext,
	useEffect,
	type ReactNode,
} from "react";
import { useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { useCurrentUser } from "@/entities/profile";
import { profileKeys } from "@/shared/query/keys";
import type { ProfileType } from "@/shared/types";
import { useRouter, usePathname } from "next/navigation";

// ── Route constants ──────────────────────────────────────────────────────────

const DEPARTMENT_IDS = {
	PROJECT_TEAM: "22e9bc4d-394d-4ed5-abff-9e3a06a385aa",
	PROJECT_OWNER: "527ac29d-a48c-4b03-a3b9-71f7a66d425f",
} as const;

// TEMPORARY redirect target: project owners/team land on the existing
// ProjectDashboard feature (/projects) until the Landing Dashboard
// (/dashboard) is built — then flip this to "/dashboard".
const DEFAULT_PROJECT_REDIRECT = "/projects";

const AUTH_PAGES = ["/login", "/signup/staff", "/signup/client", "/"] as const;

// ── Context ──────────────────────────────────────────────────────────────────

interface prop {
	children: ReactNode;
}

interface AuthContextValue {
  user: ProfileType | null;
  logout: () => Promise<void>; // or () => void if synchronous
  isLoading: boolean;
}

const auth_context = createContext<AuthContextValue>({
  user: null,
  logout: async () => {}, // dummy function so consumer hooks never run into null checks
  isLoading: true,
});

export function AuthProvider({ children }: prop) {
	const { data: user, isLoading } = useCurrentUser();
	const queryClient = useQueryClient();
	const supabase = createClient();
	const router = useRouter();
	const pathname = usePathname();

	const logout = async () => {
        try {
            // 1. Sign out from Supabase (clears local auth tokens)
            await supabase.auth.signOut();
            
            // 2. Clear TanStack Query cache so stale user/profile data is wiped immediately
            queryClient.clear();

            // 3. Redirect user to login page
            router.push("/login");
            router.refresh();
        } catch (error) {
            console.error("Error during logout:", error);
        }
    };

	// Keep the subscription for cache invalidation only. The actual
	// post-login redirect is a state-driven effect below, so the profile is
	// always loaded before the role decision — the old listener-based
	// redirect read a stale ref and usually never fired.
	useEffect(() => {
		const {
			data: { subscription },
		} = supabase.auth.onAuthStateChange((_event, session) => {
			if (session?.user?.id) {
				queryClient.invalidateQueries({ queryKey: profileKeys.currentUser() });
			}
		});

		return () => subscription.unsubscribe();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	// Redirect signed-in users off auth pages, by role. Runs whenever the
	// resolved profile changes, so there is no race with the profile query.
	useEffect(() => {
		if (isLoading || !user) return;
		if (!(AUTH_PAGES as readonly string[]).includes(pathname)) return;

		if (user.client_id) {
			// TEMPORARY: clients land on /contracts until the Client Portal
			// (/client) is built.
			router.replace("/contracts");
			return;
		}

		const deptId = user.department_id;
		if (
			deptId === DEPARTMENT_IDS.PROJECT_TEAM ||
			deptId === DEPARTMENT_IDS.PROJECT_OWNER
		) {
			router.replace(DEFAULT_PROJECT_REDIRECT);
			return;
		}

		// Fallback for signed-in profiles with no recognized role: never leave
		// a logged-in user stranded on an auth page.
		router.replace(DEFAULT_PROJECT_REDIRECT);
	}, [user, pathname, isLoading, router]);

	return (
		<auth_context.Provider value={{ user: user ?? null, isLoading, logout }}>
			{children}
		</auth_context.Provider>
	);
}

export function useAuth() {
	return useContext(auth_context);
}
