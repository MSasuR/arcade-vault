import { DEFAULT_SKIN, isSkinId, type SkinId } from "../skins";
import type { GameCallbacks, GameInstance, GameOptions } from "../types";
import {
  BAY_X,
  DYING_TIME,
  EXTRA_LIFE_AT,
  FLY_DELAY,
  FLY_DURATION,
  LEVEL_BANNER_TIME,
  POINTS_LEVEL,
  POINTS_ROW,
  ROW_HOME,
  ROW_START,
  START_LIVES,
  TIME_PER_FROG,
} from "./constants";
import {
  advanceLanes,
  arrivalPoints,
  bayAt,
  carry,
  createLanes,
  dirFromKey,
  divePhase,
  hitByVehicle,
  isRiverRow,
  isRoadRow,
  jump,
  pickFlyBay,
  startFrog,
  supportingObject,
  type Dir,
  type Frog,
  type Lane,
} from "./logic";
import {
  drawBays,
  drawBoard,
  drawDeadFrog,
  drawFrog,
  drawHelp,
  drawLanes,
  drawLevelBanner,
  drawOverlay,
  drawReadyHint,
  drawTimeBar,
} from "./render";
import { PALETTES } from "./skins";

type State = "ready" | "playing" | "dying" | "paused" | "gameover";

interface Fly {
  bay: number;
  timeLeft: number; // s
}

export function createFrogger(
  canvas: HTMLCanvasElement,
  callbacks: GameCallbacks,
  options?: GameOptions,
): GameInstance {
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D no disponible");
  const c = ctx;

  // Skin activo: vive en el closure; setSkin solo reasigna la paleta
  let pal = PALETTES[isSkinId(options?.skin) ? options.skin : DEFAULT_SKIN];

  // ── Estado del juego (en el closure) ───────────────────────────────────────
  let lanes: Lane[] = createLanes();
  let frog: Frog = startFrog();
  let maxRow = ROW_START; // fila más alta alcanzada por esta rana
  let bays: boolean[] = BAY_X.map(() => false);
  let fly: Fly | null = null;
  let flyWait = FLY_DELAY;
  let timeLeft = TIME_PER_FROG;
  let diveClock = 0;
  let dyingLeft = 0;
  let bannerLeft = 0;
  let score = 0;
  let lives = START_LIVES;
  let level = 1;
  let extraLifeGiven = false;
  let gameOverEmitted = false;
  let state: State = "ready";
  let pausedFrom: "playing" | "dying" = "playing";
  let lastTime: number | null = null;
  let rafId = 0;
  let destroyed = false;

  function setScore(value: number) {
    score = value;
    callbacks.onScore(score);
  }

  function addScore(points: number) {
    setScore(score + points);
    // Una única vida extra por partida al llegar a 10 000 puntos
    if (!extraLifeGiven && score >= EXTRA_LIFE_AT) {
      extraLifeGiven = true;
      setLives(lives + 1);
    }
  }

  function setLives(value: number) {
    lives = value;
    callbacks.onLives?.(lives);
  }

  function setLevel(value: number) {
    level = value;
    callbacks.onLevel?.(level);
  }

  function init() {
    lanes = createLanes();
    frog = startFrog();
    maxRow = ROW_START;
    bays = BAY_X.map(() => false);
    fly = null;
    flyWait = FLY_DELAY;
    timeLeft = TIME_PER_FROG;
    diveClock = 0;
    dyingLeft = 0;
    bannerLeft = 0;
    extraLifeGiven = false;
    gameOverEmitted = false;
    state = "ready";
    lastTime = null;
    setScore(0);
    setLives(START_LIVES);
    setLevel(1);
  }

  // La rana reaparece en la acera, mirando arriba, con 30 s (sin pasar por ready)
  function respawn() {
    frog = startFrog();
    maxRow = ROW_START;
    timeLeft = TIME_PER_FROG;
  }

  // Las vidas bajan al empezar la animación de muerte para que el HUD responda ya
  function die() {
    state = "dying";
    dyingLeft = DYING_TIME;
    setLives(lives - 1);
  }

  function finishDying() {
    if (lives > 0) {
      respawn();
      state = "playing";
      return;
    }
    state = "gameover";
    if (!gameOverEmitted) {
      gameOverEmitted = true;
      callbacks.onGameOver(score);
    }
  }

  function arrive() {
    const bay = bayAt(frog.x);
    // Seto o casilla ocupada: muerte
    if (bay < 0 || bays[bay]) {
      die();
      return;
    }
    const withFly = fly?.bay === bay;
    addScore(arrivalPoints(timeLeft, withFly));
    bays[bay] = true;
    if (withFly) {
      fly = null;
      flyWait = FLY_DELAY;
    }
    if (bays.every(Boolean)) {
      addScore(POINTS_LEVEL);
      setLevel(level + 1);
      bays = BAY_X.map(() => false);
      fly = null;
      flyWait = FLY_DELAY;
      bannerLeft = LEVEL_BANNER_TIME;
    }
    respawn();
  }

  function doJump(dir: Dir) {
    const next = jump(frog, dir);
    if (next === frog) return;
    frog = next;
    if (frog.row < maxRow) {
      maxRow = frog.row;
      addScore(POINTS_ROW);
    }
    if (frog.row === ROW_HOME) arrive();
  }

  function setPaused(value: boolean) {
    if (value) {
      // La pausa solo se activa en playing y dying
      if (state !== "playing" && state !== "dying") return;
      pausedFrom = state;
      state = "paused";
      callbacks.onPause?.(true);
      return;
    }
    if (state !== "paused") return;
    state = pausedFrom;
    // Evita un salto de dt al reanudar
    lastTime = null;
    callbacks.onPause?.(false);
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
      if (state === "gameover") {
        e.preventDefault();
        if (!e.repeat) init();
      }
      return;
    }

    const dir = dirFromKey(e.code);
    if (dir === null) return;
    // Las flechas no deben hacer scroll de la página
    if (e.code.startsWith("Arrow")) e.preventDefault();
    // Un salto por pulsación: mantener la tecla no repite
    if (e.repeat) return;

    if (state === "ready") {
      // La primera dirección empieza la partida y ejecuta su salto
      state = "playing";
      lastTime = null;
    }
    if (state === "playing") doJump(dir);
  };

  const onVisibility = () => {
    if (document.hidden) setPaused(true);
  };

  window.addEventListener("keydown", onKeyDown);
  document.addEventListener("visibilitychange", onVisibility);

  // ── Actualización ───────────────────────────────────────────────────────────
  function updateFly(dt: number) {
    if (fly) {
      fly.timeLeft -= dt;
      if (fly.timeLeft <= 0) {
        fly = null;
        flyWait = FLY_DELAY;
      }
      return;
    }
    flyWait -= dt;
    if (flyWait > 0) return;
    const bay = pickFlyBay(bays, Math.random());
    if (bay >= 0) fly = { bay, timeLeft: FLY_DURATION };
    else flyWait = FLY_DELAY;
  }

  function update(dt: number) {
    if (state !== "playing" && state !== "dying") return;

    // El mundo, las tortugas, la mosca y el rótulo de nivel corren en playing y dying
    lanes = advanceLanes(lanes, dt, level);
    diveClock += dt;
    updateFly(dt);
    bannerLeft = Math.max(0, bannerLeft - dt);

    if (state === "dying") {
      dyingLeft -= dt;
      if (dyingLeft <= 0) finishDying();
      return;
    }

    // El tiempo solo corre en playing
    timeLeft -= dt;
    if (timeLeft <= 0) {
      timeLeft = 0;
      die();
      return;
    }

    const lane = lanes.find((l) => l.row === frog.row);
    if (!lane) return;
    if (isRiverRow(frog.row)) {
      if (!supportingObject(frog.x, lane, divePhase(diveClock))) {
        die();
        return;
      }
      const moved = carry(frog.x, lane, level, dt);
      frog = { ...frog, x: moved.x };
      if (moved.outOfBounds) die();
    } else if (isRoadRow(frog.row) && hitByVehicle(frog.x, lane)) {
      die();
    }
  }

  // ── Render ──────────────────────────────────────────────────────────────────
  function draw() {
    drawBoard(c, pal);
    drawBays(c, pal, bays, fly ? fly.bay : null);
    drawLanes(c, pal, lanes, divePhase(diveClock));
    const dead = state === "dying" || (state === "paused" && pausedFrom === "dying");
    if (dead) drawDeadFrog(c, pal, frog);
    else if (state !== "gameover") drawFrog(c, pal, frog);
    drawTimeBar(c, pal, timeLeft);
    drawHelp(c, pal);
    if (bannerLeft > 0) drawLevelBanner(c, pal, level);

    if (state === "ready") drawReadyHint(c, pal);
    else if (state === "paused") drawOverlay(c, pal, "PAUSA", pal.overlayPause);
    else if (state === "gameover")
      drawOverlay(c, pal, "GAME OVER", pal.overlayGameOver, [
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

  // Valores iniciales síncronos para el HUD; sin assets, el loop empieza ya
  init();
  draw();
  rafId = requestAnimationFrame(frame);

  return {
    pause: () => setPaused(true),
    resume: () => setPaused(false),
    getScore: () => score,
    setSkin(next: SkinId) {
      // Solo cambia la paleta: el loop sigue en pausa y en GAME OVER, así que el
      // siguiente frame ya la usa; sin reiniciar la partida ni emitir callbacks
      if (!isSkinId(next)) return;
      pal = PALETTES[next];
    },
    destroy: () => {
      if (destroyed) return;
      destroyed = true;
      cancelAnimationFrame(rafId);
      window.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("visibilitychange", onVisibility);
    },
  };
}
