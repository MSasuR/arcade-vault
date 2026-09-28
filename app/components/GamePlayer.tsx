"use client";

import React, { useMemo } from "react";
import { useRouter } from "next/navigation";
import { GAMES } from "../data";
import { useUser } from "./useUser";

export default function GamePlayer({ id }: { id: string }) {
  const router = useRouter();
  const { user } = useUser();
  const game = useMemo(() => GAMES.find((g) => g.id === id), [id]);

  if (!game) return null;

  const handleEndGame = () => {
    if (user) {
      try {
        const all = JSON.parse(localStorage.getItem("av_scores") || "[]");
        all.push({
          gameId: game.id,
          playerName: user.name,
          score: 0,
          at: Date.now(),
        });
        localStorage.setItem("av_scores", JSON.stringify(all));
      } catch {}
    }
    router.push(`/games/${game.id}`);
  };

  return (
    <div className="av-player fade-in">
      <div className="player-hud">
        <div className="hud-stat">
          <div className="l">Juego</div>
          <div className="v">{game.title}</div>
        </div>
        <div className="hud-stat">
          <div className="l">Puntuación</div>
          <div className="v">0</div>
        </div>
        <div className="hud-stat lives">
          <div className="l">Vidas</div>
          <div className="v">3</div>
        </div>
        <div className="hud-stat level">
          <div className="l">Nivel</div>
          <div className="v">1</div>
        </div>
        <div className="hud-actions">
          <button className="btn ghost">PAUSAR</button>
          <button className="btn ghost" onClick={handleEndGame}>
            TERMINAR
          </button>
        </div>
      </div>

      <div className="crt">
        <div className="crt::before"></div>
        <div className="crt-screen">
          <div className="game-arena">
            <div className="grid-floor"></div>
            <div className="player-ship"></div>
            <div className="enemy e1"></div>
            <div className="enemy e2"></div>
            <div className="enemy e3"></div>
          </div>
          <div className="crt-content">JUEGO AQUÍ</div>
        </div>
        <div className="crt-bottom">
          <div>ARCADE VAULT</div>
          <div className="led">ACTIVO</div>
        </div>
      </div>

      <div style={{ textAlign: "center", marginTop: 32 }}>
        <button className="btn lg" onClick={() => router.push(`/games/${game.id}`)}>
          VOLVER A DETALLES
        </button>
      </div>
    </div>
  );
}
