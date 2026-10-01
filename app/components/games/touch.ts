// Mando virtual táctil (spec 11): cada botón envía a window el KeyboardEvent de la
// tecla que el juego ya escucha, así que los módulos de los juegos no cambian.

export interface TouchButton {
  code: string; // KeyboardEvent.code que se envía ("ArrowLeft", "Space", "Enter", "KeyM"…)
  key: string; // KeyboardEvent.key equivalente ("ArrowLeft", " ", "Enter", "m")
  label: string; // texto visible del botón
  aria: string; // aria-label
  repeat?: boolean; // autorrepetido emulado mientras se mantiene
}

export interface TouchLayout {
  move: TouchButton[]; // grupo izquierdo
  moveShape: "row" | "dpad"; // fila de botones o cruceta en cruz
  actions: TouchButton[]; // grupo derecho
  restart: TouchButton | null; // botón REINICIAR; null si una acción ya reinicia
}

export const TOUCH_REPEAT_DELAY = 170; // ms hasta el primer repetido
export const TOUCH_REPEAT_INTERVAL = 50; // ms entre repetidos
