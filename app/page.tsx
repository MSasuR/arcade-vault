"use client";

import React, { useState, useEffect } from "react";
import { GAMES, CATS, seededScores } from "./data";

// Component imports (will be defined below)
import Nav from "./components/Nav";
import Auth from "./components/Auth";
import Library from "./components/Library";
import GameDetail from "./components/GameDetail";
import GamePlayer from "./components/GamePlayer";
import HallOfFame from "./components/HallOfFame";

interface User {
  name: string;
}

interface Route {
  name: string;
  id?: string;
}

export default function App() {
  const [route, setRoute] = useState<Route>(() => {
    if (typeof window === "undefined") return { name: "biblioteca" };
    try {
      const h = location.hash.replace(/^#/, "");
      if (h) return JSON.parse(decodeURIComponent(h));
    } catch (e) {}
    return { name: "biblioteca" };
  });

  const [user, setUser] = useState<User | null>(() => {
    if (typeof window === "undefined") return null;
    try {
      return JSON.parse(localStorage.getItem("av_user") || "null");
    } catch (e) {
      return null;
    }
  });

  useEffect(() => {
    location.hash = encodeURIComponent(JSON.stringify(route));
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [route]);

  const navigate = (r: Route) => setRoute(r);

  const handleLogin = (u: User | null) => {
    setUser(u);
    if (u) {
      localStorage.setItem("av_user", JSON.stringify(u));
    } else {
      localStorage.removeItem("av_user");
    }
  };

  const handleSignOut = () => {
    setUser(null);
    localStorage.removeItem("av_user");
  };

  const handleSaveScore = (entry: any) => {
    try {
      const all = JSON.parse(localStorage.getItem("av_scores") || "[]");
      all.push({ ...entry, at: Date.now() });
      localStorage.setItem("av_scores", JSON.stringify(all));
    } catch (e) {}
  };

  let screen = null;
  if (route.name === "biblioteca")
    screen = <Library navigate={navigate} />;
  else if (route.name === "detalle")
    screen = <GameDetail id={route.id || ""} navigate={navigate} />;
  else if (route.name === "player")
    screen = (
      <GamePlayer
        id={route.id || ""}
        user={user}
        navigate={navigate}
        onSaveScore={handleSaveScore}
      />
    );
  else if (route.name === "auth")
    screen = <Auth navigate={navigate} onLogin={handleLogin} />;
  else if (route.name === "salon")
    screen = <HallOfFame user={user} navigate={navigate} />;

  return (
    <React.Fragment>
      <Nav route={route} navigate={navigate} user={user} onSignOut={handleSignOut} />
      <main className="av-main">{screen}</main>
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
    </React.Fragment>
  );
}

// Make data available globally for components
(globalThis as any).GAMES = GAMES;
(globalThis as any).CATS = CATS;
(globalThis as any).seededScores = seededScores;
