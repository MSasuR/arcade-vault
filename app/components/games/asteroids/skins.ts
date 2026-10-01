import type { SkinId } from "../skins";

// Paletas del canvas de Asteroids (spec 10). Único archivo del módulo con colores.
export interface AsteroidsPalette {
  bg: string;
  ship: string;
  flame: string; // incluye alfa si aplica
  asteroid: string;
  bullet: string;
  particle: string; // se dibuja con globalAlpha = ttl / life
  powerUp: string; // rombo y texto "3x"
  timer: string; // contador "3x  N.Ns"
  overlayVeil: string | null; // velo a pantalla completa bajo PAUSA / GAME OVER
  overlayTitle: string;
  overlayTitleGlow: string; // color del glow del título (si glow.title > 0)
  overlaySub: string;
  lineWidth: number; // trazo de nave y asteroides (px lógicos)
  lineJoin: CanvasLineJoin;
  bulletStyle: { shape: "round" | "square"; size: number }; // solo dibujo; no afecta colisiones
  glow: { ship: number; asteroid: number; bullet: number; powerUp: number; title: number }; // shadowBlur, 0 = sin glow
}

const NO_GLOW = { ship: 0, asteroid: 0, bullet: 0, powerUp: 0, title: 0 };

export const PALETTES: Record<SkinId, AsteroidsPalette> = {
  // Aspecto original (sin regresión): vectorial blanco sobre negro
  classic: {
    bg: "#000000",
    ship: "#ffffff",
    flame: "rgba(255, 130, 0, 0.85)",
    asteroid: "#ffffff",
    bullet: "#ffffff",
    particle: "#ffffff",
    powerUp: "#00ffff",
    timer: "#00ffff",
    overlayVeil: null,
    overlayTitle: "#ffffff",
    overlayTitleGlow: "#ffffff",
    overlaySub: "rgba(255,255,255,0.65)",
    lineWidth: 1.5,
    lineJoin: "round",
    bulletStyle: { shape: "round", size: 2 },
    glow: NO_GLOW,
  },
  // Paleta de marca de globals.css (--bg, --cyan, --magenta, --yellow, --green, --gold, --ink)
  neon: {
    bg: "#0a0a0f",
    ship: "#00f5ff",
    flame: "rgba(255, 207, 58, 0.85)",
    asteroid: "#ff006e",
    bullet: "#f5ff00",
    particle: "#ff006e",
    powerUp: "#00ff88",
    timer: "#00ff88",
    overlayVeil: "rgba(10, 10, 15, 0.75)",
    overlayTitle: "#e6e9ff",
    overlayTitleGlow: "#00f5ff",
    overlaySub: "#8a8fb5",
    lineWidth: 2,
    lineJoin: "round",
    bulletStyle: { shape: "round", size: 2.5 },
    glow: { ship: 10, asteroid: 6, bullet: 8, powerUp: 10, title: 12 },
  },
  // Fósforo verde monocromo: 4 tonos + fondo, sin glow ni degradados
  retro: {
    bg: "#040904",
    ship: "#b4ffb4",
    flame: "#2fa84f",
    asteroid: "#4be06a",
    bullet: "#b4ffb4",
    particle: "#2fa84f",
    powerUp: "#b4ffb4",
    timer: "#4be06a",
    overlayVeil: "rgba(4, 9, 4, 0.7)",
    overlayTitle: "#b4ffb4",
    overlayTitleGlow: "#b4ffb4",
    overlaySub: "#4be06a",
    lineWidth: 2.5,
    lineJoin: "miter",
    bulletStyle: { shape: "square", size: 5 },
    glow: NO_GLOW,
  },
};
