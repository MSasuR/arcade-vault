import {
  BLOCK,
  BOARD_X,
  BOARD_Y,
  COLS,
  H,
  NEXT_CELLS,
  NEXT_LABEL_Y,
  NEXT_X,
  NEXT_Y,
  ROWS,
  W,
} from "./constants";
import { ghostY, type Board, type Piece, type Shape } from "./logic";
import type { TetrisPalette } from "./skins";

// Cómo se dibuja una forma: normal, como sombra de caída o con glow (pieza en juego)
type Mode = "normal" | "ghost" | "glow";

function drawCell(
  ctx: CanvasRenderingContext2D,
  pal: TetrisPalette,
  px: number,
  py: number,
  colorIndex: number,
  mode: Mode = "normal",
) {
  if (!colorIndex) return;
  const look = pal.pieces[colorIndex];
  if (!look) return;
  const x = px + 1;
  const y = py + 1;
  const s = BLOCK - 2;

  // Sombra de caída como contorno (retro): sin alfas que creen tonos fuera de la paleta
  if (mode === "ghost" && pal.ghost.outline) {
    ctx.strokeStyle = pal.ghost.outline;
    ctx.lineWidth = 2;
    ctx.strokeRect(x + 1, y + 1, s - 2, s - 2);
    return;
  }

  ctx.globalAlpha = mode === "ghost" ? pal.ghost.alpha : 1;
  switch (look.style) {
    case "bevel":
      ctx.fillStyle = look.color;
      ctx.fillRect(x, y, s, s);
      ctx.fillStyle = pal.bevel;
      ctx.fillRect(x, y, s, 4);
      break;
    case "tube": {
      ctx.save();
      ctx.globalAlpha *= pal.tubeFill;
      ctx.fillStyle = look.color;
      ctx.fillRect(x, y, s, s);
      ctx.restore();
      ctx.save();
      if (mode === "glow" && pal.glow.piece > 0) {
        ctx.shadowBlur = pal.glow.piece;
        ctx.shadowColor = look.color;
      }
      ctx.strokeStyle = look.color;
      ctx.lineWidth = 2;
      ctx.strokeRect(x + 2, y + 2, s - 4, s - 4);
      // Núcleo del tubo: punto central que da cuerpo a la celda
      ctx.fillStyle = look.color;
      ctx.fillRect(x + s / 2 - 3, y + s / 2 - 3, 6, 6);
      ctx.restore();
      break;
    }
    case "solid":
      ctx.fillStyle = look.color;
      ctx.fillRect(x, y, s, s);
      break;
    case "frame":
      // Borde grueso con el centro hueco
      ctx.fillStyle = look.color;
      ctx.fillRect(x, y, s, s);
      ctx.fillStyle = pal.bg;
      ctx.fillRect(x + 7, y + 7, s - 14, s - 14);
      break;
    case "stripes":
      // Tres franjas horizontales
      ctx.fillStyle = look.color;
      ctx.fillRect(x, y, s, 6);
      ctx.fillRect(x, y + 11, s, 6);
      ctx.fillRect(x, y + 22, s, 6);
      break;
    case "cross":
      // Cuatro cuadrantes separados por una cruz del fondo
      ctx.fillStyle = look.color;
      ctx.fillRect(x, y, s, s);
      ctx.fillStyle = pal.bg;
      ctx.fillRect(x + s / 2 - 2, y, 4, s);
      ctx.fillRect(x, y + s / 2 - 2, s, 4);
      break;
  }
  ctx.globalAlpha = 1;
}

function drawShape(
  ctx: CanvasRenderingContext2D,
  pal: TetrisPalette,
  shape: Shape,
  cx: number,
  cy: number,
  mode: Mode = "normal",
) {
  for (let r = 0; r < shape.length; r++)
    for (let c = 0; c < shape[r].length; c++)
      drawCell(
        ctx,
        pal,
        BOARD_X + (cx + c) * BLOCK,
        BOARD_Y + (cy + r) * BLOCK,
        shape[r][c],
        mode,
      );
}

function drawGrid(ctx: CanvasRenderingContext2D, pal: TetrisPalette) {
  ctx.strokeStyle = pal.grid;
  ctx.lineWidth = 0.5;
  ctx.beginPath();
  for (let c = 1; c < COLS; c++) {
    ctx.moveTo(BOARD_X + c * BLOCK, BOARD_Y);
    ctx.lineTo(BOARD_X + c * BLOCK, BOARD_Y + ROWS * BLOCK);
  }
  for (let r = 1; r < ROWS; r++) {
    ctx.moveTo(BOARD_X, BOARD_Y + r * BLOCK);
    ctx.lineTo(BOARD_X + COLS * BLOCK, BOARD_Y + r * BLOCK);
  }
  ctx.stroke();
}

function drawFrame(
  ctx: CanvasRenderingContext2D,
  pal: TetrisPalette,
  x: number,
  y: number,
  w: number,
  h: number,
) {
  ctx.strokeStyle = pal.frame;
  ctx.lineWidth = 1;
  ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
}

function drawNext(ctx: CanvasRenderingContext2D, pal: TetrisPalette, next: Piece) {
  const size = NEXT_CELLS * BLOCK;
  ctx.fillStyle = pal.label;
  ctx.font = "bold 14px monospace";
  ctx.textAlign = "left";
  ctx.fillText("SIGUIENTE", NEXT_X, NEXT_LABEL_Y);
  drawFrame(ctx, pal, NEXT_X, NEXT_Y, size, size);

  const { shape } = next;
  const offX = Math.floor((NEXT_CELLS - shape[0].length) / 2);
  const offY = Math.floor((NEXT_CELLS - shape.length) / 2);
  for (let r = 0; r < shape.length; r++)
    for (let c = 0; c < shape[r].length; c++)
      drawCell(
        ctx,
        pal,
        NEXT_X + (offX + c) * BLOCK,
        NEXT_Y + (offY + r) * BLOCK,
        shape[r][c],
        "glow",
      );
}

export function drawOverlay(
  ctx: CanvasRenderingContext2D,
  pal: TetrisPalette,
  title: string,
  color: string,
  lines: string[] = [],
) {
  ctx.fillStyle = pal.overlayVeil;
  ctx.fillRect(0, 0, W, H);
  ctx.textAlign = "center";
  ctx.save();
  if (pal.glow.title > 0) {
    ctx.shadowBlur = pal.glow.title;
    ctx.shadowColor = color;
  }
  ctx.fillStyle = pal.titleInk ?? color;
  ctx.font = "bold 46px monospace";
  ctx.fillText(title, W / 2, H / 2 - 10);
  ctx.restore();
  ctx.fillStyle = pal.overlayText;
  ctx.font = "18px monospace";
  lines.forEach((line, i) => ctx.fillText(line, W / 2, H / 2 + 28 + i * 28));
  ctx.textAlign = "left";
}

export function drawScene(
  ctx: CanvasRenderingContext2D,
  pal: TetrisPalette,
  board: Board,
  current: Piece,
  next: Piece,
) {
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = pal.bg;
  ctx.fillRect(0, 0, W, H);

  drawGrid(ctx, pal);
  drawFrame(ctx, pal, BOARD_X, BOARD_Y, COLS * BLOCK, ROWS * BLOCK);

  for (let r = 0; r < ROWS; r++)
    for (let c = 0; c < COLS; c++)
      drawCell(ctx, pal, BOARD_X + c * BLOCK, BOARD_Y + r * BLOCK, board[r][c]);

  drawShape(ctx, pal, current.shape, current.x, ghostY(board, current), "ghost");
  drawShape(ctx, pal, current.shape, current.x, current.y, "glow");

  drawNext(ctx, pal, next);
}
