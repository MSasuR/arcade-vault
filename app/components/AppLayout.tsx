"use client";

import React, { useState, useEffect } from "react";
import Nav from "./Nav";

interface User {
  name: string;
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      const stored = localStorage.getItem("av_user");
      if (stored) setUser(JSON.parse(stored));
    } catch (e) {}
  }, []);

  const handleSignOut = () => {
    setUser(null);
    localStorage.removeItem("av_user");
  };

  if (!mounted) return null;

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
