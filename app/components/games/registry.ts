import { createAsteroids } from "./asteroids";
import type { AsteroidsCallbacks, AsteroidsGame } from "./asteroids/types";

export type GameFactory = (
  canvas: HTMLCanvasElement,
  callbacks: AsteroidsCallbacks,
) => AsteroidsGame;

export const PLAYABLE: Record<string, GameFactory> = {
  asteroids: createAsteroids,
};
