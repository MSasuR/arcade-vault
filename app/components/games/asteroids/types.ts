export interface AsteroidsCallbacks {
  onScore: (score: number) => void;
  onLives: (lives: number) => void;
  onLevel: (level: number) => void;
  onGameOver: (finalScore: number) => void;
  onPause?: (paused: boolean) => void;
}

export interface AsteroidsGame {
  pause: () => void;
  resume: () => void;
  getScore: () => number;
  destroy: () => void;
}
