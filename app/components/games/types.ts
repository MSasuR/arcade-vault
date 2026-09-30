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
}

export type GameFactory = (canvas: HTMLCanvasElement, callbacks: GameCallbacks) => GameInstance;
