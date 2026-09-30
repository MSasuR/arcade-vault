import { FRUIT_NAMES, type FruitName } from "./atlas";
import {
  BASE_STEPS_PER_SECOND,
  COLS,
  FRUITS_PER_LEVEL,
  MAX_QUEUED_TURNS,
  MAX_STEPS_PER_SECOND,
  ROWS,
  START_HEAD,
  START_LENGTH,
} from "./constants";

export interface Cell {
  x: number; // columna 0–19
  y: number; // fila 0–14
}

export type Dir = "up" | "down" | "left" | "right";

const VECTORS: Record<Dir, Cell> = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};

const OPPOSITE: Record<Dir, Dir> = { up: "down", down: "up", left: "right", right: "left" };

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

export const START_DIR: Dir = "right";

export function dirFromKey(code: string): Dir | null {
  return KEY_DIRS[code] ?? null;
}

export function isOpposite(a: Dir, b: Dir): boolean {
  return OPPOSITE[a] === b;
}

export function sameCell(a: Cell, b: Cell): boolean {
  return a.x === b.x && a.y === b.y;
}

// Serpiente inicial con la cabeza en el índice 0 y el cuerpo a su izquierda
export function createInitialSnake(): Cell[] {
  return Array.from({ length: START_LENGTH }, (_, i) => ({ x: START_HEAD.x - i, y: START_HEAD.y }));
}

// Encola un giro. Se ignora si es igual u opuesto al último giro (o a la dirección actual si la
// cola está vacía) y si la cola ya tiene MAX_QUEUED_TURNS giros pendientes.
export function queueTurn(current: Dir, queue: readonly Dir[], next: Dir): Dir[] {
  const last = queue.length > 0 ? queue[queue.length - 1] : current;
  if (next === last || isOpposite(last, next)) return [...queue];
  if (queue.length >= MAX_QUEUED_TURNS) return [...queue];
  return [...queue, next];
}

export function nextHead(head: Cell, dir: Dir): Cell {
  return { x: head.x + VECTORS[dir].x, y: head.y + VECTORS[dir].y };
}

export function isOutside(cell: Cell): boolean {
  return cell.x < 0 || cell.x >= COLS || cell.y < 0 || cell.y >= ROWS;
}

export interface StepResult {
  snake: Cell[];
  ate: boolean;
  collision: "wall" | "body" | null;
}

// Avanza un paso. Si no come, la cola se libera antes de comprobar el choque con el cuerpo,
// así que mover la cabeza a la celda que deja la cola no es un choque. Si hay choque, la
// serpiente no cambia.
export function stepSnake(snake: readonly Cell[], dir: Dir, fruit: Cell | null): StepResult {
  const head = nextHead(snake[0], dir);
  if (isOutside(head)) return { snake: [...snake], ate: false, collision: "wall" };

  const ate = fruit !== null && sameCell(head, fruit);
  const kept = ate ? snake : snake.slice(0, -1);
  if (kept.some((cell) => sameCell(cell, head)))
    return { snake: [...snake], ate: false, collision: "body" };

  return { snake: [head, ...kept], ate, collision: null };
}

// Celdas libres en orden de filas (de arriba abajo, de izquierda a derecha)
export function freeCells(snake: readonly Cell[]): Cell[] {
  const taken = new Set(snake.map((c) => c.y * COLS + c.x));
  const free: Cell[] = [];
  for (let y = 0; y < ROWS; y++)
    for (let x = 0; x < COLS; x++) if (!taken.has(y * COLS + x)) free.push({ x, y });
  return free;
}

// Elige una celda libre al azar; devuelve null si el tablero está lleno
export function pickFruitCell(snake: readonly Cell[], random: () => number = Math.random): Cell | null {
  const free = freeCells(snake);
  if (free.length === 0) return null;
  return free[Math.floor(random() * free.length)];
}

// Elige una fruta al azar distinta de la anterior
export function pickFruitName(prev: FruitName | null, random: () => number = Math.random): FruitName {
  const pool = prev === null ? FRUIT_NAMES : FRUIT_NAMES.filter((name) => name !== prev);
  return pool[Math.floor(random() * pool.length)];
}

export function levelFor(fruitsEaten: number): number {
  return Math.floor(fruitsEaten / FRUITS_PER_LEVEL) + 1;
}

export function stepsPerSecond(level: number): number {
  return Math.min(MAX_STEPS_PER_SECOND, BASE_STEPS_PER_SECOND + level - 1);
}
