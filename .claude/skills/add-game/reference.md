# Referencia técnica: integrar un juego en Arcade Vault

Este archivo lo lee `/add-game` y se cita en cada spec generada. Es un resumen de lo que ya funciona en el repo (specs 05 y 06); si el código cambió, la spec manda y este archivo se actualiza.

## 1. Piezas de la plataforma

| Pieza                | Ubicación                                                     | Qué hace                                                                                                                           |
| -------------------- | ------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| Módulo del juego     | `app/components/games/<id>/`                                  | Lógica y render en canvas, en TypeScript, expuesta como `create<Juego>(canvas, callbacks)`                                         |
| Registro             | `app/components/games/registry.ts`                            | `PLAYABLE: Record<string, GameFactory>`; clave = `id` del juego                                                                    |
| Reproductor          | `app/components/GamePlayer.tsx`                               | Monta el canvas, conecta HUD, pausa y guardado de puntuación; si el `id` no está en `PLAYABLE` muestra el placeholder "JUEGO AQUÍ" |
| Catálogo             | tabla `public.games`                                          | Fuente de verdad de los juegos; lectura en servidor con `lib/games.ts` (`getGames`, `getGame`)                                     |
| Puntuaciones         | tabla `public.scores`                                         | Una fila por partida guardada; FK `game_id` → `games.id`                                                                           |
| Ranking              | vista `public.leaderboard`                                    | Mejor marca por jugador y juego; la consume `lib/leaderboard.ts`                                                                   |
| Pantallas de ranking | `HallOfFame.tsx` (`/salon`), `GameDetail.tsx` (`/games/<id>`) | Leen `leaderboard`; **no requieren cambios al añadir un juego**                                                                    |

Añadir un juego **no** toca `Library`, `HallOfFame` ni `GameDetail`: aparecen solos al existir la fila en `games`.

## 2. Contrato común del módulo

El contrato actual está atado a Asteroids (`AsteroidsCallbacks`/`AsteroidsGame` en `app/components/games/asteroids/types.ts`, y `registry.ts` los usa para todos). Para soportar juegos sin vidas (Tetris usa líneas) se generaliza en `app/components/games/types.ts`:

```typescript
export interface GameCallbacks {
  onScore: (score: number) => void;
  onGameOver: (finalScore: number) => void;
  onPause?: (paused: boolean) => void;
  // Opcionales: el juego solo emite los que le aplican
  onLives?: (lives: number) => void;
  onLevel?: (level: number) => void;
  onLines?: (lines: number) => void;
}

export interface GameInstance {
  pause: () => void;
  resume: () => void;
  getScore: () => number;
  destroy: () => void;
  // Spec 10: cambia la paleta en caliente (ver sección 11)
  setSkin?: (skin: SkinId) => void;
}

export interface GameOptions {
  skin?: SkinId; // de app/components/games/skins.ts
}

export type GameFactory = (
  canvas: HTMLCanvasElement,
  callbacks: GameCallbacks,
  options?: GameOptions,
) => GameInstance;
```

- `registry.ts` importa `GameFactory` de `types.ts` y deja `PLAYABLE` con una entrada por juego.
- `asteroids/types.ts` pasa a re-exportar (o eliminar) sus tipos propios y usar los comunes.
- `GamePlayer` muestra en el HUD solo las métricas que el juego emite: puntuación siempre; vidas, nivel y líneas si hay callback. Hoy el HUD tiene campos fijos (`Puntuación`, `Vidas`, `Nivel`); el primer juego que no use vidas debe decidir en su spec cómo se ocultan.
- Este refactor (paso 0) se hace **una sola vez**: si `app/components/games/types.ts` ya existe, no se repite.

## 3. Reglas del módulo del juego

1. **API:** `create<Juego>(canvas, callbacks, options?): GameInstance` en `app/components/games/<id>/index.ts` (`options.skin`, ver sección 11).
2. **Sin globals:** todo el estado vive en el closure de `create<Juego>`. Sin variables de módulo mutables.
3. **Sin DOM fuera de `create<Juego>`:** `window` y `document` solo se tocan dentro de la función (el build de Next renderiza en servidor). El módulo solo se invoca desde un `useEffect`.
4. **Bucle:** `requestAnimationFrame` con `dt` en segundos y **tope de 0.05 s**. Si el original usa milisegundos o frames, se convierte y se documentan las constantes portadas.
5. **Canvas lógico fijo**, escalado por CSS (`.crt-screen canvas`: `width: 100%`, `aspect-ratio`). No se cambia la resolución lógica para no alterar velocidades ni colisiones.
6. **Teclado:** listeners en `window`; `preventDefault` solo en las teclas del juego; ignorar eventos cuyo `target` sea `input`, `textarea` o `select`.
7. **Pausa:** `pause()`/`resume()`, tecla `P` y `visibilitychange` con la pestaña oculta. `resume()` reinicia `lastTime` (sin salto de `dt`) y descarta pulsaciones acumuladas. Emitir `onPause` para que React actualice el botón.
8. **Fin de partida:** emitir `onGameOver(finalScore)` **una sola vez** al entrar en `gameover`. El overlay `GAME OVER` se dibuja en el canvas. Un reinicio (p. ej. `Espacio`) vuelve a emitir score 0 y los valores iniciales de vidas/nivel/líneas.
9. **Limpieza:** `destroy()` es idempotente; cancela el frame y quita todos los listeners (`window` y `document`), compatible con React Strict Mode (doble montaje).
10. **Callbacks que solo escriben estado:** el juego se crea una vez; no puede leer estado de React nuevo. `GamePlayer` mantiene `user` en un `ref`.

## 4. Guía de portado desde `references/started-games/`

Los juegos de referencia son JS vanilla: globals, DOM y scripts sueltos. Al portarlos:

| En el original                                            | En el módulo                                                               |
| --------------------------------------------------------- | -------------------------------------------------------------------------- |
| Variables globales (`let score`, `board`…)                | Variables dentro del closure de `create<Juego>`                            |
| `document.getElementById('score')` y similares (HUD HTML) | `callbacks.onScore`, `onLives`, `onLevel`, `onLines`                       |
| Overlay HTML de pausa o game over                         | Dibujado en el canvas (`PAUSA`, `GAME OVER`)                               |
| Canvas secundario (p. ej. `#next-canvas` de Tetris)       | Se dibuja dentro del canvas principal, salvo decisión contraria en la spec |
| `document.addEventListener('keydown', …)` sin limpieza    | `window.addEventListener` con `removeEventListener` en `destroy()`         |
| `new Audio('assets/…')`, `new Image()` a nivel de módulo  | Dentro de `create<Juego>`; ruta `/games/<id>/…`                            |
| `localStorage` (tema claro/oscuro, récords locales)       | Se elimina: el tema es de la plataforma y los récords viven en `scores`    |
| Botón "Reiniciar" del HTML                                | Tecla de reinicio dentro del juego (como `Espacio` en Asteroids)           |
| `'use strict'` y scripts con `<script src>`               | Módulos ES con imports/exports                                             |

Nunca se modifica el código dentro de `references/`. Las constantes del original (velocidades, puntos, tamaños) se portan **sin cambios**; cualquier ajuste es una decisión explícita de la spec.

## 5. Assets (sprites y sonidos)

- Se copian a `public/games/<id>/` (p. ej. `public/games/arkanoid/spritesheet.png`, `public/games/arkanoid/sounds/*.mp3`) y se referencian con rutas absolutas `/games/<id>/…`.
- Se cargan dentro de `create<Juego>` y `destroy()` los libera (pausar audio, soltar referencias).
- Esperar a que la imagen cargue antes del primer frame, o pintar un fondo mientras tanto.
- Los navegadores bloquean el audio hasta la primera interacción: el sonido solo debe reproducirse tras una tecla o clic del usuario.
- El sonido es decisión explícita por juego (la spec 05 lo dejó fuera).

## 6. Catálogo: fila en `public.games`

1. **Comprobar si el `id` ya existe** (`select id from public.games`). Existen: `galaga`, `tetris`, `snake`, `frogger`, `pacman`, `asteroids`, `duel`, `breakout`.
2. **Si existe:** no hay migración de alta. Solo si la spec lo pide, una migración `update` de textos.
3. **Si no existe:** migración `supabase/migrations/<timestamp>_add_<id>_game.sql`:

```sql
insert into public.games
  (id, title, short_desc, long_desc, category, cover, color, best, plays, sort_order)
values
  ('<id>', '<TÍTULO> VAULT', '<descripción corta>', '<descripción larga>',
   '<ACCIÓN|PUZZLE|DEPORTES|RETRO>', 'cover-<id>', null, 0, 0,
   (select coalesce(max(sort_order), 0) + 1 from public.games));
```

- `id` cumple `^[a-z0-9-]+$` y es la ruta y la clave de `PLAYABLE`.
- `best`/`plays` son estáticos (no se calculan desde `scores`).
- Aplicar con `apply_migration`, ejecutar `get_advisors` (security), regenerar tipos con `generate_typescript_types` en `lib/supabase/database.types.ts`.

4. **Sin fila en `games`, el guardado de puntuaciones falla** por la FK de `scores.game_id`. La migración se aplica antes de probar el guardado.

## 7. Portada (`games.cover`)

`games.cover` es una **clase CSS** definida en `app/globals.css` (hoy `cover-invaders`, `cover-tetro`, `cover-snake`, `cover-rana`, `cover-glot`, `cover-rocas`, `cover-duelo`, `cover-bricks`, en torno a las líneas 644–800).

- Patrón: `.cover-<id>` con `background` (gradientes) y pseudo-elementos `::before`/`::after` para formas; usa las variables de color de la plataforma (`var(--cyan)`, `var(--yellow)`…).
- Se crea la clase nueva **invocando `/frontend-design`** (lo exige el `CLAUDE.md` del proyecto). No se cambian variables ni portadas existentes.
- Si el usuario prefiere reutilizar una portada, se usa la clase existente y no se toca el CSS.

## 8. Guardado de puntuación y ranking (ya implementado en `GamePlayer`)

- Se guarda en `public.scores` con `{ game_id, score }`; `user_id` lo rellena `auth.uid()`.
- Solo si hay sesión y `score > 0`; los invitados no guardan.
- Se guarda al llegar a `GAME OVER` (`savedRef = true`) y al pulsar TERMINAR si aún no se guardó; el reinicio del juego restablece `savedRef`.
- Si el insert falla, `savedRef` vuelve a `false`, se registra el error en consola y TERMINAR reintenta; el juego no se interrumpe.
- El ranking muestra una marca por jugador, ordenada por `score` descendente y, en empate, por fecha ascendente.
- **El ranking solo tiene sentido si más puntuación es mejor.**
- Validación anti-trampas: no existe (insert directo con RLS); queda fuera de la spec de cada juego.

## 9. Integración con `GamePlayer`

- `PLAYABLE[game.id]` decide si se monta el canvas o el placeholder.
- Canvas: `<canvas className="game-canvas" width={W} height={H}>` dentro de `.crt-screen`; el tamaño lógico viene del juego. Si el tamaño lógico no es 800×600 (Tetris es 300×600), la spec debe definir cómo se encuadra en `.crt-screen` y su `aspect-ratio`.
- Estado React: `score`, `lives`, `level`, `paused` (y `lines` si el juego lo emite).
- PAUSAR alterna `pause()`/`resume()`; el botón cambia a REANUDAR vía `onPause`.
- TERMINAR guarda (si corresponde) y navega a `/games/<id>`.
- Selector de skin (`CLÁSICO / NEON / RETRO`) en el HUD, visible solo si el id está en `SKINNABLE`; ver sección 11.

## 10. Next.js 16 (este repo)

- La versión tiene cambios respecto a lo que se conoce: leer `node_modules/next/dist/docs/` antes de tocar rutas o caché.
- Las páginas son Server Components; `params` es asíncrono (`const { id } = await params`, tipo `PageProps<"/games/[id]">`).
- El middleware se llama **Proxy** (`proxy.ts`).
- Los componentes con hooks o eventos llevan `"use client"`; el módulo del juego solo se usa desde uno.
- Formato: el hook de PostToolUse aplica Prettier y ESLint a `.tsx`/`.jsx`/`.md` al escribir.

## 11. Skins del canvas (spec 10)

**Todo juego nuevo nace con 3 skins** y aparece en el selector de `GamePlayer`. Contrato común en `app/components/games/skins.ts`: `SkinId = "classic" | "neon" | "retro"`, `SKINS`, `DEFAULT_SKIN = "classic"` e `isSkinId`.

| Skin      | Rol                                                                                                                                                                    |
| --------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `classic` | Por defecto. El look fiel al arcade original; si el juego se porta, es el aspecto actual sin regresión                                                                 |
| `neon`    | Paleta de `globals.css` (`--cyan`, `--magenta`, `--yellow`, `--green`, `--ink`) sobre `--bg`; glow `shadowBlur` 4–12 solo en elementos clave, restablecido a 0 después |
| `retro`   | Paleta limitada de 4–6 colores (p. ej. fósforo verde), sin glow ni degradados; **sin scanlines en el canvas** (`.crt-screen::after` ya las pinta)                      |

Requisitos del módulo:

1. `app/components/games/<id>/skins.ts` con la interfaz de paleta del juego y `PALETTES: Record<SkinId, Palette>`. **Ningún literal de color fuera de ese archivo** (comprobar con `grep -rnE '#[0-9a-fA-F]{3,6}\b|rgba?\(' app/components/games/<id>/ --exclude=skins.ts`).
2. `create<Juego>(canvas, callbacks, options?)`: paleta inicial `PALETTES[isSkinId(options?.skin) ? options.skin : DEFAULT_SKIN]` en una variable del closure (sin estado global); el render la recibe por parámetro.
3. `setSkin(skin)` en la instancia: solo reasigna la paleta (ignora valores inválidos). No reinicia la partida, no emite callbacks y el siguiente frame (también en pausa o en `GAME OVER`) ya la usa.
4. Glow dentro de `save()`/`restore()` para que `shadowBlur` no deje halo en el resto del frame.
5. Overlays (`PAUSA`, `GAME OVER`): en `neon`/`retro`, velo semitransparente del color de fondo bajo el texto para asegurar contraste.
6. Juegos con sprites: `classic` usa el spritesheet original; `neon`/`retro` lo tiñen en un canvas offscreen cacheado por skin (creado dentro de `create<Juego>`) o usan primitivas. Nunca se modifica `public/games/<id>/`.
7. Alta del id en `SKINNABLE` (`app/components/games/registry.ts`): solo con esa entrada `GamePlayer` muestra el selector `CLÁSICO / NEON / RETRO`. El skin es global (`localStorage` `av_skin`, hook `useSkin`); `GamePlayer` lo pasa como `options.skin` al crear el juego y llama a `setSkin` al cambiarlo.

Checklist de modo oscuro (contraste WCAG medido con un script Node fuera del repo, también con la fila de scanline: fondo y figura × 0.82):

- [ ] Fondo del canvas con luminancia relativa ≤ 0.05
- [ ] Texto de overlays ≥ 4.5:1 contra su fondo real (con el velo y sobre los elementos que cruza)
- [ ] Elementos de juego (jugador, enemigos, piezas, proyectiles…) ≥ 3:1 contra el fondo
- [ ] Si la mecánica depende del color, los colores se distinguen entre sí (luminancia o tono)
- [ ] Sin grandes áreas de blanco puro; el glow no borra la silueta
- [ ] Se ve bien a 375 px (capturas en `.playwright-screenshots/skins/<id>-<skin>.png` y `-375.png`)

El agente `skin-designer` audita estos puntos y puede añadir los skins a un juego que no los tenga.
