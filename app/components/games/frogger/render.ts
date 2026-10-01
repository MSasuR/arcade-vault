// Dibujo vectorial de Frogger. Todas las funciones reciben el ctx y la paleta por parámetro.
import {
  BAY_W,
  BAY_X,
  CELL,
  H,
  RIVER_OBJECT_H,
  ROAD_OBJECT_H,
  ROW_HELP,
  ROW_HOME,
  ROW_MEDIAN,
  ROW_RIVER_BOTTOM,
  ROW_RIVER_TOP,
  ROW_ROAD_BOTTOM,
  ROW_ROAD_TOP,
  ROW_START,
  TIME_PER_FROG,
  W,
} from "./constants";
import type { DivePhase, Dir, Frog, Lane } from "./logic";
import type { FroggerPalette } from "./skins";

const rowY = (row: number) => row * CELL;

function resetText(ctx: CanvasRenderingContext2D) {
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
}

// Glow opcional: solo con blur > 0 toca shadowBlur, dentro de save/restore
function withGlow(ctx: CanvasRenderingContext2D, blur: number, color: string, draw: () => void) {
  if (blur <= 0) {
    draw();
    return;
  }
  ctx.save();
  ctx.shadowBlur = blur;
  ctx.shadowColor = color;
  draw();
  ctx.restore();
}

const laneColor = (pal: FroggerPalette, lane: Lane) => pal.lanes[lane.row] ?? pal.frog;

// ── Tablero ─────────────────────────────────────────────────────────────────
export function drawBoard(ctx: CanvasRenderingContext2D, pal: FroggerPalette) {
  ctx.fillStyle = pal.bg;
  ctx.fillRect(0, 0, W, H);

  // Orilla de llegada: seto con las 5 casillas de agua
  ctx.fillStyle = pal.sidewalk;
  ctx.fillRect(0, rowY(ROW_HOME), W, CELL);
  ctx.fillStyle = pal.river;
  for (const bx of BAY_X) ctx.fillRect(bx, rowY(ROW_HOME), BAY_W, CELL);
  ctx.strokeStyle = pal.bayEdge;
  ctx.lineWidth = 2;
  for (const bx of BAY_X) ctx.strokeRect(bx + 1, rowY(ROW_HOME) + 1, BAY_W - 2, CELL - 2);

  // Río
  ctx.fillStyle = pal.river;
  ctx.fillRect(0, rowY(ROW_RIVER_TOP), W, (ROW_RIVER_BOTTOM - ROW_RIVER_TOP + 1) * CELL);
  if (pal.riverRipple) {
    // Ondas fijas: tramos cortos desplazados en filas alternas
    ctx.strokeStyle = pal.riverRipple;
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let r = ROW_RIVER_TOP; r <= ROW_RIVER_BOTTOM; r++) {
      const y = rowY(r) + CELL / 2;
      for (let x = (r % 2) * 40 + 8; x < W; x += 80) {
        ctx.moveTo(x, y);
        ctx.lineTo(x + 24, y);
      }
    }
    ctx.stroke();
  }

  // Mediana y acera
  ctx.fillStyle = pal.sidewalk;
  ctx.fillRect(0, rowY(ROW_MEDIAN), W, CELL);
  ctx.fillRect(0, rowY(ROW_START), W, CELL);

  // Carretera con marcas discontinuas entre carriles
  ctx.fillStyle = pal.road;
  ctx.fillRect(0, rowY(ROW_ROAD_TOP), W, (ROW_ROAD_BOTTOM - ROW_ROAD_TOP + 1) * CELL);
  ctx.strokeStyle = pal.laneMark;
  ctx.lineWidth = 2;
  ctx.setLineDash([20, 20]);
  ctx.beginPath();
  for (let r = ROW_ROAD_TOP + 1; r <= ROW_ROAD_BOTTOM; r++) {
    ctx.moveTo(0, rowY(r));
    ctx.lineTo(W, rowY(r));
  }
  ctx.stroke();
  ctx.setLineDash([]);

  // Bordes de la mediana y la acera
  ctx.strokeStyle = pal.edge;
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (const r of [ROW_MEDIAN, ROW_START]) {
    ctx.moveTo(0, rowY(r) + 1);
    ctx.lineTo(W, rowY(r) + 1);
    ctx.moveTo(0, rowY(r + 1) - 1);
    ctx.lineTo(W, rowY(r + 1) - 1);
  }
  ctx.stroke();
}

// ── Carriles ────────────────────────────────────────────────────────────────
// Estilo tube: relleno tenue + contorno del color del carril con glow
function tube(ctx: CanvasRenderingContext2D, pal: FroggerPalette, color: string, path: () => void) {
  ctx.save();
  ctx.globalAlpha *= pal.tubeFill;
  ctx.fillStyle = color;
  path();
  ctx.fill();
  ctx.restore();
  withGlow(ctx, pal.glow.objects, color, () => {
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    path();
    ctx.stroke();
  });
}

function drawVehicle(ctx: CanvasRenderingContext2D, pal: FroggerPalette, lane: Lane, x: number) {
  const y = rowY(lane.row) + (CELL - ROAD_OBJECT_H) / 2;
  const w = lane.width;
  const h = ROAD_OBJECT_H;
  const color = laneColor(pal, lane);
  // Cabina: en el camión junto al morro, en los coches centrada
  const truck = lane.kind === "truck";
  const cabX = truck ? (lane.dir === 1 ? x + w - 30 : x + 6) : x + w / 2 - 10;
  const cabY = truck ? y + 5 : y + 6;
  const cabW = truck ? 24 : 20;
  const cabH = truck ? h - 10 : h - 12;
  if (pal.objectStyle === "tube") {
    tube(ctx, pal, color, () => {
      ctx.beginPath();
      ctx.rect(x + 1, y + 1, w - 2, h - 2);
    });
    // Cabina y franja del deportivo como trazos finos del mismo color
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    ctx.strokeRect(cabX, cabY, cabW, cabH);
    if (lane.kind === "sport") {
      ctx.beginPath();
      ctx.moveTo(x + 4, y + h / 2);
      ctx.lineTo(x + w - 4, y + h / 2);
      ctx.stroke();
    }
  } else {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, w, h);
    // Cabina (más oscura) y franja del deportivo
    ctx.fillStyle = pal.cabin;
    ctx.fillRect(cabX, cabY, cabW, cabH);
    if (lane.kind === "sport") {
      ctx.fillRect(x + 4, y + h / 2 - 2, w - 8, 4);
    }
  }
  // Faros en el morro, según la dirección
  ctx.fillStyle = pal.headlight;
  const lightX = lane.dir === 1 ? x + w - 4 : x;
  ctx.fillRect(lightX, y + 4, 4, 6);
  ctx.fillRect(lightX, y + h - 10, 4, 6);
}

function drawLog(ctx: CanvasRenderingContext2D, pal: FroggerPalette, lane: Lane, x: number) {
  const y = rowY(lane.row) + (CELL - RIVER_OBJECT_H) / 2;
  const w = lane.width;
  const h = RIVER_OBJECT_H;
  const color = laneColor(pal, lane);
  if (pal.objectStyle === "tube") {
    tube(ctx, pal, color, () => {
      ctx.beginPath();
      ctx.roundRect(x + 1, y + 1, w - 2, h - 2, 14);
    });
  } else {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, 14);
    ctx.fill();
  }
  // Vetas
  ctx.strokeStyle = pal.objectStyle === "tube" ? color : pal.grain;
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let gx = x + 20; gx < x + w - 20; gx += 40) {
    ctx.moveTo(gx, y + 10);
    ctx.lineTo(gx + 18, y + 10);
    ctx.moveTo(gx + 10, y + h - 10);
    ctx.lineTo(gx + 28, y + h - 10);
  }
  ctx.stroke();
}

function drawTurtles(
  ctx: CanvasRenderingContext2D,
  pal: FroggerPalette,
  lane: Lane,
  x: number,
  diving: boolean,
  phase: DivePhase,
) {
  const n = Math.round(lane.width / CELL);
  const cy = rowY(lane.row) + CELL / 2;
  const r = RIVER_OBJECT_H / 2 - 2;
  const under = diving && phase === "under";
  const color = laneColor(pal, lane);
  ctx.save();
  if (diving && (phase === "sinking" || phase === "rising")) ctx.globalAlpha = 0.5;
  for (let i = 0; i < n; i++) {
    const cx = x + i * CELL + CELL / 2;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    if (under) {
      // Sumergida: solo un contorno punteado
      ctx.setLineDash([4, 4]);
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.setLineDash([]);
      continue;
    }
    if (pal.objectStyle === "tube") {
      tube(ctx, pal, color, () => {
        ctx.beginPath();
        ctx.arc(cx, cy, r - 1, 0, Math.PI * 2);
      });
    } else {
      ctx.fillStyle = color;
      ctx.fill();
    }
    // Caparazón
    ctx.strokeStyle = pal.objectStyle === "tube" ? color : pal.shell;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, cy, r - 6, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
}

export function drawLanes(
  ctx: CanvasRenderingContext2D,
  pal: FroggerPalette,
  lanes: readonly Lane[],
  phase: DivePhase,
) {
  for (const lane of lanes) {
    lane.objects.forEach((o, i) => {
      if (o.x >= W || o.x + lane.width <= 0) return;
      if (lane.kind === "log") drawLog(ctx, pal, lane, o.x);
      else if (lane.kind === "turtles")
        drawTurtles(ctx, pal, lane, o.x, lane.diving && i === 0, phase);
      else drawVehicle(ctx, pal, lane, o.x);
    });
  }
}

// ── Rana ────────────────────────────────────────────────────────────────────
const ROTATION: Record<Dir, number> = {
  up: 0,
  right: Math.PI / 2,
  down: Math.PI,
  left: -Math.PI / 2,
};

function drawFrogShape(
  ctx: CanvasRenderingContext2D,
  pal: FroggerPalette,
  cx: number,
  cy: number,
  facing: Dir,
) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(ROTATION[facing]);
  if (pal.frogOutline) {
    // Contorno que separa la rana del tronco o la tortuga que pisa
    ctx.fillStyle = pal.frogOutline;
    ctx.fillRect(-18, -16, 12, 12);
    ctx.fillRect(6, -16, 12, 12);
    ctx.fillRect(-18, 6, 12, 12);
    ctx.fillRect(6, 6, 12, 12);
    ctx.beginPath();
    ctx.roundRect(-13, -14, 26, 30, 10);
    ctx.fill();
  }
  if (pal.glow.frog > 0) {
    ctx.shadowBlur = pal.glow.frog;
    ctx.shadowColor = pal.frog;
  }
  ctx.fillStyle = pal.frog;
  // Patas
  ctx.fillRect(-16, -14, 8, 8);
  ctx.fillRect(8, -14, 8, 8);
  ctx.fillRect(-16, 8, 8, 8);
  ctx.fillRect(8, 8, 8, 8);
  // Cuerpo
  ctx.beginPath();
  ctx.roundRect(-11, -12, 22, 26, 8);
  ctx.fill();
  if (pal.glow.frog > 0) ctx.shadowBlur = 0;
  // Ojos hacia delante
  ctx.fillStyle = pal.eye;
  ctx.fillRect(-8, -9, 5, 5);
  ctx.fillRect(3, -9, 5, 5);
  ctx.restore();
}

export function drawFrog(ctx: CanvasRenderingContext2D, pal: FroggerPalette, frog: Frog) {
  drawFrogShape(ctx, pal, frog.x + CELL / 2, rowY(frog.row) + CELL / 2, frog.facing);
}

// Rana muerta: X en su celda
export function drawDeadFrog(ctx: CanvasRenderingContext2D, pal: FroggerPalette, frog: Frog) {
  const cx = frog.x + CELL / 2;
  const cy = rowY(frog.row) + CELL / 2;
  withGlow(ctx, pal.glow.dead, pal.deadMark, () => {
    ctx.strokeStyle = pal.deadMark;
    ctx.lineWidth = 5;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(cx - 13, cy - 13);
    ctx.lineTo(cx + 13, cy + 13);
    ctx.moveTo(cx + 13, cy - 13);
    ctx.lineTo(cx - 13, cy + 13);
    ctx.stroke();
    ctx.lineCap = "butt";
  });
}

// Ranas a salvo y mosca en las casillas
export function drawBays(
  ctx: CanvasRenderingContext2D,
  pal: FroggerPalette,
  bays: readonly boolean[],
  flyBay: number | null,
) {
  BAY_X.forEach((bx, i) => {
    const cx = bx + BAY_W / 2;
    const cy = rowY(ROW_HOME) + CELL / 2;
    if (bays[i]) drawFrogShape(ctx, pal, cx, cy, "down");
    else if (flyBay === i) {
      withGlow(ctx, pal.glow.fly, pal.fly, () => {
        ctx.fillStyle = pal.fly;
        ctx.beginPath();
        ctx.ellipse(cx, cy, 5, 7, 0, 0, Math.PI * 2);
        ctx.fill();
        // Alas
        ctx.strokeStyle = pal.fly;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(cx - 7, cy - 3, 6, 3, -0.5, 0, Math.PI * 2);
        ctx.ellipse(cx + 7, cy - 3, 6, 3, 0.5, 0, Math.PI * 2);
        ctx.stroke();
      });
    }
  });
}

// ── Textos ──────────────────────────────────────────────────────────────────
// Barra de 600×16 en (20, 12): timeOk > 10 s, timeWarn 5–10 s, timeDanger < 5 s
export function drawTimeBar(ctx: CanvasRenderingContext2D, pal: FroggerPalette, timeLeft: number) {
  const t = Math.max(0, Math.min(TIME_PER_FROG, timeLeft));
  ctx.strokeStyle = pal.edge;
  ctx.lineWidth = 2;
  ctx.strokeRect(20, 12, 600, 16);
  ctx.fillStyle = t > 10 ? pal.timeOk : t >= 5 ? pal.timeWarn : pal.timeDanger;
  ctx.fillRect(21, 13, (598 * t) / TIME_PER_FROG, 14);
  ctx.fillStyle = pal.timeLabel;
  ctx.font = "bold 16px monospace";
  ctx.textBaseline = "middle";
  ctx.fillText("TIEMPO", 640, 21);
  resetText(ctx);
}

export function drawHelp(ctx: CanvasRenderingContext2D, pal: FroggerPalette) {
  ctx.fillStyle = pal.help;
  ctx.font = "14px monospace";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("FLECHAS / WASD MOVER · P PAUSA", W / 2, rowY(ROW_HELP) + CELL / 2);
  resetText(ctx);
}

// color = color del estado; con titleInk pasa a ser el glow del título
export function drawOverlay(
  ctx: CanvasRenderingContext2D,
  pal: FroggerPalette,
  title: string,
  color: string,
  lines: string[] = [],
) {
  ctx.fillStyle = pal.veil;
  ctx.fillRect(0, 0, W, H);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = "bold 46px monospace";
  withGlow(ctx, pal.glow.title, color, () => {
    ctx.fillStyle = pal.titleInk ?? color;
    ctx.fillText(title, W / 2, H / 2 - 16);
  });
  ctx.fillStyle = pal.overlayText;
  ctx.font = "18px monospace";
  lines.forEach((line, i) => ctx.fillText(line, W / 2, H / 2 + 28 + i * 28));
  resetText(ctx);
}

// Aviso del estado ready sobre la mediana
export function drawReadyHint(ctx: CanvasRenderingContext2D, pal: FroggerPalette) {
  ctx.fillStyle = pal.veil;
  ctx.fillRect(0, rowY(ROW_MEDIAN), W, CELL);
  ctx.fillStyle = pal.hint;
  ctx.font = "bold 20px monospace";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("PULSA UNA FLECHA PARA EMPEZAR", W / 2, rowY(ROW_MEDIAN) + CELL / 2);
  resetText(ctx);
}

export function drawLevelBanner(ctx: CanvasRenderingContext2D, pal: FroggerPalette, level: number) {
  ctx.fillStyle = pal.veil;
  ctx.fillRect(0, H / 2 - 40, W, 80);
  ctx.font = "bold 40px monospace";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  withGlow(ctx, pal.glow.title, pal.banner, () => {
    ctx.fillStyle = pal.banner;
    ctx.fillText(`NIVEL ${level}`, W / 2, H / 2);
  });
  resetText(ctx);
}
