import type { SkinId } from "./skins";

export interface GameCallbacks {
  onScore: (score: number) => void;
  onGameOver: (finalScore: number) => void;
  onPause?: (paused: boolean) => void;
  // Opcionales: cada juego emite solo las métricas que tiene
  onLives?: (lives: number) => void;
  onLevel?: (level: number) => void;
  onLines?: (lines: number) => void;
}

export interface GameInstance {
  pause: () => void;
  resume: () => void;
  getScore: () => number;
  destroy: () => void;
  // Opcional mientras haya juegos sin skins; cambia la paleta en caliente,
  // sin reiniciar la partida ni emitir callbacks
  setSkin?: (skin: SkinId) => void;
}

export interface GameOptions {
  skin?: SkinId;
}

export type GameFactory = (
  canvas: HTMLCanvasElement,
  callbacks: GameCallbacks,
  options?: GameOptions,
) => GameInstance;
