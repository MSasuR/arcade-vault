# Juego Breakout (Arkanoid) en la Plataforma

**State:** Approved  
**Depends on:** SPEC 04 (Supabase Auth, hook `useUser()`), SPEC 05 (módulo Asteroids, registro `PLAYABLE` y `GamePlayer`), SPEC 06 (tablas `games`/`scores` y ranking), SPEC 07 (contrato común `app/components/games/types.ts` y HUD dinámico de `GamePlayer`)  
**Date:** 2026-09-30  
**Objective:** Portar el Arkanoid de `references/started-games/04-arkanoid` a un módulo TypeScript montable en canvas y conectarlo a `GamePlayer` (HUD, pausa, sonido, fin de partida, puntuación y leaderboard) en la ruta `/player/breakout`.

---

## Scope

**Está incluido:**

- Módulo del juego en `app/components/games/breakout/` escrito en TypeScript, sin variables globales de módulo ni acceso a `document`/`window` fuera de `createBreakout`
- API pública `createBreakout(canvas, callbacks): GameInstance` con `pause()`, `resume()`, `getScore()` y `destroy()`
- Lógica fiel al original: paleta, pelota, colisiones AABB con bloques (un bloque por frame), rebote en paredes y paleta, 3 vidas, 10 puntos por bloque, puntuación acumulada y 5 niveles con sus patrones y multiplicadores de velocidad
- Sprites del original: el spritesheet `spritesheet-breakout.png` (paleta, pelota, bloques de 7 colores y animación de explosión de 4 frames por bloque)
- Canvas lógico 800×600 (4:3), escalado por CSS; se mantiene el `.crt-screen` actual sin cambios de CSS
- Control con `←` `→` (400 px/s) y con el ratón (el movimiento sobre el canvas mueve la paleta, corrigiendo el escalado por CSS)
- HUD de React: Puntuación / Vidas / Nivel vía `onScore`, `onLives` y `onLevel`; se elimina el HUD dibujado en el canvas (Score, Nivel y pelotas de vida)
- Overlays `PAUSA`, `GAME OVER` y `¡COMPLETASTE EL JUEGO!` dibujados en el canvas; los dos últimos muestran la puntuación final y `ENTER PARA REINICIAR`
- Fin de partida: perder la última vida (`GAME OVER`) o limpiar el nivel 5 (victoria) emiten `onGameOver(score)` una sola vez
- Reinicio con `Enter` tras `GAME OVER` o victoria (el original no tenía reinicio)
- Botón PAUSAR/REANUDAR funcional, teclas `P` y `Escape`, y pausa automática al ocultar la pestaña
- Sonido: los 2 efectos del original (rebote y romper bloque) con tecla `M` para silenciar; sin errores si el navegador bloquea el audio
- Assets copiados a `public/games/breakout/` (spritesheet y sonidos) y cargados dentro de `createBreakout`
- Registro de `breakout` en `PLAYABLE` (`app/components/games/registry.ts`)
- Reutiliza la fila existente `breakout` de `public.games` (`BREAKOUT VAULT`, `PUZZLE`, `cover-bricks`, `sort_order` 8); **no hay migración de alta ni portada nueva**
- Guardado de puntuación en `public.scores` al fin de partida y en TERMINAR (solo con sesión y `score > 0`), con el flujo ya implementado en `GamePlayer`
- `preventDefault` en las teclas del juego para evitar el scroll de la página
- Limpieza completa de listeners (`window`, `document` y canvas), `requestAnimationFrame` y audio en `destroy()` (compatible con React Strict Mode)
- Documentar los controles en `README.md`

**NO está incluido:**

- Selector de nivel de la pausa (botones 1–5 con clic): era una ayuda de desarrollo y permitiría elegir el nivel en una plataforma con ranking
- Controles táctiles o gamepad
- Power-ups, nuevos niveles y mejoras de física (rebote según el lado del bloque, ángulo según el punto de impacto en la paleta): se portan las constantes y reglas tal cual
- Persistencia local de cualquier tipo
- Validación anti-trampas (el insert en `scores` es directo con RLS)
- Calcular `best` y `plays` de `games` desde `scores`
- Cambios en la fila `breakout` de `games` (textos, título y portada actuales)
- Modificar el código dentro de `references/`
- Pruebas automatizadas (el repo no tiene framework de tests)

---

## Data Model

No hay cambios de esquema. Se reutilizan `games`, `scores` y `leaderboard` de SPEC 06; `scores.game_id` apunta a la fila `breakout` que ya existe.

Contrato (definido en `app/components/games/types.ts` por SPEC 07; ver `.claude/skills/add-game/reference.md`):

```typescript
export function createBreakout(canvas: HTMLCanvasElement, callbacks: GameCallbacks): GameInstance;
```

Callbacks que emite Breakout: `onScore`, `onLives`, `onLevel`, `onGameOver` y `onPause`. No emite `onLines`. Emite los valores iniciales (`0`, `3`, `1`) al crearse y al reiniciar.

Registro:

```typescript
// app/components/games/registry.ts
export const PLAYABLE: Record<string, GameFactory> = {
  asteroids: createAsteroids,
  tetris: createTetris,
  breakout: createBreakout,
};
```

Archivos del módulo: `constants.ts` (constantes y regiones del spritesheet), `levels.ts` (los 5 patrones), `sprites.ts` (carga de la imagen y dibujo de sprites y explosiones), `audio.ts` (efectos y silencio) e `index.ts` (estado, input y loop).

Constantes portadas sin cambios: `PADDLE_SPEED = 400`, `BLOCK_COLS = 10`, `BLOCK_ROWS = 6`, `BLOCK_W = 64`, `BLOCK_H = 24`, `BLOCKS_ORIGIN_X = (800 − 10 × 64) / 2 = 80`, `BLOCKS_ORIGIN_Y = 80`, `BASE_BALL_VX = 200`, `BASE_BALL_VY = -300`, paleta `{ y: 560, w: 81, h: 14 }` (se dibuja el sprite de 162×14 a 81×14), pelota `16×16`, 10 puntos por bloque, `EXPLOSION_DURATION = 150` ms, 3 vidas y colores `['red', 'yellow', 'cyan', 'magenta', 'hotpink', 'green']`. Los 7 colores de bloque (incluido `gray`) y los 4 frames de explosión por color se portan con las mismas coordenadas del spritesheet (`gray` reutiliza los frames de `red`).

Niveles (`levels.ts`, cada bloque es `{ col, row, color }`):

| Nivel | Patrón                 | Bloques | Velocidad |
| ----- | ---------------------- | ------- | --------- |
| 1     | Parrilla completa 10×6 | 60      | ×1.00     |
| 2     | Pirámide centrada      | 40      | ×1.10     |
| 3     | Tablero de ajedrez     | 30      | ×1.21     |
| 4     | Filas con huecos       | 39      | ×1.33     |
| 5     | Marco + cruz central   | 39      | ×1.46     |

Assets (copiados de `references/started-games/04-arkanoid/assets/`):

| Origen                            | Destino                                          |
| --------------------------------- | ------------------------------------------------ |
| `assets/spritesheet-breakout.png` | `public/games/breakout/spritesheet-breakout.png` |
| `assets/sounds/ball-bounce.mp3`   | `public/games/breakout/sounds/ball-bounce.mp3`   |
| `assets/sounds/break-sound.mp3`   | `public/games/breakout/sounds/break-sound.mp3`   |

Convenciones:

- Origen del canvas arriba a la izquierda; tamaño lógico 800×600.
- Velocidades en px/s, `dt` en segundos y limitado a 0.05 s (el original no tenía tope).
- Estado de partida: `'playing' | 'paused' | 'gameover' | 'win'`, encapsulado en el closure de `createBreakout`.
- La lógica y el loop empiezan cuando el spritesheet termina de cargar (como en el original); los callbacks iniciales se emiten de inmediato.
- Teclas: `←` `→` mueven, `P` o `Escape` pausan, `M` silencia y `Enter` reinicia solo en `gameover` o `win`. `preventDefault` en `←`, `→` y en `Enter` durante `gameover`/`win`.
- Las teclas se leen con `e.code` (el original usaba `e.key`).
- El sonido se dispara con `play()` capturando el rechazo de la promesa; el estado "silenciado" se indica en el canvas con el texto `SILENCIO (M)` en una esquina solo mientras está activo.

---

## Implementation Plan

1. **Esqueleto del módulo y registro**

   - Crear `app/components/games/breakout/index.ts` con `createBreakout` que solo pinta el fondo negro y devuelve `pause/resume/getScore/destroy` vacíos
   - Registrar `breakout` en `PLAYABLE`
   - `/player/breakout` monta el canvas en negro; los demás ids (p. ej. `/player/snake`) conservan el placeholder

2. **Assets y sprites**

   - Copiar el spritesheet y los dos MP3 a `public/games/breakout/` (el directorio `references/` no se toca)
   - `constants.ts` con las constantes y las regiones del spritesheet; `sprites.ts` con la carga de la imagen dentro de `createBreakout`, `drawSprite` y `drawExplosion`, ignorando la carga si el juego ya se destruyó
   - Sin uso todavía; `npm run build` compila

3. **Niveles**

   - `levels.ts` con los 5 patrones y sus velocidades, generando bloques `{ col, row, color }` como el original
   - Sin uso todavía; se comprueba el número de bloques por nivel (60, 40, 30, 39, 39)

4. **Lógica de juego y loop**

   - `index.ts`: estado en el closure, paleta, pelota, colisiones, vidas, avance de nivel, explosiones y loop con `requestAnimationFrame` y `dt` con tope; el HUD del original no se dibuja
   - Emitir `onScore`, `onLives` y `onLevel` al cambiar y `onGameOver` una sola vez al perder la última vida o al limpiar el nivel 5
   - `Enter` en `gameover`/`win` reinicia y reemite score 0, vidas 3 y nivel 1
   - `destroy()` cancela el frame y quita los listeners

5. **Entrada de teclado y ratón**

   - Listeners de `keydown`/`keyup` en `window` con `preventDefault` en las teclas del juego e ignorando `input`, `textarea` y `select`
   - `mousemove` sobre el canvas con el escalado de `getBoundingClientRect`, eliminado en `destroy()`

6. **Pausa**

   - `pause()`/`resume()` sin salto de `dt`, overlay `PAUSA` en el canvas, teclas `P` y `Escape`, `visibilitychange` con la pestaña oculta; emitir `onPause`
   - La pausa no se activa en `gameover` ni en `win`

7. **Sonido**

   - `audio.ts`: carga de los dos efectos dentro de `createBreakout`, reproducción con captura del rechazo de `play()`, tecla `M` para silenciar y el texto `SILENCIO (M)` mientras está activo
   - `destroy()` libera los recursos de audio

8. **Integración en `GamePlayer`**

   - Comprobar que el canvas 800×600 de `/player/breakout` se encuadra en `.crt-screen` sin cambios de CSS y que el HUD muestra Puntuación / Vidas / Nivel reales (sin Líneas)
   - PAUSAR alterna `pause()`/`resume()` y su etiqueta cambia a REANUDAR
   - Comprobar en `npm run dev` (Strict Mode) que no quedan dos loops ni listeners duplicados

9. **Catálogo**

   - Confirmar con `select` a `public.games` (herramienta MCP `execute_sql`) que la fila `breakout` existe con `cover = 'cover-bricks'`; no se crea migración
   - `/games` y `/` ya muestran Breakout con su portada actual

10. **Guardado y ranking**

    - Verificar el guardado con sesión: partida hasta `GAME OVER` con score > 0 y fila en `scores` con `game_id = 'breakout'` (consulta con `execute_sql`)
    - Verificar que TERMINAR no duplica, que invitados no guardan y que la marca aparece en `/salon` (pestaña `BREAKOUT VAULT`) y `/games/breakout`
    - Borrar los datos de prueba al terminar

11. **Documentación**
    - `README.md`: tabla de controles de Breakout y nota de que `breakout` está en `PLAYABLE`, en `games` y usa assets de `public/games/breakout/`

---

## Acceptance Criteria

- [ ] `npm run build` termina sin errores y `npx eslint app lib` no reporta errores (el `npm run lint` global falla por scripts sueltos de la raíz que ya existían)
- [ ] `/player/breakout` muestra un canvas con 60 bloques de colores, la paleta abajo y la pelota sobre ella, sin errores en consola
- [ ] Los demás ids (p. ej. `/player/snake`) siguen mostrando el placeholder "JUEGO AQUÍ" con HUD Puntuación 0 / Vidas 3 / Nivel 1
- [ ] El HUD de `/player/breakout` muestra Puntuación, Vidas y Nivel, y no muestra Líneas; el canvas no dibuja Score, Nivel ni pelotas de vida
- [ ] `←` y `→` mueven la paleta a 400 px/s sin salirse del canvas, y la página no hace scroll al pulsarlas
- [ ] Mover el ratón sobre el canvas mueve la paleta, también con el canvas escalado por CSS (p. ej. a 375 px de ancho)
- [ ] Romper un bloque suma exactamente 10 puntos y el HUD lo refleja de inmediato
- [ ] Al romper un bloque se reproduce su animación de explosión de 4 frames (150 ms) con el color de ese bloque
- [ ] Si la pelota cae, las vidas del HUD bajan en 1 y la pelota reaparece sobre la paleta
- [ ] Los cinco niveles tienen 60, 40, 30, 39 y 39 bloques con sus patrones y multiplicadores de velocidad ×1.00, ×1.10, ×1.21, ×1.33 y ×1.46
- [ ] Al romper todos los bloques del nivel se carga el siguiente, el HUD muestra el nivel siguiente y la puntuación se conserva
- [ ] Al perder la última vida aparece `GAME OVER` con la puntuación final y `ENTER PARA REINICIAR`, y `onGameOver` se emite una sola vez
- [ ] Al limpiar el nivel 5 aparece `¡COMPLETASTE EL JUEGO!` con la puntuación final y `ENTER PARA REINICIAR`, y `onGameOver` se emite una sola vez
- [ ] `Enter` tras `GAME OVER` o tras la victoria reinicia con nivel 1, 3 vidas y puntuación 0 en el HUD; `Enter` durante la partida no hace nada
- [ ] PAUSAR congela el juego, muestra `PAUSA` en el canvas, el botón pasa a REANUDAR y REANUDAR continúa sin salto de posición
- [ ] Las teclas `P` y `Escape` alternan la pausa y cambiar de pestaña pausa el juego; el overlay de pausa no tiene botones de selección de nivel
- [ ] Rebotar en paredes y paleta reproduce el sonido de rebote y romper un bloque el de rotura
- [ ] `M` silencia y reactiva los efectos, y mientras está silenciado el canvas muestra `SILENCIO (M)`
- [ ] Si el navegador bloquea el audio, no hay errores sin capturar en consola y el juego sigue funcionando
- [ ] `public/games/breakout/` contiene el spritesheet y los dos MP3, y cargan sin 404
- [ ] `public.games` contiene la fila `breakout` con `cover = 'cover-bricks'` y no se creó ninguna migración nueva para el juego
- [ ] Con sesión iniciada, llegar al fin de partida con score > 0 inserta una fila en `scores` con `game_id = 'breakout'`, el `user_id` del usuario y el score real
- [ ] Llegar al fin de partida y pulsar TERMINAR no crea una segunda fila
- [ ] TERMINAR a mitad de partida con sesión y score > 0 guarda el score actual y navega a `/games/breakout`
- [ ] Como invitado, terminar una partida no inserta nada en `scores`
- [ ] `/salon` (pestaña `BREAKOUT VAULT`) y `/games/breakout` muestran el ranking real con la marca del usuario
- [ ] Salir de `/player/breakout` (TERMINAR, VOLVER A DETALLES o navegación del navegador) detiene el loop; no quedan listeners `keydown`, `keyup` ni `mousemove` del juego ni frames pendientes
- [ ] En `npm run dev` (Strict Mode) solo hay una instancia del juego activa
- [ ] A 375 px de ancho el canvas se ve completo (el desbordamiento horizontal del layout global no es de esta spec)
- [ ] `references/started-games/04-arkanoid/` queda sin modificar

---

## Decisions Taken and Discarded

| Decisión                                                       | Razón                                                                                                                                                      |
| -------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Reutilizar la fila `breakout` de `games`**                   | Arkanoid es un juego de romper ladrillos y `breakout` ya existe con portada `cover-bricks`; evita una migración y una portada nuevas                       |
| **Descartado: crear una fila `arkanoid` nueva**                | Dejaría dos juegos equivalentes en el catálogo, uno de ellos como placeholder                                                                              |
| **El módulo vive en `app/components/games/breakout/`**         | La carpeta sigue el `id` (clave de `PLAYABLE`, ruta `/player/breakout` y `game_id`); el nombre de la carpeta de referencia (`04-arkanoid`) no cambia el id |
| **Módulo TS con `createBreakout` y contrato común**            | Mismo patrón que Asteroids y Tetris; el contrato común de SPEC 07 cubre un juego con vidas y nivel sin más cambios                                         |
| **HUD de React; se elimina el del canvas**                     | `.player-hud` ya muestra Puntuación / Vidas / Nivel; duplicarlo en el canvas sería redundante, como se decidió en SPEC 05                                  |
| **Overlays `PAUSA`, `GAME OVER` y victoria en el canvas**      | Son feedback inmediato de la partida y no tienen lugar en el HUD de React                                                                                  |
| **Victoria = fin de partida con `onGameOver`**                 | La puntuación de una partida ganada debe entrar al ranking; sin ello, completar el juego no dejaría marca                                                  |
| **Reinicio con `Enter`**                                       | El original no tenía reinicio; `Enter` no choca con ninguna tecla de juego y es coherente con Tetris                                                       |
| **Ratón y teclado**                                            | Es el control original y el ratón es el más cómodo; el cálculo con `getBoundingClientRect` ya corrige el escalado por CSS                                  |
| **Sin selector de nivel en la pausa**                          | Es una ayuda de desarrollo: en una plataforma con ranking permitiría practicar o elegir niveles sin jugar los anteriores                                   |
| **Sonido incluido con tecla `M`**                              | Es parte del original (SPEC 03 de Arkanoid); el silencio evita molestar y los MP3 se sirven desde `public/games/breakout/`                                 |
| **Indicador `SILENCIO (M)` dibujado en el canvas**             | El HUD de React no tiene control de silencio; es un texto mínimo que solo aparece mientras el sonido está desactivado                                      |
| **`play()` con captura del rechazo**                           | Los navegadores bloquean el audio antes de una interacción; el original no lo manejaba y produciría errores sin capturar                                   |
| **Assets en `public/games/breakout/`**                         | Son estáticos servidos por Next y accesibles con rutas absolutas `/games/breakout/…`                                                                       |
| **Spritesheet original en lugar de dibujo vectorial**          | Conserva el aspecto de Arkanoid; recolorear o redibujar con la paleta neón sería otra spec                                                                 |
| **Lógica y loop empiezan al cargar el spritesheet**            | Es el comportamiento original y evita jugar con una pantalla vacía; `destroy()` ignora la carga si ya se desmontó                                          |
| **`dt` con tope 0.05 s y teclas con `e.code`**                 | Convenciones de la plataforma (Asteroids y Tetris); el tope evita saltos de la pelota al volver de una pestaña oculta                                      |
| **Física del original intacta**                                | La inversión de `vy` al tocar un bloque y el rebote plano en la paleta son parte del juego original; cambiarlos cambia la jugabilidad y es otra spec       |
| **`preventDefault` en `←`, `→` y en `Enter` (fin de partida)** | El original no lo hacía; evita el scroll horizontal y la activación accidental de botones enfocados                                                        |
| **Solo guardar con sesión y `score > 0`**                      | Coincide con SPEC 05 y 06; los invitados no guardan                                                                                                        |
| **Sin anti-trampas**                                           | Insert directo con RLS, decisión de SPEC 06                                                                                                                |

---

## Identified Risks

- **Dependencia de SPEC 07 sin fusionar**: el contrato común (`types.ts`) y el HUD dinámico de `GamePlayer` viven en la rama `spec-07-tetris-game`. Mitigación: mezclar esa rama en `main` antes de implementar esta spec, o crear la rama nueva a partir de ella.
- **Doble montaje en React Strict Mode**: dos loops, listeners o cargas de imagen duplicados. Mitigación: `destroy()` idempotente que cancela el frame, quita listeners y descarta la carga pendiente; criterio de aceptación explícito.
- **Carga asíncrona del spritesheet**: si el usuario sale antes de que cargue, el `onload` dispara sobre un juego destruido. Mitigación: bandera `destroyed` comprobada en el `onload` y en el loop.
- **Audio bloqueado por el navegador**: `play()` rechaza la promesa antes de una interacción. Mitigación: captura del rechazo y criterio de aceptación sin errores sin capturar.
- **Ratón con canvas escalado por CSS**: sin corrección la paleta iría desfasada. Mitigación: conversión con `getBoundingClientRect` y criterio de aceptación a 375 px.
- **Callbacks obsoletos**: los callbacks solo escriben estado y `user` se lee desde un `ref` en `GamePlayer`.
- **Teclas capturadas globalmente**: `preventDefault` en flechas y `Enter` afectaría a formularios. Mitigación: los listeners existen solo con `GamePlayer` montado y se ignoran eventos con `target` `input`, `textarea` o `select`.
- **Foco en botones y `Enter`**: pulsar PAUSAR y luego `Enter` activaría el botón además de reiniciar. Mitigación: `preventDefault` en `Enter` durante `gameover`/`win` y `blur()` del botón tras el clic.
- **Un bloque por frame y rebote plano**: la pelota puede atravesar bloques a velocidades altas (nivel 5 ≈ ×1.46). Mitigación: se conserva por fidelidad; el tope de `dt` limita el desplazamiento por frame y mejorar la colisión es otra spec.
- **`Escape` fuera de pantalla completa**: el navegador puede consumir `Escape` al salir de pantalla completa. Mitigación: `P` sigue disponible como alternativa.
- **Ejecución en servidor**: acceder a `window`/`document`/`Image`/`Audio` durante SSR rompe el build. Mitigación: el módulo solo los usa dentro de `createBreakout`, invocado desde `useEffect`.
- **Convención de Next 16**: `GamePlayer` es un Client Component dentro de una ruta con params asíncronos y los estáticos de `public/` se sirven desde la raíz. Mitigación: leer `node_modules/next/dist/docs/` antes de tocar rutas si hiciera falta.
- **Lint global roto por archivos ajenos**: los scripts `test-*.js` de la raíz fallan en `npm run lint`. Mitigación: los criterios usan `npx eslint app lib`.

---

## What is **not** in this spec

- Selector de nivel de la pausa, power-ups y niveles nuevos.
- Mejoras de física (rebote por lado del bloque, ángulo según el punto de impacto en la paleta).
- Controles táctiles o gamepad.
- Persistencia local, validación anti-trampas y cálculo de `best`/`plays` desde `scores`.
- Cambios en la fila `breakout` de `games` o en su portada.
- Recolorear o redibujar los sprites con la paleta neón.
- Portar otros juegos (cada uno tendrá su spec).
- Pruebas automatizadas.

Cada uno de estos, si se aborda, va en su propia spec.
