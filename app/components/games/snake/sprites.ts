import { FRUIT_ATLAS, type FruitName } from "./atlas";

export interface FruitSprites {
  // Dibuja la fruta centrada en (cx, cy) con el alto dado, conservando su proporción
  drawFruit: (name: FruitName, cx: number, cy: number, height: number) => void;
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
  return {
    drawFruit(name, cx, cy, height) {
      const r = FRUIT_ATLAS[name];
      const width = (height * r.w) / r.h;
      ctx.drawImage(img, r.x, r.y, r.w, r.h, cx - width / 2, cy - height / 2, width, height);
    },
  };
}
