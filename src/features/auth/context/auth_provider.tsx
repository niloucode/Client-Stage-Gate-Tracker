"use client";

import {
	createContext,
	useContext,
	useEffect,
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

const DEPARTMENT_IDS = {
	PROJECT_TEAM: "22e9bc4d-394d-4ed5-abff-9e3a06a385aa",
	PROJECT_OWNER: "527ac29d-a48c-4b03-a3b9-71f7a66d425f",
	FINANCE: "f8611c71-e593-415f-ba03-96387841a2f7",
} as const;

const DEFAULT_PROJECT_REDIRECT =
	"/projects/";

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

	// Keep latest values in refs so the auth listener (subscribed once) always
	// reads current user / pathname without re-subscribing.
	const userRef = useRef(user);
	userRef.current = user;

	const pathnameRef = useRef(pathname);
	pathnameRef.current = pathname;

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

	useEffect(() => {
		const {
			data: { subscription },
		} = supabase.auth.onAuthStateChange((_event, session) => {
			queryClient.invalidateQueries({ queryKey: profileKeys.currentUser() });

			if (!session?.user?.id) return;
			if (_event !== "SIGNED_IN") return;

			const currentPathname = pathnameRef.current;
			if (!(AUTH_PAGES as readonly string[]).includes(currentPathname)) return;

			const currentUser = userRef.current;

			if (currentUser?.client_id) {
				router.push("/client/" + currentUser.client_id);
				return;
			}

			const deptId = currentUser?.department_id;
			if (
				deptId === DEPARTMENT_IDS.PROJECT_TEAM ||
				deptId === DEPARTMENT_IDS.PROJECT_OWNER
			) {
				router.push(DEFAULT_PROJECT_REDIRECT);
			} else if (deptId === DEPARTMENT_IDS.FINANCE) {
				router.push("/insert-finance-page-here/");
			}
		});

		return () => subscription.unsubscribe();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	return (
		<auth_context.Provider value={{ user: user ?? null, isLoading, logout }}>
			{children}
		</auth_context.Provider>
	);
}

export function useAuth() {
	return useContext(auth_context);
}
