"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { createClient } from "@/lib/supabase/client";
import { ProfileType } from "@/shared/types";
import { useRouter, usePathname } from "next/navigation";
interface prop {
  children: ReactNode;
}

const auth_context = createContext<{ user: ProfileType | null }>({
  user: null,
});

export function AuthProvider({ children }: prop) {
  const [user, setUser] = useState<ProfileType | null>(null);
  const supabase = createClient();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    //only redirect on new logins
    async function set_prisma_user(id: string, redirect = false) {
      if (id != "") {
        const { data, error } = await supabase
          .from("Profiles")
          .select()
          .eq("profile_id", id)
          .single();

        if (error || !data) {
          setUser(null);
          return;
        }

        const new_user: ProfileType = {
          client_id: data.client_id,
          department_id: data.department_id,
          phone: data.phone,
          email: data.email,
          image_id: data.image_id,
          first_name: data.first_name,
          last_name: data.last_name,
          profile_id: data.profile_id,
          job_title: data.job_title,
          is_deleted: data.is_deleted,
          deleted_at: data.deleted_at,
        };

        setUser(new_user);

        const onAuthPage = pathname === '/login' || pathname === '/signup' || pathname === '/client-signup' || pathname === '/';
        if (redirect && onAuthPage && new_user?.client_id) {
          router.push("/client/" + new_user?.client_id);
        }
        // TODO: redirect department users to their correct landing page once that route is built
        // The /department_id/ path does not exist — backend needs to define this route
      }
    }

    supabase.auth
      .getUser()
      .then(({ data }) => set_prisma_user(data.user?.id ? data.user?.id : ""));
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session?.user?.id) {
        setUser(null);
        return;
      }
      
      const onAuthPage = pathname === '/login' || pathname === '/signup' || pathname === '/client-signup' || pathname === '/';
      const redirect = _event == "SIGNED_IN" && onAuthPage;
      set_prisma_user(session.user.id, redirect);
    });
    return () => subscription.unsubscribe();
  }, [pathname, router, supabase]);

  return (
    <auth_context.Provider value={{ user }}>{children}</auth_context.Provider>
  );
}

export function useAuth() {
  const context = useContext(auth_context);

  return context;
}
