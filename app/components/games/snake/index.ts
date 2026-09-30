import type { GameCallbacks, GameInstance } from "../types";
import { FRUITS_SRC, type FruitName } from "./atlas";
import {
  CELL,
  COLOR_DANGER,
  COLOR_HEAD,
  COLOR_TEXT,
  FRUIT_DRAW_HEIGHT,
  POINTS_PER_FRUIT,
} from "./constants";
import {
  START_DIR,
  createInitialSnake,
  dirFromKey,
  isOpposite,
  levelFor,
  pickFruitCell,
  pickFruitName,
  queueTurn,
  stepSnake,
  stepsPerSecond,
  type Cell,
  type Dir,
} from "./logic";
import {
  drawBackground,
  drawGrid,
  drawLoadError,
  drawOverlay,
  drawReadyHint,
  drawSnake,
} from "./render";
import { createFruitSprites, loadImage, type FruitSprites } from "./sprites";

type State = "ready" | "playing" | "paused" | "gameover" | "win";

interface Fruit {
  cell: Cell;
  name: FruitName;
}

export function createSnake(canvas: HTMLCanvasElement, callbacks: GameCallbacks): GameInstance {
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D no disponible");
  const c = ctx;

  // ── Estado del juego ────────────────────────────────────────────────────────
  let snake: Cell[] = createInitialSnake();
  let dir: Dir = START_DIR;
  let queue: Dir[] = [];
  let fruit: Fruit | null = null;
  let lastFruitName: FruitName | null = null;
  let fruitsEaten = 0;
  let score = 0;
  let level = 1;
  let state: State = "ready";
  let stepAccum = 0; // segundos
  let lastTime: number | null = null;
  let sprites: FruitSprites | null = null;
  let loadFailed = false;
  let rafId = 0;
  let destroyed = false;

  function setScore(value: number) {
    score = value;
    callbacks.onScore(score);
  }

  function setLevel(value: number) {
    level = value;
    callbacks.onLevel?.(level);
  }

  function spawnFruit() {
    const cell = pickFruitCell(snake);
    if (cell === null) {
      fruit = null;
      return false;
    }
    const name = pickFruitName(lastFruitName);
    lastFruitName = name;
    fruit = { cell, name };
    return true;
  }

  function endGame(next: "gameover" | "win") {
    if (state === "gameover" || state === "win") return;
    state = next;
    callbacks.onGameOver(score);
  }

  function init() {
    snake = createInitialSnake();
    dir = START_DIR;
    queue = [];
    fruit = null;
    lastFruitName = null;
    fruitsEaten = 0;
    state = "ready";
    stepAccum = 0;
    lastTime = null;
    spawnFruit();
    setScore(0);
    setLevel(1);
  }

  function setPaused(value: boolean) {
    // Solo se pausa una partida en curso y solo se reanuda una partida pausada
    if (value && state !== "playing") return;
    if (!value && state !== "paused") return;
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

    if (e.code === "KeyP" || e.code === "Escape") {
      if (!e.repeat) setPaused(state !== "paused");
      return;
    }

    if (e.code === "Enter") {
      if (state === "gameover" || state === "win") {
        e.preventDefault();
        if (!e.repeat) init();
      }
      return;
    }

    const next = dirFromKey(e.code);
    if (next === null) return;
    // Las flechas no deben hacer scroll de la página
    if (e.code.startsWith("Arrow")) e.preventDefault();

    if (state === "ready") {
      // La primera dirección válida (no la reversa) empieza la partida
      if (isOpposite(dir, next)) return;
      state = "playing";
      lastTime = null;
      if (next !== dir) queue = queueTurn(dir, queue, next);
    } else if (state === "playing") {
      queue = queueTurn(dir, queue, next);
    }
  };

  const onVisibility = () => {
    if (document.hidden) setPaused(true);
  };

  window.addEventListener("keydown", onKeyDown);
  document.addEventListener("visibilitychange", onVisibility);

  // ── Actualización ───────────────────────────────────────────────────────────
  function step() {
    const queued = queue.shift();
    if (queued) dir = queued;

    const result = stepSnake(snake, dir, fruit ? fruit.cell : null);
    if (result.collision) {
      endGame("gameover");
      return;
    }
    snake = result.snake;
    if (!result.ate) return;

    fruitsEaten++;
    setScore(score + POINTS_PER_FRUIT);
    const nextLevel = levelFor(fruitsEaten);
    if (nextLevel !== level) setLevel(nextLevel);
    // Sin celda libre el tablero está lleno: victoria
    if (!spawnFruit()) endGame("win");
  }

  function update(dt: number) {
    if (state !== "playing") return;
    stepAccum += dt;
    const interval = 1 / stepsPerSecond(level);
    // Con dt <= 0.05 s y un intervalo >= 0.0625 s nunca hay más de un paso por frame
    if (stepAccum >= interval) {
      stepAccum -= interval;
      step();
    }
  }

  // ── Render ──────────────────────────────────────────────────────────────────
  function draw() {
    if (loadFailed) {
      drawLoadError(c);
      return;
    }
    if (!sprites) return;

    drawBackground(c);
    drawGrid(c);
    if (fruit)
      sprites.drawFruit(
        fruit.name,
        fruit.cell.x * CELL + CELL / 2,
        fruit.cell.y * CELL + CELL / 2,
        FRUIT_DRAW_HEIGHT,
      );
    drawSnake(c, snake, dir);

    const finalScore = `PUNTUACIÓN: ${score.toLocaleString("es-ES")}`;
    if (state === "ready") drawReadyHint(c);
    else if (state === "paused") drawOverlay(c, "PAUSA", COLOR_HEAD);
    else if (state === "gameover")
      drawOverlay(c, "GAME OVER", COLOR_DANGER, [finalScore, "ENTER PARA REINICIAR"]);
    else if (state === "win")
      drawOverlay(c, "¡TABLERO COMPLETO!", COLOR_TEXT, [finalScore, "ENTER PARA REINICIAR"]);
  }

  // ── Loop ────────────────────────────────────────────────────────────────────
  function frame(ts: number) {
    if (destroyed) return;
    rafId = requestAnimationFrame(frame);
    const dt = lastTime === null ? 0 : Math.min((ts - lastTime) / 1000, 0.05);
    lastTime = ts;
    update(dt);
    draw();
  }

  // Los valores iniciales salen ya (el HUD los muestra de inmediato); el loop arranca
  // cuando la imagen termina de cargar.
  init();
  const cancelLoad = loadImage(
    FRUITS_SRC,
    (img) => {
      if (destroyed) return;
      sprites = createFruitSprites(c, img);
      lastTime = null;
      rafId = requestAnimationFrame(frame);
    },
    () => {
      if (destroyed) return;
      loadFailed = true;
      console.error("No se pudo cargar el atlas de frutas de Snake:", FRUITS_SRC);
      draw();
    },
  );

  return {
    pause: () => setPaused(true),
    resume: () => setPaused(false),
    getScore: () => score,
    destroy: () => {
      if (destroyed) return;
      destroyed = true;
      cancelAnimationFrame(rafId);
      cancelLoad();
      window.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("visibilitychange", onVisibility);
    },
  };
}
