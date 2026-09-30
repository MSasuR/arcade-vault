import {
  BLOCK,
  BOARD_X,
  BOARD_Y,
  COLORS,
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

function drawBlock(
  ctx: CanvasRenderingContext2D,
  px: number,
  py: number,
  colorIndex: number,
  alpha = 1,
) {
  if (!colorIndex) return;
  ctx.globalAlpha = alpha;
  ctx.fillStyle = COLORS[colorIndex] ?? "#ffffff";
  ctx.fillRect(px + 1, py + 1, BLOCK - 2, BLOCK - 2);
  ctx.fillStyle = "rgba(255,255,255,0.12)";
  ctx.fillRect(px + 1, py + 1, BLOCK - 2, 4);
  ctx.globalAlpha = 1;
}

function drawShape(
  ctx: CanvasRenderingContext2D,
  shape: Shape,
  cx: number,
  cy: number,
  alpha = 1,
) {
  for (let r = 0; r < shape.length; r++)
    for (let c = 0; c < shape[r].length; c++)
      drawBlock(
        ctx,
        BOARD_X + (cx + c) * BLOCK,
        BOARD_Y + (cy + r) * BLOCK,
        shape[r][c],
        alpha,
      );
}

function drawGrid(ctx: CanvasRenderingContext2D) {
  ctx.strokeStyle = "rgba(255,255,255,0.06)"; // --line-2
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

function drawFrame(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  ctx.strokeStyle = "rgba(0,245,255,0.35)"; // --line, más visible sobre negro
  ctx.lineWidth = 1;
  ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
}

function drawNext(ctx: CanvasRenderingContext2D, next: Piece) {
  const size = NEXT_CELLS * BLOCK;
  ctx.fillStyle = "#8a8fb5"; // --ink-dim
  ctx.font = "bold 14px monospace";
  ctx.textAlign = "left";
  ctx.fillText("SIGUIENTE", NEXT_X, NEXT_LABEL_Y);
  drawFrame(ctx, NEXT_X, NEXT_Y, size, size);

  const { shape } = next;
  const offX = Math.floor((NEXT_CELLS - shape[0].length) / 2);
  const offY = Math.floor((NEXT_CELLS - shape.length) / 2);
  for (let r = 0; r < shape.length; r++)
    for (let c = 0; c < shape[r].length; c++)
      drawBlock(ctx, NEXT_X + (offX + c) * BLOCK, NEXT_Y + (offY + r) * BLOCK, shape[r][c]);
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
  ctx.fillStyle = color;
  ctx.font = "bold 46px monospace";
  ctx.fillText(title, W / 2, H / 2 - 10);
  ctx.fillStyle = "#e6e9ff"; // --ink
  ctx.font = "18px monospace";
  lines.forEach((line, i) => ctx.fillText(line, W / 2, H / 2 + 28 + i * 28));
  ctx.textAlign = "left";
}

export function drawScene(
  ctx: CanvasRenderingContext2D,
  board: Board,
  current: Piece,
  next: Piece,
) {
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, W, H);

  drawGrid(ctx);
  drawFrame(ctx, BOARD_X, BOARD_Y, COLS * BLOCK, ROWS * BLOCK);

  for (let r = 0; r < ROWS; r++)
    for (let c = 0; c < COLS; c++)
      drawBlock(ctx, BOARD_X + c * BLOCK, BOARD_Y + r * BLOCK, board[r][c]);

  drawShape(ctx, current.shape, current.x, ghostY(board, current), 0.2);
  drawShape(ctx, current.shape, current.x, current.y);

  drawNext(ctx, next);
}
