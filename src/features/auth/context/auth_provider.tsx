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
	"/projects/8e2492cf-a825-470b-9ab3-ace672b1f0c7/stages/39bfb76d-7e8e-41c8-bcea-09754989e75a/";

const AUTH_PAGES = ["/login", "/signup/staff", "/signup/client", "/"] as const;

// ── Context ──────────────────────────────────────────────────────────────────

interface prop {
	children: ReactNode;
}

interface AuthContextValue {
	user: ProfileType | null;
	isLoading: boolean;
}

const auth_context = createContext<AuthContextValue>({
	user: null,
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
		<auth_context.Provider value={{ user: user ?? null, isLoading }}>
			{children}
		</auth_context.Provider>
	);
}

export function useAuth() {
	return useContext(auth_context);
}
