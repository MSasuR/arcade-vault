import type { SkinId } from "../skins";

// Paletas del canvas de Frogger. Único archivo del módulo con colores.

// Cómo se pintan vehículos, troncos y tortugas:
// - solid: relleno opaco con detalles oscuros (cabina, vetas, caparazón)
// - tube:  tubo de neón (relleno tenue + contorno del color del carril, con glow)
export type ObjectStyle = "solid" | "tube";

export interface FroggerPalette {
  // Tablero
  bg: string;
  sidewalk: string; // orilla de llegada, mediana y acera
  road: string;
  river: string;
  riverRipple: string | null; // ondas fijas en el río (null = sin ondas)
  laneMark: string; // marcas discontinuas de la carretera
  edge: string; // bordes de mediana/acera y marco de la barra de tiempo
  bayEdge: string; // contorno de las 5 casillas de llegada
  // Objetos de los carriles, por fila (12…8 carretera, 6…2 río)
  lanes: Readonly<Record<number, string>>;
  objectStyle: ObjectStyle;
  tubeFill: number; // alfa del relleno en tube
  headlight: string;
  cabin: string; // solid: cabinas y franja del deportivo
  grain: string; // solid: vetas de los troncos
  shell: string; // solid: caparazón de las tortugas
  // Rana, mosca y muerte
  frog: string;
  frogOutline: string | null; // contorno que la separa del tronco/tortuga (null = sin contorno)
  eye: string;
  fly: string;
  deadMark: string;
  // Barra de tiempo y textos
  timeOk: string; // > 10 s
  timeWarn: string; // 5–10 s
  timeDanger: string; // < 5 s
  timeLabel: string;
  help: string;
  hint: string; // "PULSA UNA FLECHA PARA EMPEZAR"
  banner: string; // "NIVEL N"
  veil: string;
  // Con titleInk el título usa ese color y el del estado (overlayPause/…) es su glow
  titleInk: string | null;
  overlayPause: string;
  overlayGameOver: string;
  overlayText: string;
  glow: { frog: number; objects: number; fly: number; dead: number; title: number }; // shadowBlur, 0 = sin glow
}

const NO_GLOW = { frog: 0, objects: 0, fly: 0, dead: 0, title: 0 };

// Fósforo verde, mismos tonos que el retro de Asteroids y Snake
const P_HI = "#b4ffb4";
const P_MID = "#4be06a";
const P_LO = "#2fa84f";
const RETRO_BG = "#040904";

export const PALETTES: Record<SkinId, FroggerPalette> = {
  // Aspecto original (sin regresión): paleta de globals.css con objetos sólidos
  classic: {
    bg: "#0a0a0f", // --bg
    sidewalk: "#0f0f18", // --bg-2
    road: "#15151f", // --bg-3
    river: "#001f2a", // fondo de .cover-rana
    riverRipple: null,
    laneMark: "rgba(255, 255, 255, 0.06)", // --line-2
    edge: "rgba(0, 245, 255, 0.18)", // --line
    bayEdge: "#ff006e", // --magenta
    lanes: {
      12: "#f5ff00",
      11: "#ff006e",
      10: "#00f5ff",
      9: "#ffcf3a",
      8: "#c7d0e0",
      6: "#00f5ff",
      5: "#d97a3a",
      4: "#d97a3a",
      3: "#00f5ff",
      2: "#d97a3a",
    },
    objectStyle: "solid",
    tubeFill: 0,
    headlight: "#e6e9ff", // --ink
    cabin: "rgba(10, 10, 15, 0.55)",
    grain: "rgba(10, 10, 15, 0.35)",
    shell: "rgba(10, 10, 15, 0.45)",
    frog: "#00ff88", // --green
    frogOutline: null,
    eye: "#0a0a0f",
    fly: "#f5ff00",
    deadMark: "#ff006e",
    timeOk: "#00ff88",
    timeWarn: "#f5ff00",
    timeDanger: "#ff006e",
    timeLabel: "#e6e9ff",
    help: "#8a8fb5", // --ink-dim
    hint: "#e6e9ff",
    banner: "#00ff88",
    veil: "rgba(10, 10, 15, 0.72)",
    titleInk: null,
    overlayPause: "#e6e9ff",
    overlayGameOver: "#ff006e",
    overlayText: "#e6e9ff",
    glow: NO_GLOW,
  },
  // Tubos de neón sobre --bg: contorno del color del carril con glow, rana sólida brillante
  neon: {
    bg: "#0a0a0f",
    sidewalk: "#0f0f18",
    road: "#0a0a0f",
    river: "#04121c",
    riverRipple: "rgba(0, 245, 255, 0.12)",
    laneMark: "rgba(0, 245, 255, 0.14)",
    edge: "rgba(0, 245, 255, 0.4)",
    bayEdge: "#ff006e",
    lanes: {
      12: "#f5ff00", // --yellow
      11: "#ff006e", // --magenta
      10: "#00f5ff", // --cyan
      9: "#ffcf3a", // --gold
      8: "#b14dff", // violeta (como el degradado neon de Snake)
      6: "#00f5ff",
      5: "#ff8a3d",
      4: "#ff8a3d",
      3: "#00f5ff",
      2: "#ff8a3d",
    },
    objectStyle: "tube",
    tubeFill: 0.2,
    headlight: "#e6e9ff",
    cabin: "#0a0a0f",
    grain: "#0a0a0f",
    shell: "#0a0a0f",
    frog: "#00ff88",
    frogOutline: null,
    eye: "#0a0a0f",
    fly: "#f5ff00",
    deadMark: "#ff006e",
    timeOk: "#00ff88",
    timeWarn: "#f5ff00",
    timeDanger: "#ff006e",
    timeLabel: "#e6e9ff",
    help: "#8a8fb5",
    hint: "#e6e9ff",
    banner: "#00ff88",
    veil: "rgba(10, 10, 15, 0.8)",
    titleInk: "#e6e9ff",
    overlayPause: "#00f5ff",
    overlayGameOver: "#ff006e",
    overlayText: "#e6e9ff",
    glow: { frog: 10, objects: 6, fly: 8, dead: 10, title: 12 },
  },
  // Fósforo verde: rana en el tono alto con contorno oscuro, vehículos alternando tonos,
  // río con ondas para distinguirlo del asfalto sin color
  retro: {
    bg: RETRO_BG,
    sidewalk: "#0c1f10",
    road: RETRO_BG,
    river: RETRO_BG,
    riverRipple: "#1b4d27",
    laneMark: "#163d20",
    edge: P_LO,
    bayEdge: P_LO,
    lanes: {
      12: P_MID,
      11: P_LO,
      10: P_MID,
      9: P_LO,
      8: P_MID,
      6: P_MID,
      5: P_LO,
      4: P_LO,
      3: P_MID,
      2: P_LO,
    },
    objectStyle: "solid",
    tubeFill: 0,
    headlight: P_HI,
    cabin: RETRO_BG,
    grain: RETRO_BG,
    shell: RETRO_BG,
    frog: P_HI,
    frogOutline: RETRO_BG,
    eye: RETRO_BG,
    fly: P_HI,
    deadMark: P_HI,
    timeOk: P_MID,
    timeWarn: P_HI,
    timeDanger: P_HI,
    timeLabel: P_MID,
    help: P_LO,
    hint: P_HI,
    banner: P_HI,
    veil: "rgba(4, 9, 4, 0.82)",
    titleInk: null,
    overlayPause: P_HI,
    overlayGameOver: P_HI,
    overlayText: P_MID,
    glow: NO_GLOW,
  },
};
