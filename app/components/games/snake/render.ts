import {
  CELL,
  COLOR_BG,
  COLOR_BODY_END,
  COLOR_DANGER,
  COLOR_EYE,
  COLOR_GRID,
  COLOR_HEAD,
  COLOR_TEXT,
  COLS,
  H,
  ROWS,
  SEGMENT_INSET,
  SEGMENT_SIZE,
  W,
} from "./constants";
import type { Cell, Dir } from "./logic";

function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

// Interpola entre dos colores hex (t de 0 a 1) y devuelve un color `rgb()`
function lerpColor(from: string, to: string, t: number): string {
  const a = hexToRgb(from);
  const b = hexToRgb(to);
  const mix = a.map((v, i) => Math.round(v + (b[i] - v) * t));
  return `rgb(${mix[0]}, ${mix[1]}, ${mix[2]})`;
}

export function drawBackground(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = COLOR_BG;
  ctx.fillRect(0, 0, W, H);
}

export function drawGrid(ctx: CanvasRenderingContext2D) {
  ctx.strokeStyle = COLOR_GRID;
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

function drawSegment(ctx: CanvasRenderingContext2D, cell: Cell, color: string) {
  const px = cell.x * CELL + SEGMENT_INSET;
  const py = cell.y * CELL + SEGMENT_INSET;
  ctx.fillStyle = color;
  ctx.fillRect(px, py, SEGMENT_SIZE, SEGMENT_SIZE);
  ctx.fillStyle = "rgba(255,255,255,0.15)";
  ctx.fillRect(px, py, SEGMENT_SIZE, 4);
}

// Dos ojos de 6 px en el lado hacia el que mira la cabeza
function drawEyes(ctx: CanvasRenderingContext2D, head: Cell, dir: Dir) {
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
  ctx.fillStyle = COLOR_EYE;
  for (const [ox, oy] of offsets[dir]) ctx.fillRect(cx + ox - 3, cy + oy - 3, 6, 6);
}

// Cuerpo en degradado de --cyan a --green desde la cabeza hasta la cola
export function drawSnake(ctx: CanvasRenderingContext2D, snake: readonly Cell[], dir: Dir) {
  const last = snake.length - 1;
  for (let i = last; i >= 1; i--) {
    // Empieza un poco después del cian de la cabeza para que esta se distinga del cuello
    const t = i / last;
    drawSegment(ctx, snake[i], lerpColor(COLOR_HEAD, COLOR_BODY_END, t));
  }
  drawSegment(ctx, snake[0], COLOR_HEAD);
  drawEyes(ctx, snake[0], dir);
}

export function drawOverlay(
  ctx: CanvasRenderingContext2D,
  title: string,
  color: string,
  lines: string[] = [],
) {
  ctx.fillStyle = "rgba(0,0,0,0.72)";
  ctx.fillRect(0, 0, W, H);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = color;
  ctx.font = "bold 46px monospace";
  ctx.fillText(title, W / 2, H / 2 - 16);
  ctx.fillStyle = COLOR_TEXT;
  ctx.font = "18px monospace";
  lines.forEach((line, i) => ctx.fillText(line, W / 2, H / 2 + 28 + i * 28));
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
}

// Aviso del estado inicial, debajo de la serpiente
export function drawReadyHint(ctx: CanvasRenderingContext2D) {
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = COLOR_TEXT;
  ctx.font = "bold 20px monospace";
  ctx.fillText("PULSA UNA FLECHA PARA EMPEZAR", W / 2, H / 2 + 100);
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
}

export function drawLoadError(ctx: CanvasRenderingContext2D) {
  drawBackground(ctx);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = COLOR_DANGER;
  ctx.font = "bold 18px monospace";
  ctx.fillText("NO SE PUDIERON CARGAR LOS GRÁFICOS", W / 2, H / 2);
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
}
