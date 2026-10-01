import {
  CELL,
  COLS,
  H,
  ROWS,
  SEGMENT_INSET,
  SEGMENT_SIZE,
  W,
} from "./constants";
import type { Cell, Dir } from "./logic";
import type { SnakePalette } from "./skins";

function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

// Interpola entre dos colores hex (t de 0 a 1) y devuelve un color hex
function lerpColor(from: string, to: string, t: number): string {
  const a = hexToRgb(from);
  const b = hexToRgb(to);
  const mix = a.map((v, i) => Math.round(v + (b[i] - v) * t));
  return "#" + mix.map((v) => v.toString(16).padStart(2, "0")).join("");
}

export function drawBackground(ctx: CanvasRenderingContext2D, pal: SnakePalette) {
  ctx.fillStyle = pal.bg;
  ctx.fillRect(0, 0, W, H);
}

export function drawGrid(ctx: CanvasRenderingContext2D, pal: SnakePalette) {
  ctx.strokeStyle = pal.grid;
  ctx.lineWidth = 0.5;
  ctx.beginPath();
  for (let x = 1; x < COLS; x++) {
    ctx.moveTo(x * CELL, 0);
    ctx.lineTo(x * CELL, H);
  }
  for (let y = 1; y < ROWS; y++) {
    ctx.moveTo(0, y * CELL);
    ctx.lineTo(W, y * CELL);
  }
  ctx.stroke();
}

function drawSegment(
  ctx: CanvasRenderingContext2D,
  pal: SnakePalette,
  cell: Cell,
  color: string,
  tube = false,
) {
  const px = cell.x * CELL + SEGMENT_INSET;
  const py = cell.y * CELL + SEGMENT_INSET;
  if (tube) {
    // Tubo de neón: relleno oscuro tintado y contorno del color del segmento
    ctx.globalAlpha = pal.tubeFill;
    ctx.fillStyle = color;
    ctx.fillRect(px, py, SEGMENT_SIZE, SEGMENT_SIZE);
    ctx.globalAlpha = 1;
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.strokeRect(px + 2, py + 2, SEGMENT_SIZE - 4, SEGMENT_SIZE - 4);
    return;
  }
  ctx.fillStyle = color;
  ctx.fillRect(px, py, SEGMENT_SIZE, SEGMENT_SIZE);
  if (pal.segmentHighlight) {
    ctx.fillStyle = pal.segmentHighlight;
    ctx.fillRect(px, py, SEGMENT_SIZE, 4);
  }
}

// Dos ojos de 6 px en el lado hacia el que mira la cabeza
function drawEyes(ctx: CanvasRenderingContext2D, pal: SnakePalette, head: Cell, dir: Dir) {
  const cx = head.x * CELL + CELL / 2;
  const cy = head.y * CELL + CELL / 2;
  const d = 8;
  const offsets: Record<Dir, [number, number][]> = {
    right: [
      [d, -d],
      [d, d],
    ],
    left: [
      [-d, -d],
      [-d, d],
    ],
    up: [
      [-d, -d],
      [d, -d],
    ],
    down: [
      [-d, d],
      [d, d],
    ],
  };
  ctx.fillStyle = pal.eye;
  for (const [ox, oy] of offsets[dir]) ctx.fillRect(cx + ox - 3, cy + oy - 3, 6, 6);
}

// Cuerpo en degradado (classic, neon) o en anillos alternos (retro) de la cabeza a la cola
export function drawSnake(
  ctx: CanvasRenderingContext2D,
  pal: SnakePalette,
  snake: readonly Cell[],
  dir: Dir,
) {
  const last = snake.length - 1;
  const tube = pal.bodyStyle === "tube";
  for (let i = last; i >= 1; i--) {
    if (pal.bodyStyle === "bands") {
      drawSegment(ctx, pal, snake[i], i % 2 === 1 ? pal.body : pal.bodyEnd);
      continue;
    }
    // Empieza un poco después del tono de la cabeza para que esta se distinga del cuello
    const t = i / last;
    // Con bodyMid el degradado pasa por ese tono (evita el gris de mezclar colores opuestos)
    const color = !pal.bodyMid
      ? lerpColor(pal.body, pal.bodyEnd, t)
      : t < 0.5
        ? lerpColor(pal.body, pal.bodyMid, t * 2)
        : lerpColor(pal.bodyMid, pal.bodyEnd, t * 2 - 1);
    drawSegment(ctx, pal, snake[i], color, tube);
  }
  // Cabeza siempre sólida; glow solo en ella (dentro de save/restore)
  ctx.save();
  if (pal.glow.head > 0) {
    ctx.shadowBlur = pal.glow.head;
    ctx.shadowColor = pal.head;
  }
  drawSegment(ctx, pal, snake[0], pal.head);
  ctx.restore();
  drawEyes(ctx, pal, snake[0], dir);
}

export function drawOverlay(
  ctx: CanvasRenderingContext2D,
  pal: SnakePalette,
  title: string,
  color: string,
  lines: string[] = [],
) {
  ctx.fillStyle = pal.overlayVeil;
  ctx.fillRect(0, 0, W, H);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.save();
  if (pal.glow.title > 0) {
    ctx.shadowBlur = pal.glow.title;
    ctx.shadowColor = color;
  }
  ctx.fillStyle = pal.titleInk ?? color;
  ctx.font = "bold 46px monospace";
  ctx.fillText(title, W / 2, H / 2 - 16);
  ctx.restore();
  ctx.fillStyle = pal.overlayText;
  ctx.font = "18px monospace";
  lines.forEach((line, i) => ctx.fillText(line, W / 2, H / 2 + 28 + i * 28));
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
}

// Aviso del estado inicial, debajo de la serpiente
export function drawReadyHint(ctx: CanvasRenderingContext2D, pal: SnakePalette) {
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = pal.hint;
  ctx.font = "bold 20px monospace";
  ctx.fillText("PULSA UNA FLECHA PARA EMPEZAR", W / 2, H / 2 + 100);
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
}

export function drawLoadError(ctx: CanvasRenderingContext2D, pal: SnakePalette) {
  drawBackground(ctx, pal);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = pal.danger;
  ctx.font = "bold 18px monospace";
  ctx.fillText("NO SE PUDIERON CARGAR LOS GRÁFICOS", W / 2, H / 2);
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
}
