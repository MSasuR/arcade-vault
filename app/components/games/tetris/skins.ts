import type { SkinId } from "../skins";

// Paletas del canvas de Tetris. Único archivo del módulo con colores.

// Cómo se pinta cada celda:
// - bevel:   relleno sólido + franja superior clara (aspecto original)
// - tube:    tubo de neón (contorno luminoso y relleno oscuro tintado)
// - solid / frame / stripes / cross: texturas del fósforo monocromo (retro), para que las
//   piezas se distingan por luminancia Y por dibujo sin salir del verde
export type BlockStyle = "bevel" | "tube" | "solid" | "frame" | "stripes" | "cross";

export interface PieceLook {
  color: string;
  style: BlockStyle;
}

export interface TetrisPalette {
  bg: string;
  grid: string;
  frame: string; // marco del tablero y del panel SIGUIENTE
  label: string; // texto "SIGUIENTE"
  // Indexado por tipo de pieza (1–8): I, O, T, S, Z, J, L, N
  pieces: (PieceLook | null)[];
  bevel: string; // franja superior del estilo bevel
  tubeFill: number; // alfa del relleno del estilo tube
  // Sombra de caída: con contorno, se dibuja como borde de ese color; si no, la pieza con alfa
  ghost: { alpha: number; outline: string | null };
  overlayVeil: string;
  // Con titleInk el título usa ese color y el del estado (overlayPause/GameOver) es su glow
  titleInk: string | null;
  overlayPause: string;
  overlayGameOver: string;
  overlayText: string;
  glow: { piece: number; title: number }; // shadowBlur (pieza en juego y SIGUIENTE; títulos)
}

const bevel = (color: string): PieceLook => ({ color, style: "bevel" });
const tube = (color: string): PieceLook => ({ color, style: "tube" });

// Fósforo verde, mismos tonos que el retro de Asteroids
const P_HI = "#b4ffb4";
const P_MID = "#4be06a";
const P_LO = "#2fa84f";

export const PALETTES: Record<SkinId, TetrisPalette> = {
  // Aspecto original (sin regresión). I, O, S, Z, L y N coinciden con --cyan, --yellow,
  // --green, --magenta, --bronze y --silver; T y J son derivados neón.
  classic: {
    bg: "#000",
    grid: "rgba(255,255,255,0.06)",
    frame: "rgba(0,245,255,0.35)",
    label: "#8a8fb5",
    pieces: [
      null,
      bevel("#00f5ff"), // I
      bevel("#f5ff00"), // O
      bevel("#b14dff"), // T
      bevel("#00ff88"), // S
      bevel("#ff006e"), // Z
      bevel("#4d7cff"), // J
      bevel("#d97a3a"), // L
      bevel("#c7d0e0"), // N (tuerca)
    ],
    bevel: "rgba(255,255,255,0.12)",
    tubeFill: 0,
    ghost: { alpha: 0.2, outline: null },
    overlayVeil: "rgba(0,0,0,0.72)",
    titleInk: null,
    overlayPause: "#00f5ff",
    overlayGameOver: "#ff006e",
    overlayText: "#e6e9ff",
    glow: { piece: 0, title: 0 },
  },
  // Tubos de neón sobre --bg: mismos tonos por pieza que classic (el jugador los reconoce),
  // L pasa a --gold para separarse más de Z y del fondo
  neon: {
    bg: "#0a0a0f",
    grid: "rgba(0,245,255,0.07)",
    frame: "rgba(0,245,255,0.6)",
    label: "#c7d0e0",
    pieces: [
      null,
      tube("#00f5ff"), // I
      tube("#f5ff00"), // O
      tube("#b14dff"), // T
      tube("#00ff88"), // S
      tube("#ff006e"), // Z
      tube("#4d7cff"), // J
      tube("#ffcf3a"), // L
      tube("#c7d0e0"), // N (tuerca)
    ],
    bevel: "rgba(255,255,255,0.12)",
    tubeFill: 0.22,
    ghost: { alpha: 0.3, outline: null },
    overlayVeil: "rgba(10,10,15,0.8)",
    titleInk: "#e6e9ff",
    overlayPause: "#00f5ff",
    overlayGameOver: "#ff006e",
    overlayText: "#e6e9ff",
    glow: { piece: 8, title: 12 },
  },
  // Fósforo verde: 3 tonos × 4 texturas; dos piezas nunca comparten tono y textura
  retro: {
    bg: "#040904",
    grid: "#0c1f10",
    frame: P_LO,
    label: P_MID,
    pieces: [
      null,
      { color: P_HI, style: "solid" }, // I
      { color: P_HI, style: "frame" }, // O
      { color: P_MID, style: "solid" }, // T
      { color: P_MID, style: "stripes" }, // S
      { color: P_LO, style: "solid" }, // Z
      { color: P_LO, style: "frame" }, // J
      { color: P_MID, style: "cross" }, // L
      { color: P_HI, style: "stripes" }, // N (tuerca)
    ],
    bevel: "rgba(255,255,255,0.12)",
    tubeFill: 0,
    ghost: { alpha: 1, outline: P_LO },
    overlayVeil: "rgba(4,9,4,0.82)",
    titleInk: null,
    overlayPause: P_HI,
    overlayGameOver: P_HI,
    overlayText: P_MID,
    glow: { piece: 0, title: 0 },
  },
};
