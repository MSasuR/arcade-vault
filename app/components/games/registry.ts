import { createAsteroids } from "./asteroids";
import { createBreakout } from "./breakout";
import { createFrogger } from "./frogger";
import { createSnake } from "./snake";
import { createTetris } from "./tetris";
import type { TouchButton, TouchLayout } from "./touch";
import type { GameFactory } from "./types";

export const PLAYABLE: Record<string, GameFactory> = {
  asteroids: createAsteroids,
  tetris: createTetris,
  breakout: createBreakout,
  snake: createSnake,
  frogger: createFrogger,
};

// Juegos con skins del canvas (spec 10): solo en ellos GamePlayer muestra el selector
export const SKINNABLE: ReadonlySet<string> = new Set<string>([
  "asteroids",
  "tetris",
  "breakout",
  "snake",
  "frogger",
]);

// Mando táctil por juego (spec 11): mapeo 1:1 con las teclas que ya usa cada uno
const LEFT: TouchButton = { code: "ArrowLeft", key: "ArrowLeft", label: "←", aria: "Izquierda" };
const RIGHT: TouchButton = { code: "ArrowRight", key: "ArrowRight", label: "→", aria: "Derecha" };
const UP: TouchButton = { code: "ArrowUp", key: "ArrowUp", label: "↑", aria: "Arriba" };
const DOWN: TouchButton = { code: "ArrowDown", key: "ArrowDown", label: "↓", aria: "Abajo" };
const RESTART: TouchButton = { code: "Enter", key: "Enter", label: "REINICIAR", aria: "Reiniciar" };

export const TOUCH_LAYOUTS: Readonly<Record<string, TouchLayout>> = {
  asteroids: {
    move: [
      { ...LEFT, label: "↺", aria: "Girar a la izquierda" },
      { ...RIGHT, label: "↻", aria: "Girar a la derecha" },
    ],
    moveShape: "row",
    actions: [
      { ...UP, label: "EMPUJE", aria: "Empuje" },
      { code: "Space", key: " ", label: "DISPARO", aria: "Disparo" },
    ],
    // Espacio (DISPARO) ya reinicia tras GAME OVER
    restart: null,
  },
  tetris: {
    move: [
      { ...LEFT, repeat: true },
      { ...DOWN, repeat: true },
      { ...RIGHT, repeat: true },
    ],
    moveShape: "row",
    actions: [
      { ...UP, label: "GIRAR", aria: "Girar pieza" },
      { code: "Space", key: " ", label: "CAÍDA", aria: "Caída rápida" },
    ],
    restart: RESTART,
  },
  breakout: {
    move: [LEFT, RIGHT],
    moveShape: "row",
    actions: [{ code: "KeyM", key: "m", label: "SONIDO", aria: "Silenciar o activar sonido" }],
    restart: RESTART,
  },
  snake: {
    move: [UP, LEFT, RIGHT, DOWN],
    moveShape: "dpad",
    actions: [],
    restart: RESTART,
  },
  frogger: {
    // Un salto por keydown e ignora e.repeat: sin repeat, un toque = un salto
    move: [UP, LEFT, RIGHT, DOWN],
    moveShape: "dpad",
    actions: [],
    restart: RESTART,
  },
};
