export const W = 800;
export const H = 600;

// Tablero: ocupa todo el canvas lógico (20 × 40 = 800, 15 × 40 = 600)
export const COLS = 20;
export const ROWS = 15;
export const CELL = 40;
export const BOARD_CELLS = COLS * ROWS;

// Serpiente inicial: cabeza en (10, 7), cuerpo a la izquierda, orientada a la derecha
export const START_HEAD = { x: 10, y: 7 };
export const START_LENGTH = 3;

export const POINTS_PER_FRUIT = 10;
export const FRUITS_PER_LEVEL = 5;

// Velocidad en pasos por segundo: 8 en el nivel 1, +1 por nivel, con tope
export const BASE_STEPS_PER_SECOND = 8;
export const MAX_STEPS_PER_SECOND = 16;

// Giros pendientes que admite la cola de entrada
export const MAX_QUEUED_TURNS = 2;

// Alto con el que se dibuja cada fruta dentro de su celda de 40 px
export const FRUIT_DRAW_HEIGHT = 36;

// Segmentos de la serpiente: margen de 2 px respecto a la celda
export const SEGMENT_INSET = 2;
export const SEGMENT_SIZE = CELL - SEGMENT_INSET * 2;

// Los colores del canvas viven en skins.ts.
