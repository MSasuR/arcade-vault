"use client";

import React, { useMemo } from "react";
import { GAMES } from "../data";

interface User {
  name: string;
}

interface Route {
  name: string;
  id?: string;
}

interface GamePlayerProps {
  id: string;
  user: User | null;
  navigate: (r: Route) => void;
  onSaveScore: (entry: any) => void;
}

export default function GamePlayer({
  id,
  user,
  navigate,
  onSaveScore,
}: GamePlayerProps) {
  const game = useMemo(() => GAMES.find((g) => g.id === id), [id]);

  if (!game) return null;

  const handleEndGame = () => {
    if (user) {
      onSaveScore({
        gameId: game.id,
        playerName: user.name,
        score: 0,
      });
    }
    navigate({ name: "detalle", id: game.id });
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
        <button
          className="btn lg"
          onClick={() => navigate({ name: "detalle", id: game.id })}
        >
          VOLVER A DETALLES
        </button>
      </div>
    </div>
  );
}
