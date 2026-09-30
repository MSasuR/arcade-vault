# Juego Tetris en la Plataforma

**State:** Approved  
**Depends on:** SPEC 04 (Supabase Auth, hook `useUser()`), SPEC 05 (módulo Asteroids, registro `PLAYABLE` y `GamePlayer`), SPEC 06 (tablas `games`/`scores` y ranking)  
**Date:** 2026-09-30  
**Objective:** Portar el Tetris de `references/started-games/03-tetris` a un módulo TypeScript montable en canvas y conectarlo a `GamePlayer` (HUD, pausa, fin de partida, puntuación y leaderboard) en la ruta `/player/tetris`.

---

## Scope

**Está incluido:**

- Módulo del juego en `app/components/games/tetris/` escrito en TypeScript, sin variables globales de módulo ni acceso a `document`/`window` fuera de `createTetris`
- API pública `createTetris(canvas, callbacks): GameInstance` con `pause()`, `resume()`, `getScore()` y `destroy()`
- Lógica fiel al original: tablero 10×20, **8 piezas** (I, O, T, S, Z, J, L y la pieza N "tuerca" de 3×3), rotación horaria con _wall kicks_, pieza fantasma, pieza siguiente, soft drop, hard drop, niveles cada 10 líneas y aceleración de caída
- Canvas lógico 800×600 (4:3) con el tablero de 300×600 centrado y un panel `SIGUIENTE` dentro del mismo canvas; se mantiene el `.crt-screen` 4:3 actual sin cambios de CSS
- Paleta neón de la plataforma en lugar de la paleta pastel del original (ver Data Model)
- Overlays `PAUSA` y `GAME OVER` (con la puntuación final y `ENTER PARA REINICIAR`) dibujados en el canvas
- Reinicio con `Enter` tras `GAME OVER`
- **Paso 0 (contrato común):** `app/components/games/types.ts` con `GameCallbacks`, `GameInstance` y `GameFactory`, y refactor de Asteroids y `registry.ts` para usarlos
- HUD de React dinámico: `GamePlayer` muestra solo las métricas que el juego emite. Tetris muestra Puntuación / Líneas / Nivel; Asteroids sigue mostrando Puntuación / Vidas / Nivel
- Registro de `tetris` en `PLAYABLE` (`app/components/games/registry.ts`)
- Botón PAUSAR/REANUDAR funcional, tecla `P` y pausa automática al ocultar la pestaña
- Guardado de puntuación en `public.scores` al `GAME OVER` y en TERMINAR (solo con sesión y `score > 0`), con el flujo ya implementado en `GamePlayer`
- Reutiliza la fila existente `tetris` de `public.games` (`PUZZLE`, `cover-tetro`, `sort_order` 2); **no hay migración de alta ni portada nueva**
- Control por teclado con `preventDefault` en las teclas del juego para evitar el scroll de la página
- Limpieza completa de listeners y `requestAnimationFrame` en `destroy()` (compatible con React Strict Mode)
- Documentar los controles de Tetris en `README.md`

**NO está incluido:**

- Toggle de tema claro/oscuro del original y su `localStorage` (`tetris-theme`)
- Botón HTML de reiniciar del original (se sustituye por `Enter`)
- Sonido y música (el original no tiene)
- Controles táctiles o gamepad
- Pieza de reserva (_hold_) y aleatorizador de bolsa (7-bag): se mantiene el aleatorio uniforme del original
- Filtro de auto-repetición de teclas (se conserva el comportamiento del original)
- Validación anti-trampas (el insert en `scores` es directo con RLS)
- Calcular `best` y `plays` de `games` desde `scores`
- Cambios en la fila `tetris` de `games` (textos y portada actuales)
- Modificar el código dentro de `references/`
- Pruebas automatizadas (el repo no tiene framework de tests)

---

## Data Model

No hay cambios de esquema. Se reutilizan `games`, `scores` y `leaderboard` de SPEC 06; `scores.game_id` apunta a la fila `tetris` que ya existe.

Contrato común (paso 0), en `app/components/games/types.ts`; ver `.claude/skills/add-game/reference.md`:

```typescript
export interface GameCallbacks {
  onScore: (score: number) => void;
  onGameOver: (finalScore: number) => void;
  onPause?: (paused: boolean) => void;
  onLives?: (lives: number) => void;
  onLevel?: (level: number) => void;
  onLines?: (lines: number) => void;
}

export interface GameInstance {
  pause: () => void;
  resume: () => void;
  getScore: () => number;
  destroy: () => void;
}

export type GameFactory = (canvas: HTMLCanvasElement, callbacks: GameCallbacks) => GameInstance;
```

Módulo de Tetris:

```typescript
// app/components/games/tetris/index.ts
export function createTetris(canvas: HTMLCanvasElement, callbacks: GameCallbacks): GameInstance;
```

Callbacks que emite Tetris: `onScore`, `onLines`, `onLevel`, `onGameOver` y `onPause`. No emite `onLives`. Emite los valores iniciales al crearse y al reiniciar (`0`, `0`, `1`).

Registro:

```typescript
// app/components/games/registry.ts
export const PLAYABLE: Record<string, GameFactory> = {
  asteroids: createAsteroids,
  tetris: createTetris,
};
```

Estado en `GamePlayer`: `lives`, `level` y `lines` pasan a `number | null` (`null` hasta que el juego los emite) y el HUD solo muestra las columnas no nulas. Los juegos sin módulo (placeholder) conservan el HUD actual: Puntuación 0 / Vidas 3 / Nivel 1.

Constantes portadas sin cambios: `COLS = 10`, `ROWS = 20`, `BLOCK = 30`, `LINE_SCORES = [0, 100, 300, 500, 800]`, velocidad `dropInterval = max(100 ms, 1000 ms − (level − 1) × 90 ms)`, `level = floor(lines / 10) + 1`, hard drop `+2` por celda, soft drop `+1` por fila, _wall kicks_ `[0, -1, 1, -2, 2]` y las 8 matrices de `PIECES` (la tuerca N es `[[8,8,8],[8,0,8],[8,8,8]]`).

Paleta neón (los hex son fijos porque el canvas no lee variables CSS; los tres primeros coinciden con `--cyan`, `--yellow` y `--green` de `app/globals.css`):

| Pieza | Color     | Origen                                 |
| ----- | --------- | -------------------------------------- |
| I     | `#00f5ff` | `--cyan`                               |
| O     | `#f5ff00` | `--yellow`                             |
| T     | `#b14dff` | derivado neón (no hay variable morada) |
| S     | `#00ff88` | `--green`                              |
| Z     | `#ff006e` | `--magenta`                            |
| J     | `#4d7cff` | derivado neón (no hay variable azul)   |
| L     | `#d97a3a` | `--bronze`                             |
| N     | `#c7d0e0` | `--silver`                             |

Convenciones:

- Origen del canvas arriba a la izquierda; tamaño lógico 800×600.
- Tablero en `x = 250`, `y = 0` (300×600); panel `SIGUIENTE` con su etiqueta en `x = 580`, vista previa de 4×4 celdas de 30 px en `y = 80`.
- Líneas de la cuadrícula con el color de `--line-2` (`rgba(255, 255, 255, 0.06)`).
- Tiempo en segundos: `dt` limitado a 0.05 s y `dropInterval` expresado en segundos (`max(0.1, 1 − (level − 1) × 0.09)`).
- Estado de partida: `'playing' | 'paused' | 'gameover'`, encapsulado en el closure de `createTetris`.
- Teclas: `←` `→` mover, `↓` soft drop, `↑` o `X` rotar, `Espacio` hard drop, `P` pausa, `Enter` reinicia solo en `gameover`. Con `preventDefault` en `←` `→` `↓` `↑` `Espacio` y en `Enter` durante `gameover`.

---

## Implementation Plan

0. **Contrato común y HUD dinámico**

   - Crear `app/components/games/types.ts` con `GameCallbacks`, `GameInstance` y `GameFactory`
   - `app/components/games/asteroids/types.ts` pasa a usar (o re-exportar) los tipos comunes, y `registry.ts` importa `GameFactory` de `types.ts`
   - `GamePlayer` guarda `lives`, `level` y `lines` como `number | null` y muestra solo las columnas no nulas; el placeholder mantiene Puntuación / Vidas 3 / Nivel 1
   - Asteroids sigue igual de cara al usuario (emite vidas y nivel al crearse)

1. **Esqueleto del módulo y registro**

   - Crear `app/components/games/tetris/index.ts` con `createTetris` que solo pinta fondo negro y devuelve `pause/resume/getScore/destroy` vacíos
   - Registrar `tetris` en `PLAYABLE`
   - `/player/tetris` monta el canvas en negro; los demás ids (p. ej. `/player/snake`) conservan el placeholder

2. **Constantes, lógica pura y render**

   - `app/components/games/tetris/constants.ts`: constantes portadas y paleta neón
   - `app/components/games/tetris/logic.ts`: `createBoard`, `randomPiece`, `collide`, `rotateCW`, `tryRotate`, `merge`, `clearLines`, `ghostY`, sin acceso al DOM y recibiendo el tablero por parámetro
   - `app/components/games/tetris/render.ts`: `drawBlock`, `drawBoard`, `drawGhost`, `drawNext`, `drawOverlay`, recibiendo `ctx` por parámetro
   - Sin uso todavía; `npm run build` compila

3. **Lógica de juego y loop**

   - `index.ts`: input en `window` con `preventDefault` en las teclas del juego, estado en el closure, `init`, `spawn`, `lockPiece`, `softDrop`, `hardDrop` y loop con `requestAnimationFrame` y `dt` con tope
   - Emitir `onScore`, `onLines` y `onLevel` al cambiar y `onGameOver` una sola vez al entrar en `gameover`
   - `Enter` en `gameover` reinicia y reemite score 0, líneas 0 y nivel 1; el `Espacio` se ignora en `gameover`
   - `destroy()` cancela el frame y quita los listeners de `window` y `document`

4. **Pausa**

   - `pause()`/`resume()` sin salto de `dt`, overlay `PAUSA` en el canvas, tecla `P` y `visibilitychange` con la pestaña oculta; emitir `onPause`
   - Durante la pausa se ignoran las teclas de movimiento y la pausa no se activa en `gameover`

5. **Integración en `GamePlayer`**

   - Comprobar que el canvas 800×600 de `/player/tetris` se encuadra en `.crt-screen` sin cambios de CSS y que el HUD muestra Puntuación / Líneas / Nivel reales
   - PAUSAR alterna `pause()`/`resume()` y su etiqueta cambia a REANUDAR
   - Comprobar en `npm run dev` (Strict Mode) que no quedan dos loops ni listeners duplicados

6. **Catálogo**

   - Confirmar con `select` a `public.games` (herramienta MCP `execute_sql`) que la fila `tetris` existe con `cover = 'cover-tetro'`; no se crea migración
   - `/games` y `/` ya muestran Tetris con su portada actual

7. **Guardado y ranking**

   - Verificar el guardado con sesión: partida con score > 0 hasta `GAME OVER` y fila en `scores` con `game_id = 'tetris'` (consulta con `execute_sql`)
   - Verificar que TERMINAR no duplica, que invitados no guardan y que la marca aparece en `/salon` (pestaña `TETRIS VAULT`) y `/games/tetris`
   - Borrar los datos de prueba al terminar

8. **Documentación**
   - `README.md`: tabla de controles de Tetris y nota de que `tetris` está en `PLAYABLE` y en `games`

---

## Acceptance Criteria

- [ ] `npm run build` termina sin errores y `npx eslint app lib` no reporta errores (el `npm run lint` global falla por scripts sueltos de la raíz que ya existían)
- [ ] `app/components/games/types.ts` existe y Asteroids y `registry.ts` compilan usándolo
- [ ] `/player/asteroids` sigue funcionando igual: HUD con Puntuación / Vidas / Nivel reales y sin cambios de comportamiento
- [ ] `/player/tetris` muestra un canvas con el tablero vacío centrado, una pieza cayendo y el panel `SIGUIENTE` con la pieza siguiente, sin errores en consola
- [ ] Los demás ids (p. ej. `/player/snake`) siguen mostrando el placeholder "JUEGO AQUÍ" con HUD Puntuación 0 / Vidas 3 / Nivel 1
- [ ] El HUD de `/player/tetris` muestra Puntuación, Líneas y Nivel, y no muestra Vidas
- [ ] `←` y `→` mueven la pieza, `↓` la baja una fila, `↑` y `X` la rotan y `Espacio` la suelta al instante; la página no hace scroll al pulsarlas
- [ ] Soft drop suma 1 punto por fila y hard drop suma 2 puntos por celda recorrida, y el HUD lo refleja de inmediato
- [ ] Completar 1, 2, 3 y 4 líneas a la vez suma 100, 300, 500 y 800 puntos multiplicados por el nivel
- [ ] El nivel sube en 1 cada 10 líneas y el HUD lo refleja; la caída automática se acelera con el nivel
- [ ] La rotación pegada a una pared aplica los _wall kicks_ y no atraviesa celdas ocupadas
- [ ] La pieza fantasma se dibuja translúcida en la posición de aterrizaje de la pieza actual
- [ ] Aparecen las 8 piezas (incluida la tuerca N de 3×3) con los colores de la paleta neón
- [ ] Al spawnear una pieza que colisiona aparece `GAME OVER` en el canvas con la puntuación final y `ENTER PARA REINICIAR`
- [ ] `onGameOver` se emite una sola vez por partida
- [ ] `Enter` tras `GAME OVER` reinicia con tablero vacío, y el HUD muestra score 0, líneas 0 y nivel 1; `Espacio` no reinicia
- [ ] PAUSAR congela el juego, muestra `PAUSA` en el canvas, el botón pasa a REANUDAR y REANUDAR continúa sin salto de posición
- [ ] La tecla `P` alterna la pausa y cambiar de pestaña pausa el juego
- [ ] `public.games` contiene la fila `tetris` con `cover = 'cover-tetro'` y no se creó ninguna migración nueva para el juego
- [ ] Con sesión iniciada, llegar a `GAME OVER` con score > 0 inserta una fila en `scores` con `game_id = 'tetris'`, el `user_id` del usuario y el score real
- [ ] Llegar a `GAME OVER` y pulsar TERMINAR no crea una segunda fila
- [ ] TERMINAR a mitad de partida con sesión y score > 0 guarda el score actual y navega a `/games/tetris`
- [ ] Como invitado, terminar una partida no inserta nada en `scores`
- [ ] `/salon` (pestaña `TETRIS VAULT`) y `/games/tetris` muestran el ranking real con la marca del usuario
- [ ] Salir de `/player/tetris` (TERMINAR, VOLVER A DETALLES o navegación del navegador) detiene el loop; no quedan listeners `keydown` del juego ni frames pendientes
- [ ] En `npm run dev` (Strict Mode) solo hay una instancia del juego activa
- [ ] A 375 px de ancho el canvas se ve completo, sin scroll horizontal
- [ ] `references/started-games/03-tetris/` queda sin modificar

---

## Decisions Taken and Discarded

| Decisión                                                                | Razón                                                                                                                                              |
| ----------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Módulo TS con `createTetris` y contrato común**                       | Mismo patrón que Asteroids; el contrato compartido evita que `registry.ts` dependa de los tipos de un solo juego                                   |
| **Descartado: copiar el contrato de Asteroids**                         | Tetris no tiene vidas y obligaría a una unión de tipos frágil en `registry.ts` y en el HUD                                                         |
| **Contrato con callbacks opcionales (`onLives`, `onLevel`, `onLines`)** | Cada juego emite solo las métricas que tiene; `GamePlayer` decide qué mostrar                                                                      |
| **HUD dinámico con `null` hasta que el juego emite**                    | Un HUD fijo mostraría "Vidas 3" en Tetris; el placeholder conserva los valores por defecto del MVP                                                 |
| **Líneas en el HUD de React**                                           | El original tenía `#lines` en el HUD; la plataforma ya muestra sus métricas en `.player-hud` y duplicarlas en el canvas sería redundante           |
| **Las 8 piezas del código, incluida la tuerca N**                       | El código ejecutable es la fuente de verdad; el README dice 7 y queda desactualizado respecto a `game.js`                                          |
| **Canvas 800×600 con tablero centrado y panel `SIGUIENTE`**             | Mantiene `.crt-screen` 4:3 sin tocar CSS y conserva la vista previa dentro de un único canvas                                                      |
| **Descartado: canvas 450×600 o 300×600**                                | Exigen adaptar `.crt-screen` y su `aspect-ratio`; el 300×600 además pierde la vista previa                                                         |
| **Paleta neón de la plataforma**                                        | Integra el juego visualmente; los hex son fijos porque el canvas no lee variables CSS                                                              |
| **T y J usan tonos derivados (`#b14dff`, `#4d7cff`)**                   | La plataforma no tiene variable morada ni azul; se eligieron tonos neón para mantener las 8 piezas diferenciables                                  |
| **Pieza N en `--silver`**                                               | Conserva la idea del gris metálico del original ("tuerca") dentro de la paleta                                                                     |
| **Reinicio con `Enter`**                                                | `Espacio` es el hard drop y reiniciaría por accidente; `Enter` no choca con ninguna tecla de juego                                                 |
| **Overlay en el canvas (`PAUSA`, `GAME OVER`)**                         | El original usaba un overlay DOM compartido; en la plataforma el botón PAUSAR ya vive en React y el overlay pertenece al canvas, como en Asteroids |
| **`dt` en segundos con tope 0.05 s**                                    | Convención de la plataforma; el original acumulaba milisegundos sin tope y el tope evita una caída brusca al volver de una pestaña oculta          |
| **`preventDefault` en todas las teclas de juego**                       | El original solo lo hacía en `Espacio`; las flechas harían scroll en la página de la plataforma                                                    |
| **Se conserva la auto-repetición de teclas del original**               | Es el comportamiento actual (incluido repetir el hard drop al mantener `Espacio`); cambiarlo es una decisión de jugabilidad para otra spec         |
| **Sin tema claro/oscuro, sin botón HTML de reiniciar**                  | El tema es de la plataforma y el reinicio pasa a `Enter`                                                                                           |
| **Sin sonido, sin táctil, sin hold ni 7-bag**                           | Fuera del original o del alcance; cada uno merece su propia spec                                                                                   |
| **Reutilizar la fila `tetris` de `games`**                              | Ya existe con portada `cover-tetro`; evita una migración y una portada nuevas                                                                      |
| **Solo guardar con sesión y `score > 0`**                               | Coincide con SPEC 05 y 06; los invitados no guardan                                                                                                |
| **Sin anti-trampas**                                                    | Insert directo con RLS, decisión de SPEC 06                                                                                                        |

---

## Identified Risks

- **Doble montaje en React Strict Mode**: dos loops o listeners duplicados. Mitigación: `destroy()` idempotente que cancela el frame y quita listeners; criterio de aceptación explícito.
- **Regresión en Asteroids por el paso 0**: el refactor del contrato y el HUD dinámico tocan el juego ya integrado. Mitigación: Asteroids emite vidas y nivel al crearse (`initGame`), y hay un criterio de aceptación que comprueba su HUD y comportamiento.
- **HUD con `null` parpadea o queda vacío**: si un juego tarda en emitir, la columna no aparece. Mitigación: `createTetris` emite score, líneas y nivel de forma síncrona al crearse.
- **Teclas capturadas globalmente**: `preventDefault` en flechas, `Espacio` y `Enter` afectaría a formularios. Mitigación: los listeners existen solo con `GamePlayer` montado y se ignoran eventos con `target` `input`, `textarea` o `select`.
- **Foco en botones y `Enter`/`Espacio`**: pulsar PAUSAR y luego `Enter` o `Espacio` activaría el botón además de la acción del juego. Mitigación: `preventDefault` en esas teclas y `blur()` del botón tras el clic.
- **Colores T y J fuera de la paleta de variables**: son hex fijos. Mitigación: documentados en el Data Model; si la paleta cambia hay que actualizar `constants.ts`.
- **Hard drop repetido por auto-repetición**: mantener `Espacio` suelta varias piezas seguidas. Mitigación: se conserva por fidelidad; corregirlo es otra spec.
- **Panel `SIGUIENTE` desalineado en pantallas estrechas**: el canvas escala por CSS. Mitigación: las posiciones son lógicas (800×600) y escalan junto con el canvas; criterio de aceptación a 375 px.
- **Ejecución en servidor**: acceder a `window`/`document` durante SSR rompe el build. Mitigación: el módulo solo toca el DOM dentro de `createTetris`, invocado desde `useEffect`.
- **Convención de Next 16**: `GamePlayer` es un Client Component dentro de una ruta con params asíncronos. Mitigación: leer `node_modules/next/dist/docs/` antes de tocar `app/(app)/player/[id]/page.tsx` si hiciera falta modificarlo.
- **Lint global roto por archivos ajenos**: los scripts `test-*.js` de la raíz fallan en `npm run lint`. Mitigación: los criterios usan `npx eslint app lib`.

---

## What is **not** in this spec

- Tema claro/oscuro, botón HTML de reiniciar, sonido y música.
- Controles táctiles o gamepad.
- Pieza de reserva (_hold_), aleatorizador de bolsa y filtro de auto-repetición.
- Validación anti-trampas y cálculo de `best`/`plays` desde `scores`.
- Cambios en la fila `tetris` de `games` o en su portada.
- Portar Arkanoid u otros juegos (cada uno tendrá su spec).
- Pruebas automatizadas.

Cada uno de estos, si se aborda, va en su propia spec.
