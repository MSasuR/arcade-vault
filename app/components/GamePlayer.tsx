"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { GAMES } from "../data";
import { useUser } from "./useUser";
import { PLAYABLE } from "./games/registry";
import type { AsteroidsGame } from "./games/asteroids/types";

export default function GamePlayer({ id }: { id: string }) {
  const router = useRouter();
  const { user } = useUser();
  const game = useMemo(() => GAMES.find((g) => g.id === id), [id]);
  const factory = game ? PLAYABLE[game.id] : undefined;

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameRef = useRef<AsteroidsGame | null>(null);
  const savedRef = useRef(false);
  const userRef = useRef(user);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [level, setLevel] = useState(1);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    userRef.current = user;
  }, [user]);

  const saveScore = useCallback((gameId: string, value: number) => {
    const current = userRef.current;
    if (!current || value <= 0) return;
    try {
      const all = JSON.parse(localStorage.getItem("av_scores") || "[]");
      all.push({
        gameId,
        playerName: current.name,
        score: value,
        at: Date.now(),
      });
      localStorage.setItem("av_scores", JSON.stringify(all));
    } catch {}
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !factory) return;
    const gameId = id;
    savedRef.current = false;
    const instance = factory(canvas, {
      onScore: setScore,
      onLives: setLives,
      onLevel: (l) => {
        setLevel(l);
        // Reinicio tras GAME OVER: el nivel vuelve a 1 y se permite guardar de nuevo
        if (l === 1) savedRef.current = false;
      },
      onGameOver: (finalScore) => {
        savedRef.current = true;
        saveScore(gameId, finalScore);
      },
      onPause: setPaused,
    });
    gameRef.current = instance;
    return () => {
      instance.destroy();
      gameRef.current = null;
    };
  }, [id, factory, saveScore]);

  if (!game) return null;

  const handleEndGame = () => {
    if (!savedRef.current && gameRef.current) {
      savedRef.current = true;
      saveScore(game.id, gameRef.current.getScore());
    }
    router.push(`/games/${game.id}`);
  };

  const handlePause = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.blur();
    if (paused) gameRef.current?.resume();
    else gameRef.current?.pause();
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
          <div className="v">{factory ? score : 0}</div>
        </div>
        <div className="hud-stat lives">
          <div className="l">Vidas</div>
          <div className="v">{factory ? lives : 3}</div>
        </div>
        <div className="hud-stat level">
          <div className="l">Nivel</div>
          <div className="v">{factory ? level : 1}</div>
        </div>
        <div className="hud-actions">
          <button className="btn ghost" onClick={handlePause} disabled={!factory}>
            {paused ? "REANUDAR" : "PAUSAR"}
          </button>
          <button className="btn ghost" onClick={handleEndGame}>
            TERMINAR
          </button>
        </div>
      </div>

      <div className="crt">
        <div className="crt::before"></div>
        <div className="crt-screen">
          {factory ? (
            <canvas ref={canvasRef} className="game-canvas" width={800} height={600} />
          ) : (
            <>
              <div className="game-arena">
                <div className="grid-floor"></div>
                <div className="player-ship"></div>
                <div className="enemy e1"></div>
                <div className="enemy e2"></div>
                <div className="enemy e3"></div>
              </div>
              <div className="crt-content">JUEGO AQUÍ</div>
            </>
          )}
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
