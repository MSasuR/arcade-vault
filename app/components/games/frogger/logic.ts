// Reglas puras de Frogger: sin DOM ni estado global. index.ts las orquesta.
import {
  BAY_W,
  BAY_X,
  CELL,
  DIVE_CYCLE,
  DIVE_RISE_AT,
  DIVE_SINK_AT,
  DIVE_UNDER_AT,
  FROG_BOX,
  FROG_INSET,
  LANES,
  LOOP,
  LOOP_MAX,
  LOOP_MIN,
  MAX_X,
  POINTS_FLY,
  POINTS_HOME,
  POINTS_TIME_PER_SECOND,
  ROW_HOME,
  ROW_RIVER_BOTTOM,
  ROW_RIVER_TOP,
  ROW_ROAD_BOTTOM,
  ROW_ROAD_TOP,
  ROW_START,
  SPEED_MAX_FACTOR,
  SPEED_STEP,
  START_X,
  W,
  type LaneKind,
} from "./constants";

export type Dir = "up" | "down" | "left" | "right";

export interface Frog {
  x: number; // px, borde izquierdo de la celda de 40 px (0–760)
  row: number; // 1–13
  facing: Dir;
}

export interface LaneObject {
  x: number; // px, borde izquierdo
}

export interface Lane {
  row: number;
  zone: "road" | "river";
  kind: LaneKind;
  width: number;
  dir: 1 | -1;
  baseSpeed: number;
  objects: LaneObject[];
  diving: boolean;
}

export type DivePhase = "up" | "sinking" | "under" | "rising";

const KEY_DIRS: Record<string, Dir> = {
  ArrowUp: "up",
  KeyW: "up",
  ArrowDown: "down",
  KeyS: "down",
  ArrowLeft: "left",
  KeyA: "left",
  ArrowRight: "right",
  KeyD: "right",
};

export function dirFromKey(code: string): Dir | null {
  return KEY_DIRS[code] ?? null;
}

export const isRiverRow = (row: number) => row >= ROW_RIVER_TOP && row <= ROW_RIVER_BOTTOM;
export const isRoadRow = (row: number) => row >= ROW_ROAD_TOP && row <= ROW_ROAD_BOTTOM;

export function startFrog(): Frog {
  return { x: START_X, row: ROW_START, facing: "up" };
}

// Posición inicial: x_i = −400 + desfase + i × (1200 / cantidad)
export function createLanes(): Lane[] {
  return LANES.map((d) => {
    const sep = LOOP / d.count;
    return {
      row: d.row,
      zone: isRoadRow(d.row) ? "road" : "river",
      kind: d.kind,
      width: d.width,
      dir: d.dir,
      baseSpeed: d.baseSpeed,
      diving: d.diving,
      objects: Array.from({ length: d.count }, (_, i) => ({ x: LOOP_MIN + d.offset + i * sep })),
    };
  });
}

export function speedFactor(level: number): number {
  return Math.min(SPEED_MAX_FACTOR, 1 + SPEED_STEP * (level - 1));
}

export function laneSpeed(lane: Lane, level: number): number {
  return lane.baseSpeed * speedFactor(level);
}

// Mantiene x en [−400, 800) sumando o restando exactamente 1200 px
export function wrapX(x: number, dir: 1 | -1): number {
  if (dir === 1 && x >= LOOP_MAX) return x - LOOP;
  if (dir === -1 && x < LOOP_MIN) return x + LOOP;
  return x;
}

// Todos los objetos de un carril avanzan con el mismo v × dt
export function advanceLanes(lanes: readonly Lane[], dt: number, level: number): Lane[] {
  return lanes.map((lane) => {
    const dx = lane.dir * laneSpeed(lane, level) * dt;
    return { ...lane, objects: lane.objects.map((o) => ({ x: wrapX(o.x + dx, lane.dir) })) };
  });
}

export function divePhase(t: number): DivePhase {
  const p = ((t % DIVE_CYCLE) + DIVE_CYCLE) % DIVE_CYCLE;
  if (p < DIVE_SINK_AT) return "up";
  if (p < DIVE_UNDER_AT) return "sinking";
  if (p < DIVE_RISE_AT) return "under";
  return "rising";
}

// El grupo 0 de un carril buceador solo es sólido fuera de la fase "under"
export function isSolid(lane: Lane, index: number, phase: DivePhase): boolean {
  return !(lane.diving && index === 0 && phase === "under");
}

// Salto instantáneo de una celda con límites: ↓ en la acera no hace nada; x ∈ [0, 760]
export function jump(frog: Frog, dir: Dir): Frog {
  switch (dir) {
    case "up":
      return { ...frog, row: Math.max(ROW_HOME, frog.row - 1), facing: dir };
    case "down":
      if (frog.row >= ROW_START) return frog;
      return { ...frog, row: frog.row + 1, facing: dir };
    case "left":
      return { ...frog, x: Math.max(0, frog.x - CELL), facing: dir };
    case "right":
      return { ...frog, x: Math.min(MAX_X, frog.x + CELL), facing: dir };
  }
}

export const frogCenter = (x: number) => x + CELL / 2;

// Carretera: atropello si la caja de 28 px se solapa en horizontal con un vehículo
export function hitByVehicle(frogX: number, lane: Lane): boolean {
  const left = frogX + FROG_INSET;
  const right = left + FROG_BOX;
  return lane.objects.some((o) => left < o.x + lane.width && right > o.x);
}

// Río: a salvo si el centro de la rana está sobre un objeto sólido de su carril
export function supportingObject(frogX: number, lane: Lane, phase: DivePhase): boolean {
  const c = frogCenter(frogX);
  return lane.objects.some((o, i) => isSolid(lane, i, phase) && c >= o.x && c <= o.x + lane.width);
}

// Arrastre del río; la rana muere si su centro sale de [0, 800]
export function carry(frogX: number, lane: Lane, level: number, dt: number) {
  const x = frogX + lane.dir * laneSpeed(lane, level) * dt;
  const c = frogCenter(x);
  return { x, outOfBounds: c < 0 || c > W };
}

// Casilla cuyo rango [bx, bx + 80] contiene el centro de la rana, o −1 (seto)
export function bayAt(frogX: number): number {
  const c = frogCenter(frogX);
  return BAY_X.findIndex((bx) => c >= bx && c <= bx + BAY_W);
}

export function timeBonus(secondsLeft: number): number {
  return POINTS_TIME_PER_SECOND * Math.floor(Math.max(0, secondsLeft));
}

// Puntos al llegar a una casilla libre: 50 + bonus de tiempo (+200 si tenía la mosca)
export function arrivalPoints(secondsLeft: number, withFly: boolean): number {
  return POINTS_HOME + timeBonus(secondsLeft) + (withFly ? POINTS_FLY : 0);
}

// Casilla libre al azar para la mosca (rand ∈ [0, 1)), o −1 si no hay
export function pickFlyBay(bays: readonly boolean[], rand: number): number {
  const free = bays.flatMap((taken, i) => (taken ? [] : [i]));
  if (free.length === 0) return -1;
  return free[Math.min(free.length - 1, Math.floor(rand * free.length))];
}
