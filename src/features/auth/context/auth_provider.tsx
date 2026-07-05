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

      // Project Team
      if (_event === "SIGNED_IN" && onAuthPage && user?.department_id=="22e9bc4d-394d-4ed5-abff-9e3a06a385aa") {
        router.push("/projects/8e2492cf-a825-470b-9ab3-ace672b1f0c7/workflows/6db34c78-c4f0-460d-a46e-cf71baaa0b8e/");
      }

      // Project Owner
      if (_event === "SIGNED_IN" && onAuthPage && user?.department_id=="527ac29d-a48c-4b03-a3b9-71f7a66d425f") {
        router.push("/projects/8e2492cf-a825-470b-9ab3-ace672b1f0c7/stages/39bfb76d-7e8e-41c8-bcea-09754989e75a/");
      }

      // Finance
      if (_event === "SIGNED_IN" && onAuthPage && user?.department_id=="f8611c71-e593-415f-ba03-96387841a2f7") {
        router.push("/insert-finance-page-here/");
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
