import {
  Asteroid,
  Bullet,
  Particle,
  PowerUp,
  Ship,
  type Keys,
} from "./entities";
import type { GameCallbacks, GameInstance } from "../types";
import {
  H,
  POINTS,
  POWERUP_DROP_CHANCE,
  POWERUP_DURATION,
  W,
  dist,
  rand,
} from "./utils";

type State = "playing" | "dead" | "gameover";

const GAME_KEYS = ["ArrowLeft", "ArrowRight", "ArrowUp", "Space"];

export function createAsteroids(
  canvas: HTMLCanvasElement,
  callbacks: GameCallbacks,
): GameInstance {
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D no disponible");

  // ── Input ───────────────────────────────────────────────────────────────────
  const keys: Keys = {};
  const justPressed: Keys = {};

  const isFormTarget = (e: KeyboardEvent) => {
    const t = e.target;
    return (
      t instanceof HTMLElement &&
      (t.tagName === "INPUT" ||
        t.tagName === "TEXTAREA" ||
        t.tagName === "SELECT")
    );
  };

  const onKeyDown = (e: KeyboardEvent) => {
    if (isFormTarget(e)) return;
    if (e.code === "KeyP") {
      if (!e.repeat) togglePause();
      return;
    }
    if (GAME_KEYS.includes(e.code)) e.preventDefault();
    if (!keys[e.code]) justPressed[e.code] = true;
    keys[e.code] = true;
  };
  const onKeyUp = (e: KeyboardEvent) => {
    keys[e.code] = false;
  };

  function pressed(code: string) {
    const val = justPressed[code];
    justPressed[code] = false;
    return !!val;
  }

  const onVisibility = () => {
    if (document.hidden) setPaused(true);
  };

  window.addEventListener("keydown", onKeyDown);
  window.addEventListener("keyup", onKeyUp);
  document.addEventListener("visibilitychange", onVisibility);

  // ── Estado del juego ────────────────────────────────────────────────────────
  let ship: Ship;
  let bullets: Bullet[];
  let asteroids: Asteroid[];
  let particles: Particle[];
  let powerUps: PowerUp[];
  let score = 0;
  let lives = 3;
  let level = 1;
  let state: State = "playing";
  let deadTimer = 0;
  let powerUpSpawned = false;
  let killsSinceSpawn = 0;
  let paused = false;

  function setPaused(value: boolean) {
    if (value === paused) return;
    if (value && state === "gameover") return;
    paused = value;
    if (!paused) {
      // Evita un salto de dt y descarta pulsaciones acumuladas en pausa
      lastTime = null;
      for (const k of Object.keys(justPressed)) justPressed[k] = false;
    }
    callbacks.onPause?.(paused);
  }

  function togglePause() {
    setPaused(!paused);
  }

  function setScore(v: number) {
    score = v;
    callbacks.onScore(score);
  }

  function spawnAsteroids(count: number) {
    const SAFE_DIST = 130;
    for (let i = 0; i < count; i++) {
      let x: number, y: number;
      do {
        x = rand(0, W);
        y = rand(0, H);
      } while (Math.hypot(x - W / 2, y - H / 2) < SAFE_DIST);
      asteroids.push(new Asteroid(x, y, 3));
    }
  }

  function initGame() {
    ship = new Ship();
    bullets = [];
    asteroids = [];
    particles = [];
    powerUps = [];
    powerUpSpawned = false;
    killsSinceSpawn = 0;
    lives = 3;
    level = 1;
    state = "playing";
    spawnAsteroids(4);
    setScore(0);
    callbacks.onLives?.(lives);
    callbacks.onLevel?.(level);
  }

  function nextLevel() {
    level++;
    bullets = [];
    particles = [];
    powerUps = [];
    powerUpSpawned = false;
    killsSinceSpawn = 0;
    ship.reset();
    spawnAsteroids(3 + level);
    callbacks.onLevel?.(level);
  }

  function explode(x: number, y: number, count = 8) {
    for (let i = 0; i < count; i++) particles.push(new Particle(x, y));
  }

  function killShip() {
    explode(ship.x, ship.y, 14);
    ship.dead = true;
    lives--;
    callbacks.onLives?.(lives);
    if (lives <= 0) {
      state = "gameover";
      callbacks.onGameOver(score);
    } else {
      state = "dead";
      deadTimer = 2;
    }
  }

  let lastTime: number | null = null;

  // ── Update ──────────────────────────────────────────────────────────────────
  function update(dt: number) {
    if (state === "gameover") {
      if (pressed("Space")) initGame();
      particles.forEach((p) => p.update(dt));
      particles = particles.filter((p) => !p.dead);
      return;
    }

    if (state === "dead") {
      deadTimer -= dt;
      particles.forEach((p) => p.update(dt));
      particles = particles.filter((p) => !p.dead);
      asteroids.forEach((a) => a.update(dt));
      if (deadTimer <= 0) {
        state = "playing";
        ship.reset();
      }
      return;
    }

    // Disparar
    if (pressed("Space")) {
      bullets.push(...ship.tryShoot());
    }

    ship.update(dt, keys);
    bullets.forEach((b) => b.update(dt));
    asteroids.forEach((a) => a.update(dt));
    particles.forEach((p) => p.update(dt));
    powerUps.forEach((p) => p.update(dt));

    bullets = bullets.filter((b) => !b.dead);
    particles = particles.filter((p) => !p.dead);
    powerUps = powerUps.filter((p) => !p.dead);

    for (const p of powerUps) {
      if (!p.dead && dist(ship, p) < ship.radius + p.radius) {
        p.dead = true;
        ship.tripleShot = POWERUP_DURATION;
      }
    }

    // Bala vs asteroide
    const newAsteroids: Asteroid[] = [];
    for (const b of bullets) {
      for (const a of asteroids) {
        if (!a.dead && !b.dead && dist(b, a) < a.radius) {
          b.dead = true;
          a.dead = true;
          setScore(score + POINTS[a.size]);
          explode(a.x, a.y, a.size * 5);
          newAsteroids.push(...a.split());
          if (!powerUpSpawned) {
            killsSinceSpawn++;
            const guaranteed = killsSinceSpawn >= 5;
            if (guaranteed || Math.random() < POWERUP_DROP_CHANCE) {
              powerUps.push(new PowerUp(a.x, a.y));
              powerUpSpawned = true;
            }
          }
        }
      }
    }
    asteroids = asteroids.filter((a) => !a.dead).concat(newAsteroids);
    bullets = bullets.filter((b) => !b.dead);

    // Nave vs asteroide
    if (ship.invincible <= 0) {
      for (const a of asteroids) {
        if (dist(ship, a) < ship.radius + a.radius * 0.82) {
          killShip();
          break;
        }
      }
    }

    // Nivel completado
    if (state === "playing" && asteroids.length === 0) nextLevel();
  }

  // ── Draw ────────────────────────────────────────────────────────────────────
  // El HUD (score, vidas, nivel) lo dibuja React; aquí solo el contador 3x.
  function drawPowerUpTimer(c: CanvasRenderingContext2D) {
    if (ship.tripleShot <= 0) return;
    c.font = "15px monospace";
    c.textAlign = "left";
    c.textBaseline = "alphabetic";
    c.fillStyle = "#0ff";
    c.fillText(`3x  ${ship.tripleShot.toFixed(1)}s`, 14, 26);
  }

  function drawOverlay(c: CanvasRenderingContext2D, title: string, sub: string) {
    c.textAlign = "center";
    c.textBaseline = "alphabetic";
    c.fillStyle = "#fff";
    c.font = "bold 46px monospace";
    c.fillText(title, W / 2, H / 2 - 18);
    c.font = "18px monospace";
    c.fillStyle = "rgba(255,255,255,0.65)";
    c.fillText(sub, W / 2, H / 2 + 22);
  }

  function draw(c: CanvasRenderingContext2D) {
    c.fillStyle = "#000";
    c.fillRect(0, 0, W, H);

    particles.forEach((p) => p.draw(c));
    asteroids.forEach((a) => a.draw(c));
    powerUps.forEach((p) => p.draw(c));
    bullets.forEach((b) => b.draw(c));
    ship.draw(c);

    drawPowerUpTimer(c);

    if (paused) drawOverlay(c, "PAUSA", "P PARA REANUDAR");
    else if (state === "gameover")
      drawOverlay(
        c,
        "GAME OVER",
        `PUNTAJE: ${score}   —   ESPACIO PARA REINICIAR`,
      );
  }

  // ── Loop principal ──────────────────────────────────────────────────────────
  let frameId = 0;
  let destroyed = false;

  function loop(ts: number) {
    if (destroyed) return;
    const dt = lastTime === null ? 0 : Math.min((ts - lastTime) / 1000, 0.05);
    lastTime = ts;
    if (!paused) update(dt);
    draw(ctx!);
    frameId = requestAnimationFrame(loop);
  }

  initGame();
  frameId = requestAnimationFrame(loop);

  return {
    pause: () => setPaused(true),
    resume: () => setPaused(false),
    getScore: () => score,
    destroy() {
      if (destroyed) return;
      destroyed = true;
      cancelAnimationFrame(frameId);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      document.removeEventListener("visibilitychange", onVisibility);
    },
  };
}
