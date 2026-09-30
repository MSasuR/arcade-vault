import { createAsteroids } from "./asteroids";
import { createTetris } from "./tetris";
import type { GameFactory } from "./types";

export const PLAYABLE: Record<string, GameFactory> = {
  asteroids: createAsteroids,
  tetris: createTetris,
};
