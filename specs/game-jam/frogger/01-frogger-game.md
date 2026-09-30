# Juego Frogger en la Plataforma

**State:** Draft  
**Depends on:** SPEC 04 (Supabase Auth, hook `useUser()`), SPEC 05 (módulo Asteroids, registro `PLAYABLE` y `GamePlayer`), SPEC 06 (tablas `games`/`scores` y ranking), SPEC 07 (contrato común `app/components/games/types.ts` y HUD dinámico de `GamePlayer`), SPEC 09 (patrón de estado `ready` y controles con flechas y `W` `A` `S` `D`)  
**Date:** 2026-09-30  
**Objective:** Crear el juego Frogger como módulo TypeScript vectorial montable en canvas y conectarlo a `GamePlayer` (HUD, pausa, fin de partida, puntuación y leaderboard) en la ruta `/player/frogger`.

---

## Scope

**Está incluido:**

- Módulo del juego en `app/components/games/frogger/` escrito en TypeScript, sin variables globales de módulo ni acceso a `document`/`window` fuera de `createFrogger`
- API pública `createFrogger(canvas, callbacks): GameInstance` con `pause()`, `resume()`, `getScore()` y `destroy()`
- **Juego nuevo**: no hay material de Frogger en `references/started-games/`; las reglas son las del Frogger arcade clásico adaptadas y definidas con cifras en esta spec (ver Data Model)
- Rejilla de 20×15 celdas de 40 px en un canvas lógico 800×600 (4:3), escalado por CSS; se mantiene el `.crt-screen` actual sin cambios de CSS
- Tablero: barra de tiempo, orilla de llegada con 5 casillas, 5 carriles de río (troncos y tortugas), mediana segura, 5 carriles de carretera (coches y camiones) y acera de salida
- Dibujo vectorial con la paleta neón de la plataforma; sin sprites, imágenes ni sonidos
- Salto de una celda por pulsación con `←` `↑` `→` `↓` y `W` `A` `S` `D`; la rana espera la primera tecla para empezar
- Puntuación: 10 puntos por fila nueva alcanzada, 50 por rana a salvo, bonus de tiempo, 200 por mosca y 1000 por completar las 5 casillas
- 3 vidas, una vida extra al llegar a 10 000 puntos y niveles infinitos con velocidad creciente (tope ×2)
- HUD de React: Puntuación / Vidas / Nivel vía `onScore`, `onLives` y `onLevel` (sin Líneas)
- Barra de tiempo (30 s por rana) dibujada en el canvas
- Overlays `PAUSA`, `GAME OVER` (con la puntuación final y `ENTER PARA REINICIAR`), el aviso `PULSA UNA FLECHA PARA EMPEZAR` y el rótulo `NIVEL N` dibujados en el canvas
- Reinicio con `Enter` tras `GAME OVER`
- Botón PAUSAR/REANUDAR funcional, teclas `P` y `Escape`, y pausa automática al ocultar la pestaña
- Registro de `frogger` en `PLAYABLE` (`app/components/games/registry.ts`)
- Reutiliza la fila existente `frogger` de `public.games` (`FROGGER VAULT`, `ACCIÓN`, `sort_order` 4): **no hay migración de alta**; la revisión de la fila y la portada `.cover-frogger` van en la spec `02-frogger-catalog`
- Guardado de puntuación en `public.scores` al `GAME OVER` y en TERMINAR (solo con sesión y `score > 0`), con el flujo ya implementado en `GamePlayer`
- `preventDefault` en las flechas y en `Enter` durante `gameover` para evitar el scroll y la activación accidental de botones
- Limpieza completa de listeners y `requestAnimationFrame` en `destroy()` (compatible con React Strict Mode)
- Documentar controles y reglas en `README.md` y añadir `frogger` a la tabla de juegos de `CLAUDE.md`

**NO está incluido:**

- Fila en `public.games` y portada (spec `02-frogger-catalog`)
- Sonido y música
- Controles táctiles, ratón o gamepad
- Cocodrilos, nutrias, serpientes, rana hembra y demás enemigos del arcade original
- Animación de salto intermedia (el salto es instantáneo)
- Récord local (`localStorage`) y cualquier persistencia fuera de `scores`
- Validación anti-trampas (el insert en `scores` es directo con RLS)
- Calcular `best` y `plays` de `games` desde `scores`
- Pruebas automatizadas (el repo no tiene framework de tests)

---

## Data Model

No hay cambios de esquema en esta spec. Se reutilizan `games`, `scores` y `leaderboard` de SPEC 06; `scores.game_id` apunta a la fila `frogger` que ya existe, así que el guardado no falla por la FK aunque la spec `02-frogger-catalog` aún no se haya aplicado.

Contrato (definido en `app/components/games/types.ts` por SPEC 07; ver `.claude/skills/add-game/reference.md`):

```typescript
export function createFrogger(canvas: HTMLCanvasElement, callbacks: GameCallbacks): GameInstance;
```

Callbacks que emite Frogger: `onScore`, `onLives`, `onLevel`, `onGameOver` y `onPause`. No emite `onLines`. Emite los valores iniciales (`0`, `3`, `1`) de forma síncrona al crearse y al reiniciar con `Enter`.

Registro:

```typescript
// app/components/games/registry.ts
export const PLAYABLE: Record<string, GameFactory> = {
  asteroids: createAsteroids,
  tetris: createTetris,
  breakout: createBreakout,
  snake: createSnake,
  frogger: createFrogger,
};
```

Archivos del módulo: `constants.ts` (rejilla, carriles, tiempos, puntos y paleta), `logic.ts` (reglas puras), `render.ts` (dibujo) e `index.ts` (estado, input y loop). No hay `sprites.ts` ni `audio.ts`.

Estado y tipos del juego:

```typescript
type Dir = "up" | "down" | "left" | "right";
type State = "ready" | "playing" | "dying" | "paused" | "gameover";
interface Frog {
  x: number; // px, borde izquierdo de la celda de 40 px (0–760)
  row: number; // 1–13
  facing: Dir;
}
interface LaneObject {
  x: number; // px, borde izquierdo
}
interface Lane {
  row: number;
  zone: "road" | "river";
  kind: "car" | "sport" | "truck" | "log" | "turtles";
  width: number; // px
  dir: 1 | -1; // 1 = derecha, -1 = izquierda
  baseSpeed: number; // px/s en el nivel 1
  color: string;
  objects: LaneObject[];
  diving: boolean; // el grupo 0 bucea (solo tortugas)
}
// bays: boolean[5] (casilla ocupada); fly: { bay: number; timeLeft: number } | null
```

### Rejilla y zonas

- `CELL = 40`, `COLS = 20`, `ROWS = 15`; la fila `r` ocupa `y = r × 40` a `y = r × 40 + 40`.

| Fila | Zona              | Uso                                                                            |
| ---- | ----------------- | ------------------------------------------------------------------------------ |
| 0    | Barra de tiempo   | No transitable; barra de 600×16 px en `(20, 12)` y texto `TIEMPO` en `x = 640` |
| 1    | Orilla de llegada | 5 casillas de 80 px en `x = 40, 200, 360, 520, 680`; el resto es seto          |
| 2–6  | Río               | 5 carriles de troncos y tortugas                                               |
| 7    | Mediana           | Segura                                                                         |
| 8–12 | Carretera         | 5 carriles de vehículos                                                        |
| 13   | Acera de salida   | Segura; la rana aparece en `x = 380` (centro en `x = 400`)                     |
| 14   | Franja de ayuda   | No transitable; texto `FLECHAS / WASD MOVER · P PAUSA` centrado                |

### Rana y salto

- Cada `keydown` de dirección (con `e.repeat === false`) hace un salto instantáneo de una celda: `↑` fila − 1, `↓` fila + 1, `←` `x − 40`, `→` `x + 40`; mantener la tecla no repite.
- `↓` en la fila 13 no hace nada; `x` se limita a `[0, 760]`.
- Caja de colisión de la rana: 28×28 px centrada en su celda (`x + 6` a `x + 34`).
- Estado `ready`: el mundo está congelado, el tiempo no corre y se muestra `PULSA UNA FLECHA PARA EMPEZAR`; la primera tecla de dirección pasa a `playing` y ejecuta su salto.
- Tras una muerte o una llegada la rana reaparece en `x = 380`, fila 13, mirando arriba, con 30 s y sin pasar por `ready`.

### Carriles

Todos los objetos de un carril se mueven a la misma velocidad sobre un bucle de `LOOP = 1200` px con `x ∈ [−400, 800)`: si `dir = 1` y `x ≥ 800`, `x −= 1200`; si `dir = −1` y `x < −400`, `x += 1200`. Posición inicial: `x_i = −400 + desfase + i × separación`, con `separación = 1200 / cantidad`. Los objetos de la carretera miden 32 px de alto (`y` de la fila + 4); los del río, 36 px.

| Fila | Zona      | Objeto       | Ancho  | Dirección | Velocidad (nivel 1) | Cantidad | Separación | Desfase | Color     |
| ---- | --------- | ------------ | ------ | --------- | ------------------- | -------- | ---------- | ------- | --------- |
| 12   | Carretera | Coche        | 60 px  | ←         | 60 px/s             | 3        | 400 px     | 0 px    | `#f5ff00` |
| 11   | Carretera | Coche        | 60 px  | →         | 80 px/s             | 3        | 400 px     | 120 px  | `#ff006e` |
| 10   | Carretera | Coche        | 60 px  | ←         | 100 px/s            | 3        | 400 px     | 240 px  | `#00f5ff` |
| 9    | Carretera | Deportivo    | 60 px  | →         | 160 px/s            | 2        | 600 px     | 60 px   | `#ffcf3a` |
| 8    | Carretera | Camión       | 120 px | ←         | 70 px/s             | 2        | 600 px     | 300 px  | `#c7d0e0` |
| 6    | Río       | Tortugas ×3  | 120 px | ←         | 60 px/s             | 4        | 300 px     | 0 px    | `#00f5ff` |
| 5    | Río       | Tronco corto | 120 px | →         | 50 px/s             | 4        | 300 px     | 150 px  | `#d97a3a` |
| 4    | Río       | Tronco largo | 240 px | →         | 90 px/s             | 3        | 400 px     | 0 px    | `#d97a3a` |
| 3    | Río       | Tortugas ×2  | 80 px  | ←         | 80 px/s             | 4        | 300 px     | 100 px  | `#00f5ff` |
| 2    | Río       | Tronco medio | 160 px | →         | 70 px/s             | 3        | 400 px     | 200 px  | `#d97a3a` |

- Velocidad real: `v = baseSpeed × factor`, con `factor = min(2, 1 + 0.15 × (nivel − 1))`: ×1.00 en el nivel 1, ×1.15 en el 2, ×1.90 en el 7 y ×2.00 del 8 en adelante. La velocidad máxima es 320 px/s.
- Tortugas buceadoras: en las filas 6 y 3 el grupo 0 sigue un ciclo de 5 s: `[0, 3)` s a flote (sólido), `[3, 3.5)` s hundiéndose (sólido, dibujado al 50 % de opacidad), `[3.5, 4.5)` s sumergido (no sólido, solo un contorno punteado) y `[4.5, 5)` s emergiendo (sólido, al 50 %). El ciclo corre en `playing` y `dying` y no depende del nivel.

### Reglas

- **Carretera (filas 8–12):** si la caja de 28 px de la rana se solapa en horizontal con un vehículo de su fila, muere atropellada.
- **Río (filas 2–6):** la rana está a salvo si su centro (`x + 20`) está dentro de `[obj.x, obj.x + ancho]` de algún objeto sólido de su fila; si no, muere ahogada. Se comprueba en cada frame (una tortuga que se sumerge la ahoga).
- **Arrastre:** en el río la rana se desplaza `dir × v × dt` con su objeto; si su centro sale de `[0, 800]`, muere.
- **Llegada (fila 1):** al saltar desde la fila 2, si el centro de la rana está dentro de una casilla libre (`[bx, bx + 80]`), la rana queda a salvo en esa casilla; si cae en el seto o en una casilla ocupada, muere.
- **Tiempo:** 30 s por rana; se reinicia al llegar a una casilla y al reaparecer. Si llega a 0, la rana muere.
- **Muerte:** estado `dying` durante 1.0 s (la rana se dibuja como una `X` en `--magenta`, el mundo sigue moviéndose, el tiempo se congela y el input de movimiento se ignora). Las vidas bajan en 1 al empezar `dying` y se emite `onLives`. Al terminar: si quedan vidas, la rana reaparece; si no, `gameover` y `onGameOver(score)` una sola vez.
- **Vidas:** 3 al empezar; una única vida extra al alcanzar 10 000 puntos por primera vez en la partida (se emite `onLives`). Sin tope de vidas.
- **Mosca:** 6 s después de desaparecer la anterior (o del inicio de la partida) aparece una mosca en una casilla libre al azar durante 4 s. Los tiempos solo corren en `playing` y `dying`.
- **Nivel:** al ocupar las 5 casillas se suma el bonus de nivel, `nivel += 1`, se emite `onLevel`, las casillas y la mosca se vacían, se recalcula `factor` (los objetos conservan su posición), la rana reaparece y se dibuja `NIVEL N` en el centro durante 1.5 s sin detener el juego.
- **Fin:** no hay victoria; la partida termina solo con `GAME OVER`.

### Puntuación

| Evento                                                  | Puntos                                     |
| ------------------------------------------------------- | ------------------------------------------ |
| Saltar a una fila más alta que la más alta de esta rana | 10 (12 saltos de la fila 13 a la 1 = 120)  |
| Rana a salvo en una casilla                             | 50                                         |
| Bonus de tiempo al llegar a una casilla                 | `10 × floor(segundosRestantes)` (máx. 290) |
| Llegar a la casilla que tiene la mosca                  | 200 (además de los 50)                     |
| Completar las 5 casillas                                | 1000                                       |

- La fila más alta alcanzada se reinicia a 13 al reaparecer; volver a pisar una fila ya alcanzada no suma.
- `onScore` se emite en cada cambio.

### Paleta

Los hex son fijos porque el canvas no lee variables CSS; salen de `:root` en `app/globals.css`.

| Elemento                                                                 | Color                       | Origen                            |
| ------------------------------------------------------------------------ | --------------------------- | --------------------------------- |
| Fondo, filas 0 y 14                                                      | `#0a0a0f`                   | `--bg`                            |
| Aceras y mediana (filas 7 y 13)                                          | `#0f0f18`                   | `--bg-2`                          |
| Carretera (filas 8–12)                                                   | `#15151f`                   | `--bg-3`                          |
| Marcas entre carriles                                                    | `rgba(255, 255, 255, 0.06)` | `--line-2`                        |
| Bordes de aceras y mediana                                               | `rgba(0, 245, 255, 0.18)`   | `--line`                          |
| Río (filas 2–6)                                                          | `#001f2a`                   | derivado (fondo de `.cover-rana`) |
| Rana, rana a salvo y barra de tiempo > 10 s                              | `#00ff88`                   | `--green`                         |
| Ojos de la rana                                                          | `#0a0a0f`                   | `--bg`                            |
| Troncos                                                                  | `#d97a3a`                   | `--bronze`                        |
| Tortugas y coche de la fila 10                                           | `#00f5ff`                   | `--cyan`                          |
| Coche de la fila 12, mosca y barra 5–10 s                                | `#f5ff00`                   | `--yellow`                        |
| Coche de la fila 11, bordes de las casillas, barra < 5 s y `X` de muerte | `#ff006e`                   | `--magenta`                       |
| Deportivo de la fila 9                                                   | `#ffcf3a`                   | `--gold`                          |
| Camión de la fila 8                                                      | `#c7d0e0`                   | `--silver`                        |
| Texto de overlays                                                        | `#e6e9ff`                   | `--ink`                           |
| Texto de ayuda (fila 14)                                                 | `#8a8fb5`                   | `--ink-dim`                       |

Convenciones:

- Origen del canvas arriba a la izquierda; tamaño lógico 800×600 y la rejilla ocupa todo el canvas.
- Velocidades en px/s; `dt` en segundos y limitado a 0.05 s (a 320 px/s, como máximo 16 px por frame).
- Teclas (`e.code`): `ArrowUp/Down/Left/Right` y `KeyW/KeyA/KeyS/KeyD` saltan, `KeyP` o `Escape` pausan y `Enter` reinicia solo en `gameover`. `preventDefault` en las flechas y en `Enter` durante `gameover`; se ignoran los eventos con `target` `input`, `textarea` o `select`.
- La pausa solo se activa en `playing` y `dying`; en `ready` y `gameover` no hace nada.
- No hay assets: el loop empieza al crearse el juego.

---

## Implementation Plan

1. **Esqueleto del módulo y registro**

   - Crear `app/components/games/frogger/index.ts` con `createFrogger` que solo pinta el fondo `#0a0a0f`, emite `0`, `3` y `1`, y devuelve `pause/resume/getScore/destroy` vacíos
   - Registrar `frogger` en `PLAYABLE`
   - `/player/frogger` monta el canvas; los demás ids sin módulo (p. ej. `/player/galaga`) conservan el placeholder

2. **Constantes y lógica pura**

   - `constants.ts` con la rejilla, la tabla de carriles, las casillas, los tiempos (30 s, 1.0 s, 1.5 s, 6 s, 4 s, ciclo de 5 s), los puntos y la paleta
   - `logic.ts` con funciones puras: creación de carriles, avance con bucle de 1200 px, `speedFactor(nivel)`, fase de las tortugas buceadoras, salto con límites, atropello, soporte en el río, arrastre, casilla de llegada y cálculo de puntos
   - Sin acceso al DOM; se comprueba con un script de Node sobre la lógica compilada con `tsc` a un directorio temporal (posiciones iniciales, bucle, factor por nivel y bonus de tiempo)

3. **Render**

   - `render.ts`: zonas, marcas de carril, vehículos con faros, troncos con vetas, tortugas (con opacidad según la fase), casillas, ranas a salvo, mosca, rana orientada según `facing`, `X` de muerte, barra de tiempo con sus tres colores, franja de ayuda y overlays `PAUSA`, `GAME OVER`, `PULSA UNA FLECHA PARA EMPEZAR` y `NIVEL N`, recibiendo `ctx` por parámetro
   - Sin uso todavía; `npm run build` compila

4. **Loop, input y reglas**

   - `index.ts`: estado en el closure, loop con `requestAnimationFrame` y `dt` con tope, input en `window` con `preventDefault` en flechas y sin auto-repetición, e integración de todas las reglas (muertes, llegada, mosca, vida extra, nivel)
   - Emitir `onScore`, `onLives` y `onLevel` al cambiar y `onGameOver` una sola vez al entrar en `gameover`
   - `Enter` en `gameover` reinicia a `ready` y reemite score 0, vidas 3 y nivel 1
   - `destroy()` idempotente: cancela el frame y quita los listeners de `window` y `document`

5. **Pausa**

   - `pause()`/`resume()` sin salto de `dt` (se reinicia `lastTime` y se descartan pulsaciones), overlay `PAUSA`, teclas `P` y `Escape` y `visibilitychange` con la pestaña oculta; emitir `onPause`
   - La pausa no se activa en `ready` ni en `gameover`; si se pausa en `dying`, los 1.0 s continúan al reanudar

6. **Integración en `GamePlayer`**

   - Comprobar que el canvas 800×600 de `/player/frogger` se encuadra en `.crt-screen` sin cambios de CSS y que el HUD muestra Puntuación / Vidas / Nivel reales (sin Líneas)
   - PAUSAR alterna `pause()`/`resume()` y su etiqueta cambia a REANUDAR
   - Comprobar en `npm run dev` (Strict Mode) que no quedan dos loops ni listeners duplicados

7. **Catálogo**

   - Confirmar con `select` a `public.games` (herramienta MCP `execute_sql`) que la fila `frogger` existe; no se crea migración de alta
   - La portada `.cover-frogger` y su migración de `update` son de la spec `02-frogger-catalog`; hasta aplicarla, el juego se muestra con `cover-rana`

8. **Guardado y ranking**

   - Verificar el guardado con sesión: partida hasta `GAME OVER` con score > 0 y fila en `scores` con `game_id = 'frogger'` (consulta con `execute_sql`)
   - Verificar que TERMINAR no duplica, que invitados no guardan y que la marca aparece en `/salon` (pestaña `FROGGER VAULT`) y `/games/frogger`
   - Borrar los datos de prueba al terminar

9. **Documentación**
   - `README.md`: tabla de controles y reglas de Frogger, y nota de que `frogger` está en `PLAYABLE` y en `games`
   - `CLAUDE.md`: fila `frogger` en la tabla de juegos (spec, Puntuación / Vidas / Nivel, "Vectorial, sin assets") y quitar `frogger` de la lista de filas sin módulo

---

## Acceptance Criteria

- [ ] `npm run build` termina sin errores y `npx eslint app lib` no reporta errores (el `npm run lint` global falla por scripts sueltos de la raíz que ya existían)
- [ ] `/player/frogger` muestra el canvas 800×600 con la barra de tiempo llena, las 5 casillas vacías, el río, la carretera, la rana en la acera (centro en `x = 400`, fila 13) y `PULSA UNA FLECHA PARA EMPEZAR`, sin errores en consola
- [ ] En estado `ready` los vehículos, troncos y tortugas no se mueven y la barra de tiempo no baja
- [ ] Los demás ids aún sin módulo (p. ej. `/player/galaga`) siguen mostrando el placeholder "JUEGO AQUÍ" con HUD Puntuación 0 / Vidas 3 / Nivel 1
- [ ] El HUD de `/player/frogger` muestra Puntuación 0, Vidas 3 y Nivel 1 al entrar, y no muestra Líneas
- [ ] `←` `↑` `→` `↓` y `W` `A` `S` `D` mueven la rana exactamente una celda (40 px) por pulsación; mantener la tecla no repite el salto y la página no hace scroll con las flechas
- [ ] `↓` en la acera de salida no mueve la rana y la rana nunca sale de `x ∈ [0, 760]` por un salto
- [ ] Cada salto a una fila más alta que la máxima alcanzada por esa rana suma exactamente 10 puntos; volver a una fila ya alcanzada no suma
- [ ] Los 10 carriles tienen el objeto, ancho, dirección, cantidad y color de la tabla de carriles, y en el nivel 1 se mueven a 60, 80, 100, 160, 70, 60, 50, 90, 80 y 70 px/s (filas 12 a 2)
- [ ] Los objetos que salen por un borde reaparecen por el opuesto sin saltos visibles ni cambios de separación
- [ ] Tocar un vehículo en la carretera resta 1 vida, muestra la `X` magenta durante 1.0 s y la rana reaparece en la acera con 30 s
- [ ] Caer al agua fuera de un tronco o tortuga, o salir por un borde arrastrada, resta 1 vida
- [ ] Sobre un tronco o tortuga, la rana se desplaza con él a la velocidad de su carril
- [ ] El grupo 0 de las filas 6 y 3 se sumerge 1 s cada ciclo de 5 s con 0.5 s de aviso al 50 % de opacidad, y una rana encima mientras está sumergido se ahoga
- [ ] Llegar a una casilla libre suma exactamente `50 + 10 × floor(segundosRestantes)` puntos, deja una rana dibujada en esa casilla y reinicia el tiempo a 30 s
- [ ] Saltar al seto o a una casilla ocupada resta 1 vida
- [ ] Con la mosca visible, llegar a su casilla suma 200 puntos adicionales; la mosca aparece solo en casillas libres, 6 s después de la anterior, y dura 4 s
- [ ] Agotar los 30 s resta 1 vida; la barra pasa de verde a amarillo por debajo de 10 s y a magenta por debajo de 5 s
- [ ] Completar las 5 casillas suma 1000 puntos, el HUD muestra el nivel siguiente, las casillas se vacían, aparece `NIVEL N` 1.5 s y la velocidad pasa a ×1.15 en el nivel 2 (tope ×2.00 desde el nivel 8)
- [ ] Al llegar a 10 000 puntos las vidas del HUD suben en 1, una sola vez por partida
- [ ] Al perder la última vida aparece `GAME OVER` con la puntuación final y `ENTER PARA REINICIAR` tras la `X` de 1.0 s
- [ ] `onGameOver` se emite una sola vez por partida
- [ ] `Enter` tras `GAME OVER` reinicia a `ready` con la rana en la acera, casillas vacías y el HUD en Puntuación 0 / Vidas 3 / Nivel 1; `Enter` durante la partida no hace nada
- [ ] PAUSAR congela el juego, muestra `PAUSA` en el canvas, el botón pasa a REANUDAR y REANUDAR continúa sin salto de posición ni de tiempo
- [ ] Las teclas `P` y `Escape` alternan la pausa y cambiar de pestaña pausa el juego; en `ready` y en `GAME OVER` la pausa no se activa
- [ ] `public.games` contiene la fila `frogger` y no se creó ninguna migración de alta para el juego
- [ ] Con sesión iniciada, llegar a `GAME OVER` con score > 0 inserta una fila en `scores` con `game_id = 'frogger'`, el `user_id` del usuario y el score real
- [ ] Llegar a `GAME OVER` y pulsar TERMINAR no crea una segunda fila
- [ ] TERMINAR a mitad de partida con sesión y score > 0 guarda el score actual y navega a `/games/frogger`
- [ ] Como invitado, terminar una partida no inserta nada en `scores`
- [ ] `/salon` (pestaña `FROGGER VAULT`) y `/games/frogger` muestran el ranking real con la marca del usuario
- [ ] Salir de `/player/frogger` (TERMINAR, VOLVER A DETALLES o navegación del navegador) detiene el loop; no quedan listeners `keydown` ni `visibilitychange` del juego ni frames pendientes
- [ ] En `npm run dev` (Strict Mode) solo hay una instancia del juego activa
- [ ] A 375 px de ancho el canvas se ve completo (el desbordamiento horizontal del layout global no es de esta spec)
- [ ] `references/` queda sin modificar

---

## Decisions Taken and Discarded

| Decisión                                                                              | Razón                                                                                                                                 |
| ------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| **Reutilizar la fila `frogger` de `games`**                                           | Ya existe (`FROGGER VAULT`, `ACCIÓN`, `sort_order` 4) y sus textos describen este juego; evita una migración de alta                  |
| **Descartado: crear una fila nueva (`rana` o `ranaria`)**                             | Dejaría dos juegos equivalentes en el catálogo, uno como placeholder; `ranaria` solo existe en `references/templates/`                |
| **Juego nuevo con reglas del Frogger arcade**                                         | No hay material en `references/started-games/`; las reglas se fijan aquí con cifras, como en SPEC 09                                  |
| **Categoría `ACCIÓN` (la de la fila)**                                                | Hoy solo Asteroids es un `ACCIÓN` jugable frente a tres `PUZZLE`; Frogger equilibra el catálogo jugable                               |
| **Módulo TS con `createFrogger` y contrato común**                                    | Mismo patrón que Asteroids, Tetris, Breakout y Snake; el contrato de SPEC 07 cubre vidas y nivel sin cambios                          |
| **Rejilla 20×15 de celdas de 40 px**                                                  | Encaja exacto en 800×600 y da las 13 filas del original más una fila de tiempo y otra de ayuda, sin tocar `.crt-screen`               |
| **Descartado: rejilla 16×12 de 50 px**                                                | Solo caben 12 filas: habría que quitar la mediana o un carril y no queda sitio para la barra de tiempo                                |
| **Salto instantáneo de una celda por pulsación, sin auto-repetición**                 | Es el control del original y hace precisos los saltos entre troncos; ignorar `e.repeat` evita avanzar sin querer al mantener la tecla |
| **Descartado: movimiento continuo mientras se mantiene la tecla**                     | Convierte el juego en otro y hace injustas las colisiones con la carretera                                                            |
| **Puntuación clásica (10 por fila, 50 por casilla, bonus de tiempo, 1000 por nivel)** | Premia avanzar rápido y completar niveles, y da marcas muy distintas entre jugadores para el ranking                                  |
| **Descartado: puntos por tiempo sobrevivido**                                         | Premiaría quedarse quieto en la acera                                                                                                 |
| **Niveles infinitos con `factor = min(2, 1 + 0.15 × (nivel − 1))`**                   | La partida solo termina por vidas y la puntuación sigue creciendo; el tope ×2 (320 px/s) mantiene el juego jugable                    |
| **Descartado: victoria tras el nivel 5**                                              | Cortaría el ranking en un techo común; sin fin, las marcas altas se diferencian                                                       |
| **3 vidas y una vida extra a los 10 000 puntos**                                      | Es la regla del original y da margen a las partidas largas sin volverlas eternas                                                      |
| **Tortugas buceadoras solo en el grupo 0 de las filas 6 y 3**                         | Añade la amenaza clásica del río con 0.5 s de aviso; con un grupo por carril siempre hay otra tortuga a flote                         |
| **Descartado: cocodrilos, nutrias, serpiente y rana hembra**                          | Multiplican las reglas y no caben en una spec; cada uno puede ir en otra                                                              |
| **Mosca de bonus (200 puntos)**                                                       | Es una sola regla con tiempos fijos y da un objetivo de riesgo opcional                                                               |
| **Colisión por caja de 28 px en carretera y por centro en el río**                    | La caja algo menor que la celda perdona roces; exigir el centro sobre el tronco es claro y predecible                                 |
| **Estado `ready` con el mundo congelado**                                             | Mismo criterio que Snake: el jugador no pierde tiempo ni vidas antes de reaccionar                                                    |
| **Muerte con 1.0 s de `X` antes de reaparecer**                                       | Hace visible la causa de la muerte; las vidas bajan al empezar para que el HUD responda de inmediato                                  |
| **Barra de tiempo dibujada en el canvas**                                             | El contrato no tiene métrica de tiempo y el HUD de React solo muestra Puntuación / Vidas / Nivel / Líneas                             |
| **Descartado: añadir `onTime` al contrato común**                                     | Cambiaría `types.ts` y `GamePlayer` para un solo juego; la barra en el canvas es suficiente                                           |
| **Dibujo vectorial neón, sin assets**                                                 | No hay sprites de Frogger en `references/`; el vectorial casa con Asteroids y evita licencias de terceros                             |
| **Descartado: sprites de un Frogger de terceros**                                     | Riesgo de licencia y carga de imagen innecesaria para formas simples                                                                  |
| **Sin sonido**                                                                        | No hay audio en el repo para este juego; añadirlo (con `M` para silenciar, como Breakout) es otra spec                                |
| **Flechas y WASD; `P`/`Escape` pausa; `Enter` reinicia**                              | Coherente con Snake y Breakout; ninguna tecla de juego choca con la pausa ni el reinicio                                              |
| **`dt` con tope 0.05 s y teclas con `e.code`**                                        | Convenciones de la plataforma; el tope evita que los objetos salten al volver de una pestaña oculta                                   |
| **Solo guardar con sesión y `score > 0`**                                             | Coincide con SPEC 05 y 06; los invitados no guardan                                                                                   |
| **Sin anti-trampas**                                                                  | Insert directo con RLS, decisión de SPEC 06                                                                                           |

---

## Identified Risks

- **Doble montaje en React Strict Mode**: dos loops o listeners duplicados. Mitigación: `destroy()` idempotente que cancela el frame y quita los listeners de `window` y `document`; criterio de aceptación explícito.
- **Callbacks obsoletos**: el juego se crea una vez y no puede leer estado nuevo de React. Mitigación: los callbacks solo escriben estado y `user` se lee desde un `ref` en `GamePlayer`.
- **Teclas capturadas globalmente**: `preventDefault` en flechas y `Enter` afectaría a formularios. Mitigación: los listeners existen solo con `GamePlayer` montado y se ignoran eventos con `target` `input`, `textarea` o `select`.
- **Foco en botones y `Enter`**: pulsar PAUSAR y luego `Enter` activaría el botón además de reiniciar. Mitigación: `preventDefault` en `Enter` durante `gameover` y `blur()` del botón tras el clic (ya existe en `GamePlayer`).
- **Auto-repetición del teclado**: mantener una flecha haría saltar varias filas. Mitigación: se ignoran los `keydown` con `e.repeat`; criterio de aceptación explícito.
- **Tortugas que se sumergen sin aviso aparente**: el jugador puede sentir la muerte como injusta. Mitigación: 0.5 s al 50 % de opacidad antes y después de sumergirse y contorno punteado mientras están bajo el agua.
- **Deriva de posiciones en el bucle de carriles**: sumar y restar `LOOP` con flotantes puede alterar la separación. Mitigación: todos los objetos de un carril se mueven con el mismo `v × dt` y el bucle suma o resta exactamente 1200 px; criterio de separación constante.
- **Rana arrastrada fuera del canvas**: un salto lateral tras el arrastre podría dejarla en `x` negativa. Mitigación: los saltos se limitan a `[0, 760]` y el arrastre fuera de `[0, 800]` (centro) es muerte.
- **Pausa durante `dying`**: el temporizador de 1.0 s podría saltar al reanudar. Mitigación: el temporizador avanza con `dt` del loop, que no corre en pausa, y `resume()` reinicia `lastTime`.
- **Portada aún sin actualizar**: hasta aplicar `02-frogger-catalog` el juego se ve con `cover-rana`. Mitigación: es funcional; las dos specs son independientes y la fila ya existe (no hay problema de FK).
- **Ejecución en servidor**: acceder a `window`/`document` durante SSR rompe el build. Mitigación: el módulo solo los usa dentro de `createFrogger`, invocado desde `useEffect`.
- **Convención de Next 16**: `GamePlayer` es un Client Component dentro de una ruta con params asíncronos. Mitigación: leer `node_modules/next/dist/docs/` antes de tocar rutas si hiciera falta.
- **Lint global roto por archivos ajenos**: los scripts `test-*.js` de la raíz fallan en `npm run lint`. Mitigación: los criterios usan `npx eslint app lib`.

---

## What is **not** in this spec

- Fila en `games` y portada `.cover-frogger` (spec `02-frogger-catalog`).
- Sonido, música, controles táctiles, ratón y gamepad.
- Cocodrilos, nutrias, serpiente, rana hembra y animación de salto.
- Métrica de tiempo en el HUD de React (`onTime`).
- Récord local, validación anti-trampas y cálculo de `best`/`plays` desde `scores`.
- Pruebas automatizadas.

Cada uno de estos, si se aborda, va en su propia spec.
