"use client";

import React, { useEffect } from "react";
import Nav from "./Nav";
import { useUser } from "./useUser";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, signOut } = useUser();

  useEffect(() => {
    try {
      // Clave legacy de la auth falsa (SPEC 01), reemplazada por Supabase Auth.
      localStorage.removeItem("av_user");
    } catch {}
  }, []);

  const handleSignOut = () => {
    signOut();
  };

  if (loading) return null;

  return (
    <>
      <Nav user={user} onSignOut={handleSignOut} />
      <main className="av-main">{children}</main>
      <footer
        style={{
          borderTop: "1px solid var(--line)",
          padding: "20px 32px",
          textAlign: "center",
          color: "var(--ink-faint)",
          fontFamily: "var(--mono)",
          fontSize: 11,
          letterSpacing: "0.16em",
        }}
      >
        © 2026 ARCADE VAULT · HECHO CON PIXELES Y NEÓN · v2.6.0
      </footer>
    </>
  );
}
