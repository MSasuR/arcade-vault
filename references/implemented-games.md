# Juegos de Arcade Vault

Catálogo de juegos registrados en la tabla `public.games` de Supabase (consultado el 2026-09-30), ordenados por `sort_order`.

La columna **Jugable** indica si el juego tiene módulo en `app/components/games/registry.ts` (`PLAYABLE`). Los que no lo tienen muestran el placeholder "JUEGO AQUÍ" en `/player/[id]`.

## Resumen

| #   | id          | Título          | Categoría | Portada          | Jugable | Spec |
| --- | ----------- | --------------- | --------- | ---------------- | ------- | ---- |
| 1   | `galaga`    | GALAGA VAULT    | ACCIÓN    | `cover-invaders` | No      | —    |
| 2   | `tetris`    | TETRIS VAULT    | PUZZLE    | `cover-tetro`    | Sí      | 07   |
| 3   | `snake`     | SNAKE VAULT     | PUZZLE    | `cover-snake`    | Sí      | 09   |
| 4   | `frogger`   | FROGGER VAULT   | ACCIÓN    | `cover-rana`     | No      | —    |
| 5   | `pacman`    | PACMAN VAULT    | ACCIÓN    | `cover-glot`     | No      | —    |
| 6   | `asteroids` | ASTEROIDS VAULT | ACCIÓN    | `cover-rocas`    | Sí      | 05   |
| 7   | `duel`      | DUEL VAULT      | DEPORTES  | `cover-duelo`    | No      | —    |
| 8   | `breakout`  | BREAKOUT VAULT  | PUZZLE    | `cover-bricks`   | Sí      | 08   |

Total: 8 juegos en el catálogo, 4 jugables.

## Detalle

### 1. GALAGA VAULT (`galaga`)

- **Categoría:** ACCIÓN
- **Descripción corta:** Disparos contra invasores
- **Descripción:** Entra en el clásico arcade de defensa. Dispara contra formaciones de naves enemigas que se ciernen sobre ti. ¿Cuántas olas puedes resistir?
- **Portada:** `cover-invaders`
- **Récord / partidas (estáticos):** 245600 / 3241
- **Jugable:** No

### 2. TETRIS VAULT (`tetris`)

- **Categoría:** PUZZLE
- **Descripción corta:** Piezas que caen, mente que piensa
- **Descripción:** El rompecabezas eterno. Encaja las piezas de colores mientras caen. Cada línea completada te acerca al siguiente nivel. ¿Cuál es tu límite?
- **Portada:** `cover-tetro` (color `yellow`)
- **Récord / partidas (estáticos):** 1823400 / 5129
- **Jugable:** Sí (spec 07) — HUD: Puntuación / Líneas / Nivel

### 3. SNAKE VAULT (`snake`)

- **Categoría:** PUZZLE
- **Descripción corta:** Crece comiendo, evita tu cola
- **Descripción:** Controla la serpiente hambrienta. Come manzanas para crecer más, pero cuidado: no colisiones con tu propio cuerpo. El espacio se reduce a medida que creces.
- **Portada:** `cover-snake`
- **Récord / partidas (estáticos):** 89320 / 2156
- **Jugable:** Sí (spec 09) — HUD: Puntuación / Nivel

### 4. FROGGER VAULT (`frogger`)

- **Categoría:** ACCIÓN
- **Descripción corta:** Cruza el camino sin ser atropellado
- **Descripción:** Ayuda a la rana a cruzar carreteras llenas de tráfico y ríos caudalosos. Cada salto cuenta. Llega al lado opuesto sano y salvo.
- **Portada:** `cover-rana` (color `magenta`)
- **Récord / partidas (estáticos):** 156780 / 1847
- **Jugable:** No

### 5. PACMAN VAULT (`pacman`)

- **Categoría:** ACCIÓN
- **Descripción corta:** Come puntos, evita fantasmas
- **Descripción:** El clásico laberinto sin fin. Come todos los puntos mientras evitas a los fantasmas multicolores. Usa los potenciadores para invertir la caza. ¿Podrás limpiar todos los niveles?
- **Portada:** `cover-glot`
- **Récord / partidas (estáticos):** 412890 / 4567
- **Jugable:** No

### 6. ASTEROIDS VAULT (`asteroids`)

- **Categoría:** ACCIÓN
- **Descripción corta:** Dispara rocas en el espacio
- **Descripción:** Tu nave flota en el espacio vacío. Asteroides enormes se acercan. Dispara para romperlos en pedazos más pequeños. Sobrevive a la lluvia de rocas.
- **Portada:** `cover-rocas`
- **Récord / partidas (estáticos):** 287650 / 1923
- **Jugable:** Sí (spec 05) — HUD: Puntuación / Vidas / Nivel

### 7. DUEL VAULT (`duel`)

- **Categoría:** DEPORTES
- **Descripción corta:** Duelo de pistolas al atardecer
- **Descripción:** Dos guerreros se encuentran bajo el sol ardiente del desierto. Quien sea más rápido al sacar su arma vive otro día. Reflejos, precisión y coraje.
- **Portada:** `cover-duelo`
- **Récord / partidas (estáticos):** 98765 / 876
- **Jugable:** No

### 8. BREAKOUT VAULT (`breakout`)

- **Categoría:** PUZZLE
- **Descripción corta:** Rompe ladrillos con la bola
- **Descripción:** Controla una paleta para rebotar una bola contra un muro de ladrillos. Cada ladrillo roto te da puntos. Rompe toda la pared y avanza al siguiente nivel.
- **Portada:** `cover-bricks`
- **Récord / partidas (estáticos):** 654320 / 2834
- **Jugable:** Sí (spec 08) — HUD: Puntuación / Vidas / Nivel
