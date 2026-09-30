import type { GameCallbacks, GameInstance } from "../types";
import {
  BASE_DROP_INTERVAL,
  DROP_STEP_PER_LEVEL,
  LINES_PER_LEVEL,
  MIN_DROP_INTERVAL,
} from "./constants";
import {
  clearLines,
  collide,
  createBoard,
  ghostY,
  lineScore,
  merge,
  randomPiece,
  tryRotate,
  type Board,
  type Piece,
} from "./logic";
import { drawOverlay, drawScene } from "./render";

type State = "playing" | "paused" | "gameover";

const GAME_KEYS = ["ArrowLeft", "ArrowRight", "ArrowDown", "ArrowUp", "Space"];

export function createTetris(canvas: HTMLCanvasElement, callbacks: GameCallbacks): GameInstance {
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D no disponible");

  // ── Estado del juego ────────────────────────────────────────────────────────
  let board: Board = createBoard();
  let current: Piece = randomPiece();
  let next: Piece = randomPiece();
  let score = 0;
  let lines = 0;
  let level = 1;
  let state: State = "playing";
  let dropAccum = 0; // segundos
  let dropInterval = BASE_DROP_INTERVAL; // segundos
  let lastTime: number | null = null;
  let rafId = 0;
  let destroyed = false;

  function setScore(value: number) {
    score = value;
    callbacks.onScore(score);
  }

  function endGame() {
    if (state === "gameover") return;
    state = "gameover";
    callbacks.onGameOver(score);
  }

  function spawn() {
    current = next;
    next = randomPiece();
    if (collide(board, current.shape, current.x, current.y)) endGame();
  }

  function lockPiece() {
    merge(board, current);
    const cleared = clearLines(board);
    if (cleared) {
      lines += cleared;
      setScore(score + lineScore(cleared, level));
      callbacks.onLines?.(lines);
      const nextLevel = Math.floor(lines / LINES_PER_LEVEL) + 1;
      if (nextLevel !== level) {
        level = nextLevel;
        callbacks.onLevel?.(level);
      }
      dropInterval = Math.max(
        MIN_DROP_INTERVAL,
        BASE_DROP_INTERVAL - (level - 1) * DROP_STEP_PER_LEVEL,
      );
    }
    spawn();
  }

  function softDrop() {
    if (!collide(board, current.shape, current.x, current.y + 1)) {
      current.y++;
      setScore(score + 1);
    } else {
      lockPiece();
    }
  }

  function hardDrop() {
    const gy = ghostY(board, current);
    setScore(score + (gy - current.y) * 2);
    current.y = gy;
    lockPiece();
  }

  function init() {
    board = createBoard();
    score = 0;
    lines = 0;
    level = 1;
    state = "playing";
    dropInterval = BASE_DROP_INTERVAL;
    dropAccum = 0;
    lastTime = null;
    next = randomPiece();
    spawn();
    // Valores iniciales: el HUD los muestra desde el primer render y GamePlayer
    // rearma el guardado al ver nivel 1 tras un GAME OVER.
    callbacks.onScore(score);
    callbacks.onLines?.(lines);
    callbacks.onLevel?.(level);
  }

  function setPaused(value: boolean) {
    if (state === "gameover") return;
    if (value === (state === "paused")) return;
    state = value ? "paused" : "playing";
    // Evita un salto de dt al reanudar
    if (!value) lastTime = null;
    callbacks.onPause?.(value);
  }

  // ── Input ───────────────────────────────────────────────────────────────────
  const isFormTarget = (e: KeyboardEvent) => {
    const t = e.target;
    return (
      t instanceof HTMLElement &&
      (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.tagName === "SELECT")
    );
  };

  const onKeyDown = (e: KeyboardEvent) => {
    if (isFormTarget(e)) return;
    if (GAME_KEYS.includes(e.code)) e.preventDefault();

    if (e.code === "KeyP") {
      if (!e.repeat) setPaused(state !== "paused");
      return;
    }
    if (state === "gameover") {
      if (e.code === "Enter") {
        e.preventDefault();
        if (!e.repeat) init();
      }
      return;
    }
    if (state === "paused") return;

    switch (e.code) {
      case "ArrowLeft":
        if (!collide(board, current.shape, current.x - 1, current.y)) current.x--;
        break;
      case "ArrowRight":
        if (!collide(board, current.shape, current.x + 1, current.y)) current.x++;
        break;
      case "ArrowDown":
        softDrop();
        break;
      case "ArrowUp":
      case "KeyX":
        tryRotate(board, current);
        break;
      case "Space":
        hardDrop();
        break;
    }
  };

  const onVisibility = () => {
    if (document.hidden) setPaused(true);
  };

  window.addEventListener("keydown", onKeyDown);
  document.addEventListener("visibilitychange", onVisibility);

  // ── Loop ────────────────────────────────────────────────────────────────────
  function frame(ts: number) {
    if (destroyed) return;
    rafId = requestAnimationFrame(frame);
    const dt = lastTime === null ? 0 : Math.min((ts - lastTime) / 1000, 0.05);
    lastTime = ts;

    if (state === "playing") {
      dropAccum += dt;
      if (dropAccum >= dropInterval) {
        dropAccum = 0;
        if (!collide(board, current.shape, current.x, current.y + 1)) current.y++;
        else lockPiece();
      }
    }

    // ctx no es nulo aquí: se comprobó al crear el juego
    drawScene(ctx!, board, current, next);
    if (state === "paused") drawOverlay(ctx!, "PAUSA", "#00f5ff");
    else if (state === "gameover")
      drawOverlay(ctx!, "GAME OVER", "#ff006e", [
        `PUNTUACIÓN: ${score.toLocaleString("es-ES")}`,
        "ENTER PARA REINICIAR",
      ]);
  }

  init();
  rafId = requestAnimationFrame(frame);

  return {
    pause: () => setPaused(true),
    resume: () => setPaused(false),
    getScore: () => score,
    destroy: () => {
      if (destroyed) return;
      destroyed = true;
      cancelAnimationFrame(rafId);
      window.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("visibilitychange", onVisibility);
    },
  };
}
