export const W = 800;
export const H = 600;

export const PADDLE_SPEED = 400;
export const PADDLE_Y = 560;
export const PADDLE_W = 81; // el sprite de 162×14 se dibuja a 81×14, como en el original
export const PADDLE_H = 14;
export const BALL_SIZE = 16;

export const BLOCK_COLS = 10;
export const BLOCK_ROWS = 6;
export const BLOCK_W = 64;
export const BLOCK_H = 24;
export const BLOCKS_ORIGIN_X = (W - BLOCK_COLS * BLOCK_W) / 2;
export const BLOCKS_ORIGIN_Y = 80;

export const BASE_BALL_VX = 200;
export const BASE_BALL_VY = -300;

export const START_LIVES = 3;
export const POINTS_PER_BLOCK = 10;
export const EXPLOSION_DURATION = 150; // ms
export const EXPLOSION_FRAME_COUNT = 4;

// Assets servidos desde public/games/breakout/
export const SPRITESHEET_SRC = "/games/breakout/spritesheet-breakout.png";
export const SOUND_BOUNCE_SRC = "/games/breakout/sounds/ball-bounce.mp3";
export const SOUND_BREAK_SRC = "/games/breakout/sounds/break-sound.mp3";

export type BlockColor = "gray" | "red" | "yellow" | "cyan" | "magenta" | "hotpink" | "green";

export interface Region {
  sx: number;
  sy: number;
  sw: number;
  sh: number;
}

// Regiones del spritesheet, con las mismas coordenadas del original
export const PADDLE_SPRITE: Region = { sx: 32, sy: 112, sw: 162, sh: 14 };
export const BALL_SPRITE: Region = { sx: 32, sy: 32, sw: 16, sh: 16 };

export const BLOCK_SPRITES: Record<BlockColor, Region> = {
  gray: { sx: 32, sy: 288, sw: 32, sh: 16 },
  red: { sx: 32, sy: 176, sw: 32, sh: 16 },
  yellow: { sx: 32, sy: 240, sw: 32, sh: 16 },
  cyan: { sx: 32, sy: 192, sw: 32, sh: 16 },
  magenta: { sx: 32, sy: 224, sw: 32, sh: 16 },
  hotpink: { sx: 32, sy: 256, sw: 32, sh: 16 },
  green: { sx: 32, sy: 208, sw: 32, sh: 16 },
};

function explosionRow(sy: number): Region[] {
  return [256, 288, 320, 352].map((sx) => ({ sx, sy, sw: 32, sh: 16 }));
}

export const EXPLOSION_FRAMES: Record<BlockColor, Region[]> = {
  red: explosionRow(176),
  cyan: explosionRow(192),
  green: explosionRow(208),
  magenta: explosionRow(224),
  yellow: explosionRow(240),
  hotpink: explosionRow(256),
  gray: explosionRow(176), // reutiliza los frames de red, como el original
};
