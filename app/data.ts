// Game data and constants for Arcade Vault

export interface Game {
  id: string;
  title: string;
  short: string;
  long: string;
  cat: string;
  cover: string;
  best: number;
  plays: number;
  color?: string;
}

export const CATS = ["TODOS", "ACCIÓN", "PUZZLE", "DEPORTES", "RETRO"];
