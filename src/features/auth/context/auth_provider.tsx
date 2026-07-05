"use client";

import {
  createContext,
  useContext,
  useEffect,
  type ReactNode,
} from "react";
import { useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { useCurrentUser } from "@/entities/profile/queries";
import { profileKeys } from "@/shared/query/keys";
import type { ProfileType } from "@/shared/types";
import { useRouter, usePathname } from "next/navigation";

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

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      queryClient.invalidateQueries({ queryKey: profileKeys.currentUser() });

      if (!session?.user?.id) return;

      const onAuthPage =
        pathname === "/login" ||
        pathname === "/signup" ||
        pathname === "/client-signup" ||
        pathname === "/";

      if (_event === "SIGNED_IN" && onAuthPage && user?.client_id) {
        router.push("/client/" + user.client_id);
      }
      else if(_event === "SIGNED_IN" && onAuthPage && user?.department_id) {
        router.push("/department/" + user.department_id);
      }
    });

    return () => subscription.unsubscribe();
  }, [pathname, router, supabase, queryClient, user]);

  return (
    <auth_context.Provider value={{ user: user ?? null, isLoading }}>
      {children}
    </auth_context.Provider>
  );
}

export function useAuth() {
  return useContext(auth_context);
}
