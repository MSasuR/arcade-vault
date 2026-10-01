export const W = 800;
export const H = 600;

// Rejilla: 20 × 15 celdas de 40 px ocupan todo el canvas lógico
export const CELL = 40;
export const COLS = 20;
export const ROWS = 15;

// Filas por zona
export const ROW_TIME = 0;
export const ROW_HOME = 1;
export const ROW_RIVER_TOP = 2;
export const ROW_RIVER_BOTTOM = 6;
export const ROW_MEDIAN = 7;
export const ROW_ROAD_TOP = 8;
export const ROW_ROAD_BOTTOM = 12;
export const ROW_START = 13;
export const ROW_HELP = 14;

// Rana: aparece en la acera con el centro en x = 400; caja de colisión de 28 px
export const START_X = 380;
export const MAX_X = W - CELL; // 760
export const FROG_BOX = 28;
export const FROG_INSET = (CELL - FROG_BOX) / 2; // 6

// Bucle de los carriles: x ∈ [−400, 800)
export const LOOP = 1200;
export const LOOP_MIN = -400;
export const LOOP_MAX = 800;

// Alto de los objetos y su margen dentro de la fila
export const ROAD_OBJECT_H = 32;
export const RIVER_OBJECT_H = 36;

// Orilla de llegada: 5 casillas de 80 px
export const BAY_X = [40, 200, 360, 520, 680] as const;
export const BAY_W = 80;

// Tiempos (s)
export const TIME_PER_FROG = 30;
export const DYING_TIME = 1.0;
export const LEVEL_BANNER_TIME = 1.5;
export const FLY_DELAY = 6;
export const FLY_DURATION = 4;
// Ciclo de las tortugas buceadoras: a flote, hundiéndose, sumergidas, emergiendo
export const DIVE_CYCLE = 5;
export const DIVE_SINK_AT = 3;
export const DIVE_UNDER_AT = 3.5;
export const DIVE_RISE_AT = 4.5;

// Vidas
export const START_LIVES = 3;
export const EXTRA_LIFE_AT = 10_000;

// Puntos
export const POINTS_ROW = 10;
export const POINTS_HOME = 50;
export const POINTS_TIME_PER_SECOND = 10;
export const POINTS_FLY = 200;
export const POINTS_LEVEL = 1000;

// Velocidad: factor = min(2, 1 + 0.15 × (nivel − 1))
export const SPEED_STEP = 0.15;
export const SPEED_MAX_FACTOR = 2;

export type LaneKind = "car" | "sport" | "truck" | "log" | "turtles";

export interface LaneDef {
  row: number;
  kind: LaneKind;
  width: number; // px
  dir: 1 | -1; // 1 = derecha, -1 = izquierda
  baseSpeed: number; // px/s en el nivel 1
  count: number;
  offset: number; // px
  diving: boolean; // el grupo 0 bucea (solo tortugas)
}

// Tabla de carriles de la spec (filas 12 a 2)
export const LANES: readonly LaneDef[] = [
  {
    row: 12,
    kind: "car",
    width: 60,
    dir: -1,
    baseSpeed: 60,
    count: 3,
    offset: 0,
    diving: false,
  },
  {
    row: 11,
    kind: "car",
    width: 60,
    dir: 1,
    baseSpeed: 80,
    count: 3,
    offset: 120,
    diving: false,
  },
  {
    row: 10,
    kind: "car",
    width: 60,
    dir: -1,
    baseSpeed: 100,
    count: 3,
    offset: 240,
    diving: false,
  },
  {
    row: 9,
    kind: "sport",
    width: 60,
    dir: 1,
    baseSpeed: 160,
    count: 2,
    offset: 60,
    diving: false,
  },
  {
    row: 8,
    kind: "truck",
    width: 120,
    dir: -1,
    baseSpeed: 70,
    count: 2,
    offset: 300,
    diving: false,
  },
  {
    row: 6,
    kind: "turtles",
    width: 120,
    dir: -1,
    baseSpeed: 60,
    count: 4,
    offset: 0,
    diving: true,
  },
  {
    row: 5,
    kind: "log",
    width: 120,
    dir: 1,
    baseSpeed: 50,
    count: 4,
    offset: 150,
    diving: false,
  },
  {
    row: 4,
    kind: "log",
    width: 240,
    dir: 1,
    baseSpeed: 90,
    count: 3,
    offset: 0,
    diving: false,
  },
  {
    row: 3,
    kind: "turtles",
    width: 80,
    dir: -1,
    baseSpeed: 80,
    count: 4,
    offset: 100,
    diving: true,
  },
  {
    row: 2,
    kind: "log",
    width: 160,
    dir: 1,
    baseSpeed: 70,
    count: 3,
    offset: 200,
    diving: false,
  },
];
