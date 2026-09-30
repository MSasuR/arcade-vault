"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export interface User {
  id: string;
  name: string;
}

// Usuario actual = sesión de Supabase + profiles.username.
export function useUser() {
  const [supabase] = useState(() => createClient());
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const load = async (id: string | null) => {
      let next: User | null = null;
      if (id) {
        const { data } = await supabase
          .from("profiles")
          .select("username")
          .eq("id", id)
          .maybeSingle();
        if (data) next = { id, name: data.username };
      }
      if (active) {
        setUser(next);
        setLoading(false);
      }
    };

    supabase.auth
      .getUser()
      .then(({ data }) => load(data.user?.id ?? null))
      .catch(() => {
        if (active) setLoading(false);
      });

    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "INITIAL_SESSION") return;
      // No se hacen llamadas a Supabase dentro del callback; se difieren.
      setTimeout(() => load(session?.user.id ?? null), 0);
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, [supabase]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
  }, [supabase]);

  return { user, loading, signOut };
}
