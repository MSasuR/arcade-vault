import type { SkinId } from "../skins";
import type { SpriteTint } from "../spriteTint";
import type { BlockColor } from "./constants";

// Paletas del canvas de Breakout. Único archivo del módulo con colores.

// Tintes de la hoja (ver spriteTint.ts); classic usa la hoja original
export interface SpriteTints {
  paddle: SpriteTint;
  ball: SpriteTint;
  blocks: Record<BlockColor, SpriteTint>; // también tiñe sus frames de explosión
  patternColor: string;
}

export interface BreakoutPalette {
  bg: string;
  sprites: SpriteTints | null; // null = spritesheet original
  overlayVeil: string;
  overlayTitle: string;
  overlayText: string;
  muted: string; // aviso "SILENCIO (M)"
  error: string; // aviso de fallo de carga
  glow: { paddle: number; ball: number; title: number }; // shadowBlur, 0 = sin glow
  glowColor: { paddle: string; ball: string; title: string };
}

const neon = (ramp: [string, string, string]): SpriteTint => ({ ramp, quantize: false });

// Fósforo verde, mismos tonos que el retro de Asteroids (+ sombra para contornos)
const P_HI = "#b4ffb4";
const P_MID = "#4be06a";
const P_LO = "#2fa84f";
const P_SHADE = "#1a5c2a";
const RETRO_BG = "#040904";

const retro = (body: string, light: string, pattern?: SpriteTint["pattern"]): SpriteTint => ({
  ramp: [P_SHADE, body, light],
  quantize: true,
  pattern,
});

export const PALETTES: Record<SkinId, BreakoutPalette> = {
  // Aspecto original (sin regresión): spritesheet sin tocar sobre negro
  classic: {
    bg: "#000",
    sprites: null,
    overlayVeil: "rgba(0, 0, 0, 0.6)",
    overlayTitle: "#fff",
    overlayText: "#e6e9ff",
    muted: "#8a8fb5",
    error: "#ff006e",
    glow: { paddle: 0, ball: 0, title: 0 },
    glowColor: { paddle: "#000", ball: "#000", title: "#000" },
  },
  // Paleta de marca sobre --bg. Cada fila conserva su tono original llevado al neón:
  // rojo → --magenta, turquesa → --green, azul → índigo, violeta, amarillo → --yellow,
  // naranja y gris → --silver. Paleta --cyan y pelota --yellow con glow.
  neon: {
    bg: "#0a0a0f",
    sprites: {
      paddle: neon(["#004a4d", "#00f5ff", "#8cfbff"]),
      ball: neon(["#4a4d00", "#f5ff00", "#fbff8c"]),
      blocks: {
        red: neon(["#4d0021", "#ff006e", "#ff8cbe"]),
        yellow: neon(["#4a4d00", "#f5ff00", "#fbff8c"]),
        cyan: neon(["#004d29", "#00ff88", "#8cffc9"]),
        green: neon(["#17254d", "#4d7cff", "#afc4ff"]),
        magenta: neon(["#35174d", "#b14dff", "#dcafff"]),
        hotpink: neon(["#4d2912", "#ff8a3d", "#ffcaa8"]),
        gray: neon(["#3c3e43", "#c7d0e0", "#e6eaf1"]),
      },
      patternColor: "#0a0a0f",
    },
    overlayVeil: "rgba(10, 10, 15, 0.8)",
    overlayTitle: "#e6e9ff",
    overlayText: "#e6e9ff",
    muted: "#c7d0e0",
    error: "#ff006e",
    glow: { paddle: 10, ball: 8, title: 12 },
    glowColor: { paddle: "#00f5ff", ball: "#f5ff00", title: "#00f5ff" },
  },
  // Fósforo verde: 3 tonos de cuerpo × textura (lisa, rayas, puntos); filas contiguas de
  // los niveles nunca comparten tono y textura
  retro: {
    bg: RETRO_BG,
    sprites: {
      paddle: retro(P_MID, P_HI),
      ball: { ramp: [P_MID, P_HI, P_HI], quantize: true },
      blocks: {
        red: retro(P_LO, P_MID),
        yellow: retro(P_HI, P_HI),
        cyan: retro(P_MID, P_HI),
        magenta: retro(P_LO, P_MID, "dots"),
        hotpink: retro(P_HI, P_HI, "stripes"),
        green: retro(P_MID, P_HI, "stripes"),
        gray: retro(P_LO, P_MID, "stripes"),
      },
      patternColor: RETRO_BG,
    },
    overlayVeil: "rgba(4, 9, 4, 0.82)",
    overlayTitle: P_HI,
    overlayText: P_MID,
    muted: P_MID,
    error: P_HI,
    glow: { paddle: 0, ball: 0, title: 0 },
    glowColor: { paddle: P_HI, ball: P_HI, title: P_HI },
  },
};
