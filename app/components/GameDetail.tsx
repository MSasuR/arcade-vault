"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { Game } from "../data";
import { formatDate, getTopScores, type LeaderboardEntry } from "@/lib/leaderboard";

const TOP_LIMIT = 10;

export default function GameDetail({ game }: { game: Game | null }) {
  const router = useRouter();
  const id = game?.id ?? "";
  const [result, setResult] = useState<{ id: string; rows: LeaderboardEntry[] | null } | null>(
    null,
  );
  const current = result?.id === id ? result : null;
  const status = !current ? "loading" : current.rows ? "ready" : "error";
  const scores = current?.rows ?? [];

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    getTopScores(id, TOP_LIMIT)
      .then((rows) => {
        if (!cancelled) setResult({ id, rows });
      })
      .catch(() => {
        if (!cancelled) setResult({ id, rows: null });
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (!game) return null;

  return (
    <div className="av-detail fade-in">
      <div>
        <div className="detail-cover">
          <div className={"cover-bg " + game.cover}></div>
        </div>
        <div style={{ marginTop: 20 }} className="detail-info">
          <div className="detail-tags">
            <span>{game.cat}</span>
            <span>1 JUGADOR</span>
            <span>TECLADO / TÁCTIL</span>
            <span>RETRO 1985</span>
          </div>
          <h2 className="neon-cyan">{game.title}</h2>
          <p>{game.long}</p>
          <div className="stat-strip">
            <div>
              <div className="l">Partidas</div>
              <div className="v">{game.plays}</div>
            </div>
            <div>
              <div className="l">Mejor global</div>
              <div
                className="v"
                style={{
                  color: "var(--magenta)",
                  textShadow: "0 0 6px rgba(255,0,110,0.5)",
                }}
              >
                {game.best.toLocaleString("es-ES")}
              </div>
            </div>
            <div>
              <div className="l">Dificultad</div>
              <div
                className="v"
                style={{
                  color: "var(--yellow)",
                  textShadow: "0 0 6px rgba(245,255,0,0.5)",
                }}
              >
                ★ ★ ★ ☆ ☆
              </div>
            </div>
          </div>
          <div className="detail-actions">
            <button className="btn xl pulse" onClick={() => router.push(`/player/${game.id}`)}>
              ▶ JUGAR AHORA
            </button>
            <button className="btn ghost lg" onClick={() => router.push("/games")}>
              VOLVER AL VAULT
            </button>
          </div>
        </div>
      </div>

      <aside>
        <div className="leaderboard">
          <h3>MEJORES PUNTUACIONES</h3>
          {status === "loading" && <div className="lb-msg">CARGANDO...</div>}
          {status === "error" && (
            <div className="lb-msg" style={{ color: "var(--magenta)" }}>
              NO SE PUDO CARGAR EL RANKING
            </div>
          )}
          {status === "ready" && scores.length === 0 && (
            <div className="lb-msg">AÚN NO HAY MARCAS. SÉ EL PRIMERO.</div>
          )}
          {status === "ready" &&
            scores.map((r, i) => (
              <div
                key={r.username}
                className={
                  "lb-row" + (i === 0 ? " top1" : i === 1 ? " top2" : i === 2 ? " top3" : "")
                }
              >
                <div className="rk">#{String(r.rank).padStart(2, "0")}</div>
                <div className="pl">
                  {r.username}
                  <div
                    style={{
                      fontSize: 10,
                      color: "var(--ink-faint)",
                      letterSpacing: "0.1em",
                    }}
                  >
                    {formatDate(r.createdAt)}
                  </div>
                </div>
                <div className="sc">{r.score.toLocaleString("es-ES")}</div>
              </div>
            ))}
        </div>
      </aside>
    </div>
  );
}
