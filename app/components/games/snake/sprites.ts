import { tintRegion, type SpriteTint } from "../spriteTint";
import { FRUIT_ATLAS, FRUIT_NAMES, type FruitName } from "./atlas";

export interface FruitSprites {
  // Dibuja la fruta centrada en (cx, cy) con el alto dado, conservando su proporción
  drawFruit: (name: FruitName, cx: number, cy: number, height: number) => void;
  // Cambia el atlas: null = original; si no, el teñido para esa clave de skin
  // (se genera una sola vez y queda en caché mientras viva el juego)
  useTint: (key: string, tint: SpriteTint | null) => void;
}

// Copia el atlas en un canvas offscreen y tiñe solo las regiones de las frutas
function tintAtlas(img: HTMLImageElement, tint: SpriteTint): HTMLCanvasElement | null {
  const sheet = document.createElement("canvas");
  sheet.width = img.naturalWidth;
  sheet.height = img.naturalHeight;
  const out = sheet.getContext("2d", { willReadFrequently: true });
  if (!out) return null;
  out.drawImage(img, 0, 0);
  for (const name of FRUIT_NAMES) {
    const r = FRUIT_ATLAS[name];
    // Sin textura: el color de patrón no se usa
    tintRegion(out, { sx: r.x, sy: r.y, sw: r.w, sh: r.h }, tint, tint.ramp[0], false);
  }
  return sheet;
}

// Carga la imagen. Devuelve una función que cancela la carga pendiente (p. ej. si el juego
// se destruye antes de que termine), de modo que ningún callback llegue tarde.
export function loadImage(
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

export function createFruitSprites(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
): FruitSprites {
  const cache = new Map<string, CanvasImageSource>();
  let source: CanvasImageSource = img;
  return {
    drawFruit(name, cx, cy, height) {
      const r = FRUIT_ATLAS[name];
      const width = (height * r.w) / r.h;
      ctx.drawImage(source, r.x, r.y, r.w, r.h, cx - width / 2, cy - height / 2, width, height);
    },
    useTint(key, tint) {
      if (!tint) {
        source = img;
        return;
      }
      let sheet = cache.get(key);
      if (!sheet) {
        // Si el navegador no deja leer los píxeles, se sigue con el atlas original
        try {
          sheet = tintAtlas(img, tint) ?? img;
        } catch {
          sheet = img;
        }
        cache.set(key, sheet);
      }
      source = sheet;
    },
  };
}
