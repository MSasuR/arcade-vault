import { createAsteroids } from "./asteroids";
import { createBreakout } from "./breakout";
import { createTetris } from "./tetris";
import type { GameFactory } from "./types";

export const PLAYABLE: Record<string, GameFactory> = {
  asteroids: createAsteroids,
  tetris: createTetris,
  breakout: createBreakout,
};
