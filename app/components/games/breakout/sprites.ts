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
import { tintRegion } from "../spriteTint";
import type { SpriteTints } from "./skins";

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
  // Cambia la hoja de sprites: null = original; si no, la teñida para esa clave de skin
  // (se genera una sola vez y queda en caché mientras viva el juego)
  useTints: (key: string, tints: SpriteTints | null) => void;
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

// Copia el spritesheet en un canvas offscreen y tiñe solo las regiones que usa el juego
function tintSheet(img: HTMLImageElement, tints: SpriteTints): HTMLCanvasElement | null {
  const sheet = document.createElement("canvas");
  sheet.width = img.naturalWidth;
  sheet.height = img.naturalHeight;
  const out = sheet.getContext("2d", { willReadFrequently: true });
  if (!out) return null;
  out.drawImage(img, 0, 0);
  tintRegion(out, PADDLE_SPRITE, tints.paddle, tints.patternColor, false);
  tintRegion(out, BALL_SPRITE, tints.ball, tints.patternColor, false);
  const colors = Object.keys(BLOCK_SPRITES) as BlockColor[];
  for (const color of colors) {
    tintRegion(out, BLOCK_SPRITES[color], tints.blocks[color], tints.patternColor, true);
    // gray reutiliza los frames de red (como el original): no se tiñen dos veces
    if (color === "gray") continue;
    for (const frame of EXPLOSION_FRAMES[color])
      tintRegion(out, frame, tints.blocks[color], tints.patternColor, false);
  }
  return sheet;
}

export function createSprites(ctx: CanvasRenderingContext2D, img: HTMLImageElement): Sprites {
  const cache = new Map<string, CanvasImageSource>();
  let source: CanvasImageSource = img;
  const draw = (r: Region, x: number, y: number, w: number, h: number) =>
    ctx.drawImage(source, r.sx, r.sy, r.sw, r.sh, x, y, w, h);

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
    useTints: (key, tints) => {
      if (!tints) {
        source = img;
        return;
      }
      let sheet = cache.get(key);
      if (!sheet) {
        // Si el navegador no deja leer los píxeles, se sigue con la hoja original
        try {
          sheet = tintSheet(img, tints) ?? img;
        } catch {
          sheet = img;
        }
        cache.set(key, sheet);
      }
      source = sheet;
    },
  };
}
