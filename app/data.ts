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

export const GAMES: Game[] = [
  {
    id: "galaga",
    title: "GALAGA VAULT",
    short: "Disparos contra invasores",
    long: "Entra en el clásico arcade de defensa. Dispara contra formaciones de naves enemigas que se ciernen sobre ti. ¿Cuántas olas puedes resistir?",
    cat: "ACCIÓN",
    cover: "cover-invaders",
    best: 245600,
    plays: 3241,
  },
  {
    id: "tetris",
    title: "TETRIS VAULT",
    short: "Piezas que caen, mente que piensa",
    long: "El rompecabezas eterno. Encaja las piezas de colores mientras caen. Cada línea completada te acerca al siguiente nivel. ¿Cuál es tu límite?",
    cat: "PUZZLE",
    cover: "cover-tetro",
    best: 1823400,
    plays: 5129,
    color: "yellow",
  },
  {
    id: "snake",
    title: "SNAKE VAULT",
    short: "Crece comiendo, evita tu cola",
    long: "Controla la serpiente hambrienta. Come manzanas para crecer más, pero cuidado: no colisiones con tu propio cuerpo. El espacio se reduce a medida que creces.",
    cat: "PUZZLE",
    cover: "cover-snake",
    best: 89320,
    plays: 2156,
  },
  {
    id: "frogger",
    title: "FROGGER VAULT",
    short: "Cruza el camino sin ser atropellado",
    long: "Ayuda a la rana a cruzar carreteras llenas de tráfico y ríos caudalosos. Cada salto cuenta. Llega al lado opuesto sano y salvo.",
    cat: "ACCIÓN",
    cover: "cover-rana",
    best: 156780,
    plays: 1847,
    color: "magenta",
  },
  {
    id: "pacman",
    title: "PACMAN VAULT",
    short: "Come puntos, evita fantasmas",
    long: "El clásico laberinto sin fin. Come todos los puntos mientras evitas a los fantasmas multicolores. Usa los potenciadores para invertir la caza. ¿Podrás limpiar todos los niveles?",
    cat: "ACCIÓN",
    cover: "cover-glot",
    best: 412890,
    plays: 4567,
  },
  {
    id: "asteroids",
    title: "ASTEROIDS VAULT",
    short: "Dispara rocas en el espacio",
    long: "Tu nave flota en el espacio vacío. Asteroides enormes se acercan. Dispara para romperlos en pedazos más pequeños. Sobrevive a la lluvia de rocas.",
    cat: "ACCIÓN",
    cover: "cover-rocas",
    best: 287650,
    plays: 1923,
  },
  {
    id: "duel",
    title: "DUEL VAULT",
    short: "Duelo de pistolas al atardecer",
    long: "Dos guerreros se encuentran bajo el sol ardiente del desierto. Quien sea más rápido al sacar su arma vive otro día. Reflejos, precisión y coraje.",
    cat: "DEPORTES",
    cover: "cover-duelo",
    best: 98765,
    plays: 876,
  },
  {
    id: "breakout",
    title: "BREAKOUT VAULT",
    short: "Rompe ladrillos con la bola",
    long: "Controla una paleta para rebotar una bola contra un muro de ladrillos. Cada ladrillo roto te da puntos. Rompe toda la pared y avanza al siguiente nivel.",
    cat: "PUZZLE",
    cover: "cover-bricks",
    best: 654320,
    plays: 2834,
  },
];

export const CATS = ["TODOS", "ACCIÓN", "PUZZLE", "DEPORTES", "RETRO"];

// Seeded random number generator for reproducible leaderboards
function seededRandom(seed: number): number {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

interface LeaderboardEntry {
  rank: number;
  name: string;
  score: number;
  date: string;
}

export function seededScores(seed: number, count: number): LeaderboardEntry[] {
  const names = [
    "PHOENIX",
    "VORTEX",
    "CIPHER",
    "RAVEN",
    "APEX",
    "NEXUS",
    "BLAZE",
    "SPECTER",
    "VOLT",
    "NOVA",
    "TITAN",
    "ECHO",
  ];

  const scores: LeaderboardEntry[] = [];

  for (let i = 0; i < count; i++) {
    const rand = seededRandom(seed + i * 137);
    const scoreValue = Math.floor(100000 + rand * 500000);
    const dayOffset = Math.floor(rand * 180);
    const date = new Date();
    date.setDate(date.getDate() - dayOffset);
    const dateStr = date.toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
    });

    scores.push({
      rank: i + 1,
      name: names[i % names.length],
      score: scoreValue,
      date: dateStr,
    });
  }

  return scores.sort((a, b) => b.score - a.score);
}
