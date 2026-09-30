"use client";

import { useRouter } from "next/navigation";
import type { Game } from "@/app/data";
import MiniCard from "./MiniCard";

export default function GamesPreviewSection({ games }: { games: Game[] }) {
  const router = useRouter();

  return (
    <section className="home-section reveal">
      <div className="section-head">
        <div className="kicker pixel neon-cyan">{"// 02"}</div>
        <h2 className="section-title">JUEGOS DISPONIBLES AHORA</h2>
        <div className="section-rule"></div>
      </div>
      <div className="mini-rail">
        {games.slice(0, 6).map((g) => (
          <MiniCard key={g.id} game={g} />
        ))}
      </div>
      <div style={{ textAlign: "center", marginTop: 24 }}>
        <button
          className="btn lg"
          onClick={() => router.push("/games")}
        >
          VER TODOS LOS JUEGOS →
        </button>
      </div>
    </section>
  );
}
