"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { Game } from "../data";
import { useUser } from "./useUser";
import { formatDate, getTopScores, getUserBest, type LeaderboardEntry } from "@/lib/leaderboard";

type Status = "loading" | "ready" | "error";

const TOP_LIMIT = 10;

export default function HallOfFame({ games }: { games: Game[] }) {
  const router = useRouter();
  const { user } = useUser();
  const [tab, setTab] = useState(games[0]?.id ?? "");
  // Resultado etiquetado con su pestaña/usuario: si no coincide con la selección actual, se
  // considera "cargando" y una respuesta tardía de otra pestaña nunca se pinta.
  const [top, setTop] = useState<{ tab: string; rows: LeaderboardEntry[] | null } | null>(null);
  const [best, setBest] = useState<{ key: string; entry: LeaderboardEntry | null } | null>(null);
  const game = games.find((g) => g.id === tab);
  const userId = user?.id;

  const currentTop = top?.tab === tab ? top : null;
  const status: Status = !currentTop ? "loading" : currentTop.rows ? "ready" : "error";
  const rows = currentTop?.rows ?? [];
  const mineKey = `${userId}:${tab}`;
  const mineReady = !!userId && best?.key === mineKey;
  const mine = mineReady ? best.entry : null;

  useEffect(() => {
    let cancelled = false;
    getTopScores(tab, TOP_LIMIT)
      .then((data) => {
        if (!cancelled) setTop({ tab, rows: data });
      })
      .catch(() => {
        if (!cancelled) setTop({ tab, rows: null });
      });
    return () => {
      cancelled = true;
    };
  }, [tab]);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    getUserBest(userId, tab)
      .then((entry) => {
        if (!cancelled) setBest({ key: `${userId}:${tab}`, entry });
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [tab, userId]);

  const slot = (i: number) => rows[i];

  return (
    <div className="av-hall fade-in">
      <div className="hall-head">
        <h1>SALÓN DE LA FAMA</h1>
        <p className="pixel" style={{ fontSize: 10 }}>
          LOS NOMBRES QUE NUNCA SE BORRAN DE LA PANTALLA
        </p>
      </div>

      <div className="hall-tabs">
        {games.map((g) => (
          <button
            key={g.id}
            className={"chip" + (tab === g.id ? " active" : "")}
            onClick={() => setTab(g.id)}
          >
            {g.title}
          </button>
        ))}
      </div>

      <div className="podium">
        <div className="podium-slot silver">
          <div className="rank-num">02</div>
          <div className="name">{slot(1)?.username ?? "---"}</div>
          <div className="score">{slot(1)?.score.toLocaleString("es-ES") ?? "---"}</div>
          <div className="date">{slot(1) ? formatDate(slot(1).createdAt) : "---"}</div>
        </div>
        <div className="podium-slot gold">
          <div
            className="pixel"
            style={{
              fontSize: 9,
              color: "var(--gold)",
              letterSpacing: "0.18em",
            }}
          >
            CAMPEÓN
          </div>
          <div className="rank-num" style={{ fontSize: 36, marginTop: 4 }}>
            01
          </div>
          <div className="name">{slot(0)?.username ?? "---"}</div>
          <div className="score" style={{ fontSize: 20 }}>
            {slot(0)?.score.toLocaleString("es-ES") ?? "---"}
          </div>
          <div className="date">{slot(0) ? formatDate(slot(0).createdAt) : "---"}</div>
        </div>
        <div className="podium-slot bronze">
          <div className="rank-num">03</div>
          <div className="name">{slot(2)?.username ?? "---"}</div>
          <div className="score">{slot(2)?.score.toLocaleString("es-ES") ?? "---"}</div>
          <div className="date">{slot(2) ? formatDate(slot(2).createdAt) : "---"}</div>
        </div>
      </div>

      <div className="hall-table">
        <div className="th">
          <div>RANGO</div>
          <div>JUGADOR</div>
          <div>PUNTUACIÓN</div>
          <div>FECHA</div>
        </div>
        {status === "loading" && <div className="hall-msg">CARGANDO...</div>}
        {status === "error" && (
          <div className="hall-msg" style={{ color: "var(--magenta)" }}>
            NO SE PUDO CARGAR EL RANKING
          </div>
        )}
        {status === "ready" && rows.length === 0 && (
          <div className="hall-msg">AÚN NO HAY MARCAS. SÉ EL PRIMERO.</div>
        )}
        {status === "ready" &&
          rows.map((r, i) => (
            <div
              key={r.username}
              className={"tr" + (i === 0 ? " top1" : i === 1 ? " top2" : i === 2 ? " top3" : "")}
              style={{ animationDelay: `${i * 50}ms` }}
            >
              <div className="rk">#{String(r.rank).padStart(2, "0")}</div>
              <div className="pl">{r.username}</div>
              <div className="sc">{r.score.toLocaleString("es-ES")}</div>
              <div className="dt">{formatDate(r.createdAt)}</div>
            </div>
          ))}
        {user && mineReady && (
          <React.Fragment>
            <div className="tr you-label">▸ TU MEJOR MARCA EN {game?.title}</div>
            {mine ? (
              <div className="tr you" style={{ animationDelay: `${rows.length * 50 + 50}ms` }}>
                <div className="rk" style={{ color: "var(--yellow)" }}>
                  #{String(mine.rank).padStart(2, "0")}
                </div>
                <div className="pl" style={{ color: "var(--yellow)" }}>
                  {mine.username}
                </div>
                <div
                  className="sc"
                  style={{
                    color: "var(--yellow)",
                    textShadow: "0 0 6px rgba(245,255,0,0.5)",
                  }}
                >
                  {mine.score.toLocaleString("es-ES")}
                </div>
                <div className="dt">{formatDate(mine.createdAt)}</div>
              </div>
            ) : (
              <div className="hall-msg">AÚN SIN MARCA</div>
            )}
          </React.Fragment>
        )}
      </div>

      <div style={{ textAlign: "center", marginTop: 32 }}>
        <button className="btn lg" onClick={() => router.push("/games")}>
          VOLVER A LA BIBLIOTECA
        </button>
      </div>
    </div>
  );
}
