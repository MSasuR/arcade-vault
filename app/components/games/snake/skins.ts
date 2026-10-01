import type { SkinId } from "../skins";
import type { SpriteTint } from "../spriteTint";

// Paletas del canvas de Snake. Único archivo del módulo con colores.

// Cómo se pinta el cuerpo:
// - gradient: segmentos sólidos en degradado de head a bodyEnd (aspecto original)
// - tube:     tubos de neón (relleno oscuro tintado + contorno) en degradado de head a bodyEnd
// - bands:    anillos alternos head2/bodyEnd sin degradado (retro)
export type BodyStyle = "gradient" | "tube" | "bands";

export interface SnakePalette {
  bg: string;
  grid: string;
  head: string;
  body: string; // primer tono del cuerpo (en gradient/tube coincide con head)
  bodyEnd: string;
  bodyMid: string | null; // tono intermedio opcional del degradado (null = degradado directo)
  bodyStyle: BodyStyle;
  segmentHighlight: string | null; // franja superior clara de cada segmento
  tubeFill: number; // alfa del relleno en tube
  eye: string;
  hint: string; // aviso "PULSA UNA FLECHA PARA EMPEZAR"
  danger: string; // aviso de fallo de carga
  fruitTint: SpriteTint | null; // null = atlas original
  overlayVeil: string;
  // Con titleInk el título usa ese color y el del estado (overlayPause/…) es su glow
  titleInk: string | null;
  overlayPause: string;
  overlayGameOver: string;
  overlayWin: string;
  overlayText: string;
  glow: { head: number; fruit: number; title: number }; // shadowBlur, 0 = sin glow
  glowColor: { fruit: string };
}

// Fósforo verde, mismos tonos que el retro de Asteroids
const P_HI = "#b4ffb4";
const P_MID = "#4be06a";
const P_LO = "#2fa84f";
const RETRO_BG = "#040904";

export const PALETTES: Record<SkinId, SnakePalette> = {
  // Aspecto original (sin regresión): degradado --cyan → --green sobre negro
  classic: {
    bg: "#000000",
    grid: "rgba(255,255,255,0.06)",
    head: "#00f5ff",
    body: "#00f5ff",
    bodyEnd: "#00ff88",
    bodyMid: null,
    bodyStyle: "gradient",
    segmentHighlight: "rgba(255,255,255,0.15)",
    tubeFill: 0,
    eye: "#0a0a0f",
    hint: "#e6e9ff",
    danger: "#ff006e",
    fruitTint: null,
    overlayVeil: "rgba(0,0,0,0.72)",
    titleInk: null,
    overlayPause: "#00f5ff",
    overlayGameOver: "#ff006e",
    overlayWin: "#e6e9ff",
    overlayText: "#e6e9ff",
    glow: { head: 0, fruit: 0, title: 0 },
    glowColor: { fruit: "#000000" },
  },
  // Tubo de neón --cyan → violeta → --magenta sobre --bg; cabeza sólida con glow, fruta con halo --yellow
  neon: {
    bg: "#0a0a0f",
    grid: "rgba(0,245,255,0.07)",
    head: "#00f5ff",
    body: "#00f5ff",
    bodyEnd: "#ff006e",
    // --cyan → violeta → --magenta: sin el tramo gris-lavanda de la mezcla directa
    bodyMid: "#b14dff",
    bodyStyle: "tube",
    segmentHighlight: null,
    tubeFill: 0.22,
    eye: "#0a0a0f",
    hint: "#e6e9ff",
    danger: "#ff006e",
    fruitTint: null,
    overlayVeil: "rgba(10,10,15,0.8)",
    titleInk: "#e6e9ff",
    overlayPause: "#00f5ff",
    overlayGameOver: "#ff006e",
    overlayWin: "#f5ff00",
    overlayText: "#e6e9ff",
    glow: { head: 10, fruit: 8, title: 12 },
    glowColor: { fruit: "#f5ff00" },
  },
  // Fósforo verde: cabeza brillante, cuerpo en anillos alternos, frutas teñidas en 3 tonos
  retro: {
    bg: RETRO_BG,
    grid: "#0c1f10",
    head: P_HI,
    body: P_MID,
    bodyEnd: P_LO,
    bodyMid: null,
    bodyStyle: "bands",
    segmentHighlight: null,
    tubeFill: 0,
    eye: RETRO_BG,
    hint: P_MID,
    danger: P_HI,
    fruitTint: { ramp: [P_LO, P_MID, P_HI], quantize: true },
    overlayVeil: "rgba(4,9,4,0.82)",
    titleInk: null,
    overlayPause: P_HI,
    overlayGameOver: P_HI,
    overlayWin: P_HI,
    overlayText: P_MID,
    glow: { head: 0, fruit: 0, title: 0 },
    glowColor: { fruit: P_HI },
  },
};
