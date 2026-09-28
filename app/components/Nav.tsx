"use client";

import React, { useState } from "react";
import { useRouter, usePathname } from "next/navigation";

interface User {
  name: string;
}

export default function Nav({
  user,
  onSignOut,
}: {
  user: User | null;
  onSignOut: () => void;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const isActive = (path: string) => {
    return pathname === path || pathname.startsWith(path + "/");
  };

  const go = (path: string) => {
    setOpen(false);
    router.push(path);
  };

  return (
    <React.Fragment>
      <nav className="av-nav">
        <div className="logo" onClick={() => go("/")}>
          <div className="logo-mark"></div>
          <div className="logo-text neon-cyan">
            ARCADE <span className="neon-magenta">VAULT</span>
          </div>
        </div>
        <div className="links">
          <a
            className={isActive("/games") ? "active" : ""}
            onClick={() => go("/games")}
          >
            Biblioteca
          </a>
          <a
            className={isActive("/salon") ? "active" : ""}
            onClick={() => go("/salon")}
          >
            Salón de la Fama
          </a>
        </div>
        <div className="spacer"></div>
        <div className="coin-counter">
          <span className="coin"></span>
          <span>CRÉDITOS · 03</span>
        </div>
        {user ? (
          <button
            className="btn ghost auth-btn"
            onClick={onSignOut}
          >
            {user.name} ▾
          </button>
        ) : (
          <button
            className="btn auth-btn"
            onClick={() => go("/auth")}
          >
            Iniciar Sesión
          </button>
        )}
        <button
          className="btn ghost hamburger"
          onClick={() => setOpen(true)}
          aria-label="Menú"
        >
          ≡
        </button>
      </nav>

      <div
        className={"av-mobile-backdrop" + (open ? " open" : "")}
        onClick={() => setOpen(false)}
      ></div>
      <aside className={"av-mobile-panel" + (open ? " open" : "")}>
        <div
          className="pixel neon-cyan"
          style={{ fontSize: 11, marginBottom: 16 }}
        >
          MENÚ
        </div>
        <a
          className={isActive("/games") ? "active" : ""}
          onClick={() => go("/games")}
        >
          Biblioteca
        </a>
        <a
          className={isActive("/salon") ? "active" : ""}
          onClick={() => go("/salon")}
        >
          Salón de la Fama
        </a>
        <a
          className={isActive("/auth") ? "active" : ""}
          onClick={() => go("/auth")}
        >
          {user ? "Cuenta" : "Iniciar Sesión"}
        </a>
        <div style={{ flex: 1 }}></div>
        <div
          className="pixel"
          style={{
            fontSize: 9,
            color: "var(--ink-faint)",
            letterSpacing: "0.16em",
          }}
        >
          CRÉDITOS · 03
        </div>
      </aside>
    </React.Fragment>
  );
}
