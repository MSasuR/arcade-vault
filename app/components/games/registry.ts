import { createAsteroids } from "./asteroids";
import { createBreakout } from "./breakout";
import { createSnake } from "./snake";
import { createTetris } from "./tetris";
import type { GameFactory } from "./types";

export const PLAYABLE: Record<string, GameFactory> = {
  asteroids: createAsteroids,
  tetris: createTetris,
  breakout: createBreakout,
  snake: createSnake,
};

// Juegos con skins del canvas (spec 10): solo en ellos GamePlayer muestra el selector
export const SKINNABLE: ReadonlySet<string> = new Set<string>(["asteroids"]);
