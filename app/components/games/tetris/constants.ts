export const W = 800;
export const H = 600;

export const COLS = 10;
export const ROWS = 20;
export const BLOCK = 30;

// Tablero centrado en el canvas lógico 800×600
export const BOARD_X = (W - COLS * BLOCK) / 2;
export const BOARD_Y = 0;

// Panel SIGUIENTE: vista previa de 4×4 celdas de BLOCK px
export const NEXT_X = 580;
export const NEXT_LABEL_Y = 60;
export const NEXT_Y = 80;
export const NEXT_CELLS = 4;

export const LINE_SCORES = [0, 100, 300, 500, 800];

// Segundos: max(0.1, 1 − (nivel − 1) × 0.09)
export const BASE_DROP_INTERVAL = 1;
export const MIN_DROP_INTERVAL = 0.1;
export const DROP_STEP_PER_LEVEL = 0.09;
export const LINES_PER_LEVEL = 10;

// Wall kicks probados al rotar, en este orden
export const KICKS = [0, -1, 1, -2, 2];

// Paleta neón de la plataforma, indexada por tipo de pieza (1–8).
// Hex fijos: el canvas no lee variables CSS. I, O, S, Z, L y N coinciden con
// --cyan, --yellow, --green, --magenta, --bronze y --silver de globals.css.
export const COLORS: (string | null)[] = [
  null,
  "#00f5ff", // I
  "#f5ff00", // O
  "#b14dff", // T (derivado neón)
  "#00ff88", // S
  "#ff006e", // Z
  "#4d7cff", // J (derivado neón)
  "#d97a3a", // L
  "#c7d0e0", // N (tuerca)
];

export const PIECES: (number[][] | null)[] = [
  null,
  [
    [0, 0, 0, 0],
    [1, 1, 1, 1],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ], // I
  [
    [2, 2],
    [2, 2],
  ], // O
  [
    [0, 3, 0],
    [3, 3, 3],
    [0, 0, 0],
  ], // T
  [
    [0, 4, 4],
    [4, 4, 0],
    [0, 0, 0],
  ], // S
  [
    [5, 5, 0],
    [0, 5, 5],
    [0, 0, 0],
  ], // Z
  [
    [6, 0, 0],
    [6, 6, 6],
    [0, 0, 0],
  ], // J
  [
    [0, 0, 7],
    [7, 7, 7],
    [0, 0, 0],
  ], // L
  [
    [8, 8, 8],
    [8, 0, 8],
    [8, 8, 8],
  ], // N (tuerca)
];

export const PIECE_TYPES = PIECES.length - 1;
