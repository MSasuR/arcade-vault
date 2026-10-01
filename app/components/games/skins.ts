// Skins del canvas: comunes a todos los juegos (spec 10).
export type SkinId = "classic" | "neon" | "retro";

export const SKINS: { id: SkinId; label: string }[] = [
  { id: "classic", label: "CLÁSICO" },
  { id: "neon", label: "NEON" },
  { id: "retro", label: "RETRO" },
];

export const DEFAULT_SKIN: SkinId = "classic";

export const isSkinId = (v: unknown): v is SkinId =>
  v === "classic" || v === "neon" || v === "retro";
