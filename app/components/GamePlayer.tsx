"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { Game } from "../data";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "./useUser";
import { PLAYABLE } from "./games/registry";
import type { GameInstance } from "./games/types";

export default function GamePlayer({ game }: { game: Game | null }) {
  const router = useRouter();
  const { user } = useUser();
  const [supabase] = useState(() => createClient());
  const id = game?.id ?? "";
  const factory = game ? PLAYABLE[game.id] : undefined;

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameRef = useRef<GameInstance | null>(null);
  const savedRef = useRef(false);
  const userRef = useRef(user);
  const [score, setScore] = useState(0);
  // null hasta que el juego emite la métrica: el HUD solo muestra las que el juego tiene
  const [lives, setLives] = useState<number | null>(null);
  const [level, setLevel] = useState<number | null>(null);
  const [lines, setLines] = useState<number | null>(null);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    userRef.current = user;
  }, [user]);

  // Inserta la marca en `scores` (user_id lo rellena auth.uid()). Si falla, savedRef
  // vuelve a false para que TERMINAR reintente; el juego no se interrumpe.
  const saveScore = useCallback(
    async (gameId: string, value: number) => {
      if (!userRef.current || value <= 0) return;
      const { error } = await supabase.from("scores").insert({ game_id: gameId, score: value });
      if (error) {
        console.error("No se pudo guardar la puntuación:", error.message);
        savedRef.current = false;
      }
    },
    [supabase],
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !factory) return;
    const gameId = id;
    savedRef.current = false;
    const instance = factory(canvas, {
      onScore: setScore,
      onLives: setLives,
      onLines: setLines,
      onLevel: (l) => {
        setLevel(l);
        // Reinicio tras GAME OVER: el nivel vuelve a 1 y se permite guardar de nuevo
        if (l === 1) savedRef.current = false;
      },
      onGameOver: (finalScore) => {
        // Si TERMINAR ya está guardando esta partida, el fin de partida no la guarda otra vez
        if (savedRef.current) return;
        savedRef.current = true;
        void saveScore(gameId, finalScore);
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

  const handleEndGame = async () => {
    if (!savedRef.current && gameRef.current) {
      savedRef.current = true;
      await saveScore(game.id, gameRef.current.getScore());
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
        {(!factory || lives !== null) && (
          <div className="hud-stat lives">
            <div className="l">Vidas</div>
            <div className="v">{factory ? lives : 3}</div>
          </div>
        )}
        {factory && lines !== null && (
          <div className="hud-stat level">
            <div className="l">Líneas</div>
            <div className="v">{lines}</div>
          </div>
        )}
        {(!factory || level !== null) && (
          <div className="hud-stat level">
            <div className="l">Nivel</div>
            <div className="v">{factory ? level : 1}</div>
          </div>
        )}
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
