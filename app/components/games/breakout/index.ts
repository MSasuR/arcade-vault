import type { GameCallbacks, GameInstance } from "../types";
import { createAudio } from "./audio";
import {
  BALL_SIZE,
  BASE_BALL_VX,
  BASE_BALL_VY,
  BLOCKS_ORIGIN_X,
  BLOCKS_ORIGIN_Y,
  BLOCK_H,
  BLOCK_W,
  EXPLOSION_DURATION,
  H,
  PADDLE_H,
  PADDLE_SPEED,
  PADDLE_W,
  PADDLE_Y,
  POINTS_PER_BLOCK,
  SPRITESHEET_SRC,
  START_LIVES,
  W,
  type BlockColor,
} from "./constants";
import { LEVELS } from "./levels";
import { createSprites, loadSpritesheet, type Sprites } from "./sprites";

type State = "playing" | "paused" | "gameover" | "win";

interface Block {
  x: number;
  y: number;
  w: number;
  h: number;
  color: BlockColor;
  alive: boolean;
}

interface Explosion {
  x: number;
  y: number;
  w: number;
  h: number;
  color: BlockColor;
  elapsed: number; // ms
}

const GAME_KEYS = ["ArrowLeft", "ArrowRight"];

export function createBreakout(canvas: HTMLCanvasElement, callbacks: GameCallbacks): GameInstance {
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D no disponible");
  const c = ctx;
  const audio = createAudio();

  // ── Estado del juego ────────────────────────────────────────────────────────
  const paddle = { x: (W - PADDLE_W) / 2, y: PADDLE_Y, w: PADDLE_W, h: PADDLE_H };
  const ball = { x: 0, y: 0, w: BALL_SIZE, h: BALL_SIZE, vx: BASE_BALL_VX, vy: BASE_BALL_VY };
  let blocks: Block[] = [];
  let explosions: Explosion[] = [];
  let score = 0;
  let lives = START_LIVES;
  let level = 1;
  let state: State = "playing";
  let sprites: Sprites | null = null;
  let loadFailed = false;
  let lastTime: number | null = null;
  let rafId = 0;
  let destroyed = false;

  function setScore(value: number) {
    score = value;
    callbacks.onScore(score);
  }

  function setLives(value: number) {
    lives = value;
    callbacks.onLives?.(lives);
  }

  // Coloca la pelota sobre la paleta con la velocidad del nivel actual
  function initBall() {
    const speed = LEVELS[level - 1].speed;
    ball.x = paddle.x + (paddle.w - ball.w) / 2;
    ball.y = paddle.y - ball.h;
    ball.vx = BASE_BALL_VX * speed;
    ball.vy = BASE_BALL_VY * speed;
  }

  function loadLevel(n: number) {
    level = n;
    blocks = LEVELS[n - 1].blocks.map((b) => ({
      x: BLOCKS_ORIGIN_X + b.col * BLOCK_W,
      y: BLOCKS_ORIGIN_Y + b.row * BLOCK_H,
      w: BLOCK_W,
      h: BLOCK_H,
      color: b.color,
      alive: true,
    }));
    explosions = [];
    initBall();
    callbacks.onLevel?.(level);
  }

  function endGame(next: "gameover" | "win") {
    if (state === "gameover" || state === "win") return;
    state = next;
    callbacks.onGameOver(score);
  }

  function init() {
    paddle.x = (W - PADDLE_W) / 2;
    state = "playing";
    lastTime = null;
    setScore(0);
    setLives(START_LIVES);
    loadLevel(1);
  }

  function setPaused(value: boolean) {
    if (state === "gameover" || state === "win") return;
    if (value === (state === "paused")) return;
    state = value ? "paused" : "playing";
    // Evita un salto de dt al reanudar
    if (!value) lastTime = null;
    callbacks.onPause?.(value);
  }

  // ── Input ───────────────────────────────────────────────────────────────────
  const keys: Record<string, boolean> = {};

  const isFormTarget = (e: KeyboardEvent) => {
    const t = e.target;
    return (
      t instanceof HTMLElement &&
      (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.tagName === "SELECT")
    );
  };

  const onKeyDown = (e: KeyboardEvent) => {
    if (isFormTarget(e)) return;
    if (GAME_KEYS.includes(e.code)) {
      e.preventDefault();
      keys[e.code] = true;
      return;
    }
    if (e.code === "KeyP" || e.code === "Escape") {
      if (!e.repeat) setPaused(state !== "paused");
      return;
    }
    if (e.code === "KeyM") {
      if (!e.repeat) audio.toggleMute();
      return;
    }
    if (e.code === "Enter" && (state === "gameover" || state === "win")) {
      e.preventDefault();
      if (!e.repeat) init();
    }
  };

  const onKeyUp = (e: KeyboardEvent) => {
    keys[e.code] = false;
  };

  const onMouseMove = (e: MouseEvent) => {
    const rect = canvas.getBoundingClientRect();
    if (rect.width === 0) return;
    const mouseX = (e.clientX - rect.left) * (canvas.width / rect.width);
    paddle.x = Math.max(0, Math.min(W - paddle.w, mouseX - paddle.w / 2));
  };

  const onVisibility = () => {
    if (!document.hidden) return;
    // Un keyup perdido con la pestaña oculta dejaría la paleta moviéndose sola
    keys.ArrowLeft = false;
    keys.ArrowRight = false;
    setPaused(true);
  };

  window.addEventListener("keydown", onKeyDown);
  window.addEventListener("keyup", onKeyUp);
  document.addEventListener("visibilitychange", onVisibility);
  canvas.addEventListener("mousemove", onMouseMove);

  // ── Actualización ───────────────────────────────────────────────────────────
  function collidesWith(block: Block) {
    return (
      ball.x < block.x + block.w &&
      ball.x + ball.w > block.x &&
      ball.y < block.y + block.h &&
      ball.y + ball.h > block.y
    );
  }

  function update(dt: number) {
    if (state !== "playing") return;

    if (keys.ArrowLeft) paddle.x = Math.max(0, paddle.x - PADDLE_SPEED * dt);
    if (keys.ArrowRight) paddle.x = Math.min(W - paddle.w, paddle.x + PADDLE_SPEED * dt);

    ball.x += ball.vx * dt;
    ball.y += ball.vy * dt;

    // Rebotes en paredes (izquierda, derecha, arriba)
    if (ball.x <= 0) {
      ball.x = 0;
      ball.vx = Math.abs(ball.vx);
      audio.play("bounce");
    }
    if (ball.x + ball.w >= W) {
      ball.x = W - ball.w;
      ball.vx = -Math.abs(ball.vx);
      audio.play("bounce");
    }
    if (ball.y <= 0) {
      ball.y = 0;
      ball.vy = Math.abs(ball.vy);
      audio.play("bounce");
    }

    // Rebote en la paleta
    if (
      ball.vy > 0 &&
      ball.x + ball.w > paddle.x &&
      ball.x < paddle.x + paddle.w &&
      ball.y + ball.h >= paddle.y &&
      ball.y + ball.h <= paddle.y + paddle.h + 8
    ) {
      ball.y = paddle.y - ball.h;
      ball.vy = -Math.abs(ball.vy);
      audio.play("bounce");
    }

    // Colisión con bloques: como máximo uno por frame
    for (const block of blocks) {
      if (!block.alive || !collidesWith(block)) continue;
      block.alive = false;
      explosions.push({
        x: block.x,
        y: block.y,
        w: block.w,
        h: block.h,
        color: block.color,
        elapsed: 0,
      });
      setScore(score + POINTS_PER_BLOCK);
      ball.vy = -ball.vy;
      audio.play("break");
      if (blocks.every((b) => !b.alive)) {
        if (level < LEVELS.length) loadLevel(level + 1);
        else endGame("win");
      }
      break;
    }

    for (const exp of explosions) exp.elapsed += dt * 1000;
    explosions = explosions.filter((exp) => exp.elapsed < EXPLOSION_DURATION);

    // Pelota perdida
    if (state === "playing" && ball.y > H) {
      setLives(Math.max(0, lives - 1));
      if (lives <= 0) endGame("gameover");
      else initBall();
    }
  }

  // ── Render ──────────────────────────────────────────────────────────────────
  function drawOverlay(title: string, lines: string[] = []) {
    c.fillStyle = "rgba(0, 0, 0, 0.6)";
    c.fillRect(0, 0, W, H);
    c.fillStyle = "#fff";
    c.font = "bold 46px monospace";
    c.textAlign = "center";
    c.textBaseline = "middle";
    c.fillText(title, W / 2, H / 2 - 16);
    c.fillStyle = "#e6e9ff"; // --ink
    c.font = "18px monospace";
    lines.forEach((line, i) => c.fillText(line, W / 2, H / 2 + 28 + i * 28));
  }

  function draw() {
    c.fillStyle = "#000";
    c.fillRect(0, 0, W, H);

    if (loadFailed) {
      c.fillStyle = "#ff006e"; // --magenta
      c.font = "bold 18px monospace";
      c.textAlign = "center";
      c.textBaseline = "middle";
      c.fillText("NO SE PUDO CARGAR LOS GRÁFICOS", W / 2, H / 2);
      return;
    }
    if (!sprites) return;

    for (const block of blocks)
      if (block.alive) sprites.drawBlock(block.color, block.x, block.y, block.w, block.h);
    for (const exp of explosions)
      sprites.drawExplosion(exp.color, exp.elapsed, exp.x, exp.y, exp.w, exp.h);
    sprites.drawPaddle(paddle.x, paddle.y, paddle.w, paddle.h);
    sprites.drawBall(ball.x, ball.y, ball.w, ball.h);

    if (audio.isMuted()) {
      c.fillStyle = "#8a8fb5"; // --ink-dim
      c.font = "bold 14px monospace";
      c.textAlign = "right";
      c.textBaseline = "top";
      c.fillText("SILENCIO (M)", W - 10, 10);
    }

    if (state === "paused") drawOverlay("PAUSA");
    else if (state === "gameover")
      drawOverlay("GAME OVER", [
        `PUNTUACIÓN: ${score.toLocaleString("es-ES")}`,
        "ENTER PARA REINICIAR",
      ]);
    else if (state === "win")
      drawOverlay("¡COMPLETASTE EL JUEGO!", [
        `PUNTUACIÓN: ${score.toLocaleString("es-ES")}`,
        "ENTER PARA REINICIAR",
      ]);
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
  // cuando el spritesheet termina de cargar, como en el original.
  init();
  const cancelLoad = loadSpritesheet(
    SPRITESHEET_SRC,
    (img) => {
      if (destroyed) return;
      sprites = createSprites(c, img);
      lastTime = null;
      rafId = requestAnimationFrame(frame);
    },
    () => {
      if (destroyed) return;
      loadFailed = true;
      console.error("No se pudo cargar el spritesheet de Breakout:", SPRITESHEET_SRC);
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
      window.removeEventListener("keyup", onKeyUp);
      document.removeEventListener("visibilitychange", onVisibility);
      canvas.removeEventListener("mousemove", onMouseMove);
      audio.dispose();
    },
  };
}
