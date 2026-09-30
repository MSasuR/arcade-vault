import {
  BALL_SPRITE,
  BLOCK_SPRITES,
  EXPLOSION_DURATION,
  EXPLOSION_FRAMES,
  EXPLOSION_FRAME_COUNT,
  PADDLE_SPRITE,
  type BlockColor,
  type Region,
} from "./constants";

export interface Sprites {
  drawPaddle: (x: number, y: number, w: number, h: number) => void;
  drawBall: (x: number, y: number, w: number, h: number) => void;
  drawBlock: (color: BlockColor, x: number, y: number, w: number, h: number) => void;
  drawExplosion: (
    color: BlockColor,
    elapsed: number,
    x: number,
    y: number,
    w: number,
    h: number,
  ) => void;
}

// Carga el spritesheet. Devuelve una función que cancela la carga pendiente (p. ej. si el
// juego se destruye antes de que termine), de modo que ningún callback llegue tarde.
export function loadSpritesheet(
  src: string,
  onLoad: (img: HTMLImageElement) => void,
  onError: () => void,
): () => void {
  const img = new Image();
  img.onload = () => onLoad(img);
  img.onerror = () => onError();
  img.src = src;
  return () => {
    img.onload = null;
    img.onerror = null;
  };
}

export function createSprites(ctx: CanvasRenderingContext2D, img: HTMLImageElement): Sprites {
  const draw = (r: Region, x: number, y: number, w: number, h: number) =>
    ctx.drawImage(img, r.sx, r.sy, r.sw, r.sh, x, y, w, h);

  return {
    drawPaddle: (x, y, w, h) => draw(PADDLE_SPRITE, x, y, w, h),
    drawBall: (x, y, w, h) => draw(BALL_SPRITE, x, y, w, h),
    drawBlock: (color, x, y, w, h) => draw(BLOCK_SPRITES[color], x, y, w, h),
    drawExplosion: (color, elapsed, x, y, w, h) => {
      const frame = Math.min(
        Math.floor((elapsed / EXPLOSION_DURATION) * EXPLOSION_FRAME_COUNT),
        EXPLOSION_FRAME_COUNT - 1,
      );
      draw(EXPLOSION_FRAMES[color][frame], x, y, w, h);
    },
  };
}
