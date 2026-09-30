# Juego Asteroids en la Plataforma

**State:** Implemented  
**Depends on:** SPEC 01 (Arcade Vault MVP), SPEC 04 (Supabase Auth, hook `useUser()`)  
**Date:** 2026-09-28  
**Objective:** Portar el juego Asteroids de `references/started-games/02-asteroids` a un módulo TypeScript montable en canvas y conectarlo a `GamePlayer` (HUD, pausa, fin de partida y puntuación) en la ruta `/player/asteroids`.

---

## Scope

**Está incluido:**

- Módulo del juego en `app/components/games/asteroids/` escrito en TypeScript, sin variables globales de módulo ni acceso a `document`/`window` fuera de `mount`
- API pública `createAsteroids(canvas, callbacks): AsteroidsGame` con `pause()`, `resume()` y `destroy()`
- Lógica fiel al original: nave con inercia, disparo, asteroides que se parten (3 tamaños), powerup 3x, partículas, vidas, niveles y envolvimiento toroidal
- Trazo vectorial blanco sobre negro, canvas lógico 800×600
- Canvas responsive vía CSS (`width: 100%`, `aspect-ratio: 4 / 3`) sin cambiar la resolución lógica
- Registro de juegos jugables en `app/components/games/registry.ts` (`id` → factory); `GamePlayer` usa el juego si existe en el registro y mantiene el placeholder actual para el resto
- HUD de React (`.player-hud`) alimentado por callbacks: puntuación, vidas y nivel reales
- Se elimina `drawHUD` del canvas; se conservan en el canvas el overlay `GAME OVER` y el contador `3x` del powerup
- Botón PAUSAR/REANUDAR funcional; la tecla `P` también alterna la pausa
- Botón TERMINAR: guarda la puntuación real y navega a `/games/asteroids`
- Guardado automático de la puntuación al llegar a `GAME OVER`
- Control por teclado: `←` `→` rotar, `↑` propulsar, `Espacio` disparar (y reiniciar tras `GAME OVER`); se hace `preventDefault` en esas teclas para evitar el scroll de la página
- Limpieza completa de listeners y `requestAnimationFrame` en `destroy()` (compatible con React Strict Mode)
- Foco/pausa automática cuando la pestaña pierde visibilidad

**NO está incluido:**

- Tabla `scores` en Supabase ni migración de `av_scores`; se sigue guardando en localStorage (otra spec)
- Controles táctiles o gamepad
- Sonido y música
- Recolorear el juego con la paleta neón de la plataforma
- Los otros juegos de `references/started-games` (Tetris, Arkanoid) y el resto de `GAMES` (siguen con el placeholder)
- Actualizar `best`/`plays` de `data.ts` o el Salón de la Fama con las puntuaciones nuevas
- Pruebas automatizadas (el repo no tiene framework de tests)
- Modificar el `game.js` original en `references/`

---

## Data Model

No se introduce nueva persistencia. Se reutiliza `av_scores` (localStorage) de SPEC 01/04.

Contrato del módulo:

```typescript
export interface AsteroidsCallbacks {
  onScore: (score: number) => void;
  onLives: (lives: number) => void;
  onLevel: (level: number) => void;
  onGameOver: (finalScore: number) => void;
}

export interface AsteroidsGame {
  pause: () => void;
  resume: () => void;
  getScore: () => number;
  destroy: () => void;
}

export function createAsteroids(
  canvas: HTMLCanvasElement,
  callbacks: AsteroidsCallbacks,
): AsteroidsGame;
```

Registro de juegos jugables:

```typescript
// app/components/games/registry.ts
export type GameFactory = (
  canvas: HTMLCanvasElement,
  callbacks: AsteroidsCallbacks,
) => AsteroidsGame;

export const PLAYABLE: Record<string, GameFactory> = {
  asteroids: createAsteroids,
};
```

Entrada guardada en `av_scores` (misma forma que hoy, ahora con `score` real):

```typescript
{ gameId: "asteroids", playerName: user.name, score: number, at: Date.now() }
```

Constantes portadas sin cambios: `RADII = [0,16,30,50]`, `SPEEDS = [0,85,55,32]`, `POINTS = [0,100,50,20]`, `POWERUP_DROP_CHANCE = 0.15`, `POWERUP_DURATION = 5`, `POWERUP_TTL = 12`, `TRIPLE_SPREAD = 0.18`.

Convenciones:

- Origen del canvas arriba a la izquierda; tamaño lógico 800×600.
- Velocidades en px/s, `dt` en segundos y limitado a 0.05 s.
- Estado interno encapsulado en el closure de `createAsteroids`; el estado de partida es `'playing' | 'dead' | 'gameover'`.

---

## Implementation Plan

1. **Esqueleto del módulo**
   - Crear `app/components/games/asteroids/types.ts` (interfaces del Data Model) y `app/components/games/asteroids/index.ts` con `createAsteroids` que solo pinta fondo negro y devuelve `pause/resume/getScore/destroy` vacíos
   - Crear `app/components/games/registry.ts` con `PLAYABLE`
   - El sitio sigue funcionando igual (nada lo consume aún)

2. **Entidades y utilidades**
   - `app/components/games/asteroids/entities.ts`: clases `Bullet`, `Asteroid`, `PowerUp`, `Ship`, `Particle` tipadas, recibiendo el `ctx` por parámetro en `draw(ctx)` en lugar de usar globals
   - `app/components/games/asteroids/utils.ts`: `wrap`, `dist`, `rand`, `randInt` y las constantes
   - Sin uso todavía; `npm run build` compila

3. **Lógica de juego y loop**
   - `index.ts`: input (`keydown`/`keyup` con `preventDefault` en `ArrowLeft/Right/Up` y `Space`), estado, `initGame`, `nextLevel`, `killShip`, `update`, `draw` y loop con `requestAnimationFrame`
   - Emitir `onScore`, `onLives`, `onLevel` al cambiar y `onGameOver` una sola vez al entrar en `gameover`
   - `Espacio` en `gameover` reinicia y vuelve a emitir score 0, vidas 3 y nivel 1
   - `drawHUD` se reduce a dibujar el contador `3x`; se mantiene el overlay `GAME OVER`
   - `destroy()` cancela el frame y quita los listeners de `window`

4. **Pausa**
   - `pause()` detiene la actualización (el loop sigue pintando el último frame y un overlay `PAUSA`); `resume()` reinicia sin salto de `dt`
   - La tecla `P` alterna; `visibilitychange` con la pestaña oculta pausa
   - Comprobar manualmente con el juego montado desde un componente de prueba temporal o el paso 5

5. **Integrar en `GamePlayer`**
   - Consultar `PLAYABLE[game.id]`; si existe, renderizar un `<canvas width={800} height={600}>` dentro de `.crt-screen` en lugar de `.game-arena` y `.crt-content`; si no, mantener el placeholder actual
   - `useEffect` que llama `createAsteroids` con los callbacks y devuelve `destroy` como cleanup
   - Estado React `score`, `lives`, `level`, `paused`; el `player-hud` muestra esos valores
   - PAUSAR alterna `pause()`/`resume()` y su etiqueta cambia a REANUDAR
   - Comprobar en dev que en Strict Mode no quedan dos loops ni listeners duplicados

6. **Guardado de puntuación y TERMINAR**
   - Función `saveScore(score)` en `GamePlayer` que escribe en `av_scores` solo si hay `user` y `score > 0`
   - `onGameOver(finalScore)` llama `saveScore` una vez y marca `savedRef = true`; al reiniciar con `Espacio` se restablece a `false`
   - TERMINAR: si `savedRef` es `false`, guarda `getScore()`; después navega a `/games/asteroids`
   - Invitado: no se guarda nada

7. **Estilos**
   - Añadir en `app/globals.css` reglas para `.crt-screen canvas` (`display: block`, `width: 100%`, `height: auto`, `aspect-ratio: 4 / 3`, fondo negro, `image-rendering` por defecto)
   - Verificar que el marco `.crt` no recorta el canvas en <800px
   - No crear stylesheet nuevo ni cambiar variables existentes

8. **Documentación**
   - Anotar en `README.md` cómo añadir un juego nuevo al registro (`PLAYABLE`) y los controles de Asteroids

---

## Acceptance Criteria

- [ ] `npm run build` y `npm run lint` terminan sin errores
- [ ] `/player/asteroids` muestra un canvas con la nave en el centro y 4 asteroides grandes, sin errores en consola
- [ ] Los otros ids (p. ej. `/player/tetris`) siguen mostrando el placeholder "JUEGO AQUÍ"
- [ ] `←` y `→` rotan la nave, `↑` la acelera con inercia y `Espacio` dispara; la página no hace scroll al pulsarlos
- [ ] Un asteroide grande destruido suma 20, uno mediano 50 y uno pequeño 100 puntos, y el HUD de React lo refleja de inmediato
- [ ] Un asteroide grande se parte en 2 medianos y uno mediano en 2 pequeños; uno pequeño desaparece sin partirse
- [ ] Nave, balas, asteroides y powerups aparecen por el borde opuesto al salir del canvas
- [ ] Al chocar con un asteroide fuera de invencibilidad, las vidas del HUD bajan en 1 y la nave reaparece tras 2 s parpadeando
- [ ] Al destruir todos los asteroides el HUD muestra nivel 2 y aparecen 5 asteroides (`3 + nivel`)
- [ ] Recoger el powerup `3x` dispara 3 balas durante 5 s y el contador se ve en el canvas
- [ ] Al perder la tercera vida aparece `GAME OVER` en el canvas con la puntuación final
- [ ] `Espacio` tras `GAME OVER` reinicia la partida con score 0, vidas 3 y nivel 1 en el HUD
- [ ] PAUSAR congela el juego, el botón pasa a REANUDAR y REANUDAR continúa sin salto de posición
- [ ] La tecla `P` alterna la pausa y cambiar de pestaña pausa el juego
- [ ] Con sesión iniciada, llegar a `GAME OVER` con score > 0 añade una entrada a `av_scores` con `gameId: "asteroids"`, `playerName` del usuario y el score real
- [ ] Llegar a `GAME OVER` y pulsar TERMINAR no duplica la entrada en `av_scores`
- [ ] Con sesión iniciada, TERMINAR a mitad de partida guarda el score actual (si > 0) y navega a `/games/asteroids`
- [ ] Como invitado, terminar una partida no escribe en `av_scores`
- [ ] Salir de `/player/asteroids` (TERMINAR, VOLVER A DETALLES o navegación del navegador) detiene el loop; en DevTools no hay listeners `keydown` del juego ni frames pendientes
- [ ] En `npm run dev` (Strict Mode) solo hay una instancia del juego activa
- [ ] A 375 px de ancho el canvas se ve completo, sin scroll horizontal
- [ ] `references/started-games/02-asteroids/` queda sin modificar

---

## Decisions Taken and Discarded

| Decisión                                                          | Razón                                                                                                                            |
| ----------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| **Módulo TS con `mount`/`destroy`**                               | Permite HUD en React, pausa real y limpieza de listeners; es el patrón reutilizable para Tetris y Arkanoid                       |
| **Descartado: iframe con archivos estáticos**                     | Requiere `postMessage` para HUD, pausa y score, y el estilo queda aislado                                                        |
| **Descartado: pegar `game.js` con globals en un `useEffect`**     | Fugas al remontar en Strict Mode y nada reutilizable                                                                             |
| **Ubicación `app/components/games/asteroids/`**                   | Evita confundir el módulo con el segmento de ruta `/games` (`app/(app)/games`) y sigue la convención de `app/components/`        |
| **HUD de React, no del canvas**                                   | El `player-hud` ya está diseñado con la estética de la plataforma; duplicarlo en el canvas sería redundante                      |
| **Se conservan overlay `GAME OVER` y contador `3x` en canvas**    | Son parte del feedback inmediato de la partida y no tienen lugar en el HUD de React                                              |
| **Registro `PLAYABLE` por id**                                    | `GamePlayer` es genérico para los 8 juegos de `data.ts`; el registro permite ir activando juegos sin tocar la lógica de cada uno |
| **Vectorial blanco fiel al original**                             | Preserva el sabor clásico; el marco CRT ya aporta el toque arcade. Recolorear se puede hacer en una spec de estética             |
| **Guardado al `GAME OVER` + guardado en TERMINAR con `savedRef`** | La partida termina con Espacio para reiniciar (como el original), así que no se navega sola; la bandera evita duplicados         |
| **`av_scores` en localStorage**                                   | Mantiene la decisión de SPEC 04; la tabla `scores` llega en otra spec                                                            |
| **Solo guardar con sesión y `score > 0`**                         | Coincide con el comportamiento del MVP para invitados y evita entradas vacías                                                    |
| **Pausa con `P` y por `visibilitychange`**                        | Evita perder una partida al cambiar de pestaña; el original no lo hacía y el `dt` cap solo mitigaba el salto                     |
| **Canvas lógico fijo 800×600 y escalado por CSS**                 | Mantiene intactas las constantes de velocidad y colisión del original                                                            |
| **Sin sonido ni táctil**                                          | Fuera del original; cada uno merece su propia spec                                                                               |

---

## Identified Risks

- **Doble montaje en React Strict Mode**: dos loops o listeners duplicados. Mitigación: `destroy()` idempotente que cancela el frame y quita listeners; criterio de aceptación explícito.
- **Callbacks obsoletos (stale closures)**: el juego se crea una vez y no vería estados nuevos de React. Mitigación: los callbacks solo escriben estado (`setScore`, etc.) y `user` se lee desde un `ref` actualizado en cada render.
- **Teclas capturadas globalmente**: `preventDefault` en flechas y espacio afectaría a formularios. Mitigación: los listeners existen solo mientras `GamePlayer` está montado y se ignoran eventos cuyo `target` sea `input`, `textarea` o `select`.
- **Foco en botones y `Espacio`**: pulsar PAUSAR y luego `Espacio` activaría el botón además de disparar. Mitigación: `preventDefault` en `Espacio` y hacer `blur()` del botón tras el clic.
- **Canvas escalado desenfoca el trazo**: a resoluciones bajas las líneas de 1.5 px se ven irregulares. Mitigación: aceptable en esta spec; ajuste de `devicePixelRatio` queda para una spec de pulido.
- **Ejecución en servidor**: acceder a `window`/`document` durante SSR rompe el build. Mitigación: el módulo solo toca el DOM dentro de `createAsteroids`, invocado desde `useEffect`.
- **Convención de Next 16**: `GamePlayer` es un Client Component dentro de una ruta con params asíncronos. Mitigación: consultar `node_modules/next/dist/docs/` antes de tocar `app/(app)/player/[id]/page.tsx` si hiciera falta modificarlo.

---

## What is **not** in this spec

- Tabla `scores` en Supabase, rankings globales o migración de `av_scores`.
- Controles táctiles, gamepad, sonido y música.
- Recolorear el juego con la paleta neón.
- Portar Tetris, Arkanoid u otros juegos (cada uno tendrá su spec).
- Actualizar `best`/`plays` o el Salón de la Fama con datos reales.
- Pruebas automatizadas.

Cada uno de estos, si se aborda, va en su propia spec.
