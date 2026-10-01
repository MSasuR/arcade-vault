# Controles táctiles para jugar en móvil

**State:** Implemented  
**Depends on:** SPEC 05 (Asteroids y `GamePlayer`), SPEC 07 (Tetris y contrato común `app/components/games/types.ts`), SPEC 08 (Breakout), SPEC 09 (Snake), SPEC 10 (HUD con selector de skin y `registry.ts` con `SKINNABLE`)  
**Date:** 2026-10-01  
**Objective:** Añadir a `GamePlayer` un mando virtual táctil, visible solo en dispositivos con puntero `coarse`, que envía eventos de teclado sintéticos para que Asteroids, Tetris, Breakout y Snake se jueguen en móvil, en vertical y en horizontal, sin modificar los módulos de los juegos.

---

## Scope

**Está incluido:**

- Hook `app/components/useCoarsePointer.ts` que indica si el puntero principal es táctil (`matchMedia("(pointer: coarse)")`) con `useSyncExternalStore` (en el servidor devuelve `false`, sin aviso de hidratación)
- Tipos `TouchButton` y `TouchLayout` y constantes de autorrepetido en `app/components/games/touch.ts`
- Mapa `TOUCH_LAYOUTS` en `app/components/games/registry.ts` con el mando de `asteroids`, `tetris`, `breakout` y `snake` (tablas del Data Model)
- Componente cliente `app/components/TouchPad.tsx` que dibuja un grupo de botones y, por cada uno, envía `keydown` al tocarlo y `keyup` al soltarlo con `window.dispatchEvent(new KeyboardEvent(...))`
- Multi-touch: varios botones pulsados a la vez (girar + empujar + disparar en Asteroids) con Pointer Events y `setPointerCapture`
- Autorrepetido emulado en los botones marcados `repeat`: tras 170 ms mantenido, `keydown` con `repeat: true` cada 50 ms hasta soltar
- Botón `REINICIAR` en el grupo de acciones de los juegos con `restart` (Tetris, Breakout y Snake, que reinician con `Enter`); sin efecto durante la partida, igual que la tecla
- Integración en `GamePlayer`: el `.crt` pasa a estar dentro de un contenedor `.player-stage`; con puntero `coarse`, juego jugable y layout definido, se renderizan los dos grupos (`move` a la izquierda, `actions` a la derecha)
- Layout responsive con `pointer: coarse`: en vertical, canvas arriba y los dos grupos debajo; en horizontal, grupos a los lados del canvas, que se ajusta a la altura disponible
- Compactación del reproductor con `pointer: coarse` (menos padding en `.av-player` y `.crt`; `.crt-bottom` oculto en horizontal) para que el canvas sea lo más grande posible
- Prevención de gestos del navegador en el mando: `touch-action: none`, sin selección de texto, sin menú contextual ni callout de pulsación larga; `touch-action: manipulation` en `.player-stage` contra el zoom por doble toque
- Liberación de todas las teclas mantenidas (`keyup`) al desmontar el mando, al ocultar la pestaña y con `pointercancel`
- Arreglo del scroll horizontal de ~77 px a 375 px (problema conocido del layout global) y eliminación de ese aviso en `CLAUDE.md`
- Verificación con Playwright en un contexto con emulación táctil (`hasTouch`, `isMobile`) a 375×667 y 667×375; capturas en `.playwright-screenshots/touch/`

**NO está incluido:**

- Gestos nativos en el canvas (swipe, tap para girar, arrastrar la pala de Breakout)
- Cambios en los módulos de los juegos (`app/components/games/<id>/`) o en `types.ts`
- Pantalla completa (Fullscreen API) y bloqueo de orientación
- Vibración háptica (`navigator.vibrate`)
- Interruptor para mostrar u ocultar el mando o preferencia en `localStorage`
- Gamepad físico (Gamepad API)
- Requisito de layout táctil en `.claude/skills/add-game/reference.md` para juegos nuevos
- Prueba manual en un dispositivo real como criterio de aceptación
- Mando para `galaga`, `frogger`, `pacman` y `duel` (sin módulo todavía)

---

## Data Model

No hay cambios de esquema ni de `localStorage`. Los módulos de los juegos y su contrato no cambian.

### Tipos del mando

```typescript
// app/components/games/touch.ts
export interface TouchButton {
  code: string; // KeyboardEvent.code que se envía ("ArrowLeft", "Space", "Enter", "KeyM"…)
  key: string; // KeyboardEvent.key equivalente ("ArrowLeft", " ", "Enter", "m")
  label: string; // texto visible del botón
  aria: string; // aria-label
  repeat?: boolean; // autorrepetido emulado mientras se mantiene
}

export interface TouchLayout {
  move: TouchButton[]; // grupo izquierdo
  moveShape: "row" | "dpad"; // fila de botones o cruceta en cruz
  actions: TouchButton[]; // grupo derecho
  restart: TouchButton | null; // botón REINICIAR; null si una acción ya reinicia
}

export const TOUCH_REPEAT_DELAY = 170; // ms hasta el primer repetido
export const TOUCH_REPEAT_INTERVAL = 50; // ms entre repetidos
```

```typescript
// app/components/games/registry.ts (añadido)
export const TOUCH_LAYOUTS: Readonly<Record<string, TouchLayout>>;
```

### Mando por juego

Mapeo 1:1 con las teclas que ya usa cada juego. "Mantener" = `keydown` al tocar y `keyup` al soltar, sin repetido (el juego lee el estado de la tecla).

| Juego       | `move` (`moveShape`)                                                       | `actions`                                        | `restart`                 |
| ----------- | -------------------------------------------------------------------------- | ------------------------------------------------ | ------------------------- |
| `asteroids` | `↺` `ArrowLeft`, `↻` `ArrowRight` (`row`, mantener)                        | `EMPUJE` `ArrowUp`, `DISPARO` `Space` (mantener) | `null` (DISPARO reinicia) |
| `tetris`    | `←` `ArrowLeft`, `↓` `ArrowDown`, `→` `ArrowRight` (`row`, `repeat: true`) | `GIRAR` `ArrowUp`, `CAÍDA` `Space` (un toque)    | `REINICIAR` `Enter`       |
| `breakout`  | `←` `ArrowLeft`, `→` `ArrowRight` (`row`, mantener)                        | `SONIDO` `KeyM` (un toque)                       | `REINICIAR` `Enter`       |
| `snake`     | `↑` `ArrowUp`, `←` `ArrowLeft`, `→` `ArrowRight`, `↓` `ArrowDown` (`dpad`) | ninguna                                          | `REINICIAR` `Enter`       |

`PAUSAR`/`REANUDAR` y `TERMINAR` siguen en el HUD; el mando no los duplica.

### Comportamiento de `TouchPad`

- Props: `buttons: TouchButton[]`, `shape: "row" | "dpad" | "actions"`, `side: "move" | "actions"`.
- `pointerdown`: `preventDefault`, `setPointerCapture`, `keydown` (`bubbles: true`, `cancelable: true`, `repeat: false`) y, si `repeat`, temporizador de repetido.
- `pointerup`, `pointercancel` y `lostpointercapture`: limpia el temporizador y envía `keyup`.
- Si varios dedos pulsan el mismo botón, el `keyup` se envía al soltar el último (contador de punteros por botón).
- Deslizar el dedo de un botón a otro no cambia de tecla (la captura mantiene el puntero en el primero).
- Estado visual con `data-pressed="true"` mientras hay al menos un puntero activo.
- Botones `type="button"` con `tabIndex={-1}`: nunca reciben foco, así que `Espacio` y las flechas del teclado siguen yendo al juego.
- Al desmontar y con `visibilitychange` (pestaña oculta) envía `keyup` de todas las teclas mantenidas.

### Layout del reproductor (`pointer: coarse`)

```
VERTICAL (375×667)                 HORIZONTAL (667×375)
┌ player-hud ─────────────┐        ┌ player-hud (compacto) ──────────────────┐
└─────────────────────────┘        └─────────────────────────────────────────┘
┌ crt ────────────────────┐        ┌ move ┐ ┌ crt ──────────────┐ ┌ actions ┐
│        canvas 4:3       │        │ [←]  │ │    canvas 4:3     │ │ [GIRAR] │
└─────────────────────────┘        │ [↓]  │ │ (alto disponible) │ │ [CAÍDA] │
┌ move ──────┐ ┌ actions ─┐        │ [→]  │ │                   │ │[REINIC.]│
│ [←][↓][→]  │ │ [GIRAR]  │        └──────┘ └───────────────────┘ └─────────┘
│            │ │ [CAÍDA]  │
└────────────┘ │[REINICIAR]│
               └──────────┘
```

- `.player-stage` con `grid-template-areas`: en vertical `"screen screen" "move actions"`; en horizontal `"move screen actions"` con columnas `auto 1fr auto`.
- En horizontal, el ancho del `.crt` se limita para que la altura del canvas quepa en la ventana: `width: min(100%, calc((100dvh - <alto del HUD y márgenes>) * 4 / 3))`.
- Clases nuevas en `app/globals.css`: `.player-stage`, `.player-stage.has-touch`, `.touch-pad`, `.touch-pad.dpad`, `.touch-btn`, `.touch-btn[data-pressed="true"]`. No se modifica ninguna regla existente fuera de bloques `@media (pointer: coarse)` y del arreglo del scroll horizontal.
- `.touch-btn`: área táctil mínima de 56×56 px (por encima de los 44 px de WCAG 2.5.5), borde `var(--line)`, texto `var(--ink)` en `var(--pixel)`, pulsado con `border-color: var(--cyan)` y glow cian; acciones en `var(--magenta)` para separarlas del movimiento.
- Sin `pointer: coarse` (escritorio), `.player-stage` no altera el layout actual.

## Implementation Plan

1. **Tipos, layouts y detección**

   - Crear `app/components/games/touch.ts` (`TouchButton`, `TouchLayout`, `TOUCH_REPEAT_DELAY`, `TOUCH_REPEAT_INTERVAL`)
   - Añadir `TOUCH_LAYOUTS` en `registry.ts` con los 4 juegos (tabla del Data Model)
   - Crear `app/components/useCoarsePointer.ts` con `useSyncExternalStore` sobre `matchMedia("(pointer: coarse)")` (`getServerSnapshot = false`, escucha `change`)
   - Nada visible cambia; `npx tsc --noEmit` y `npm run build` pasan

2. **Componente `TouchPad`**

   - `app/components/TouchPad.tsx` con el comportamiento del Data Model: envío de `keydown`/`keyup` en `window`, contador de punteros por botón, autorrepetido, liberación al desmontar y al ocultar la pestaña, `onContextMenu` con `preventDefault`
   - Aún no se monta en ninguna página; build y `npx eslint app lib` pasan

3. **Integración en `GamePlayer`**

   - Envolver `.crt` en `.player-stage` (con `has-touch` cuando se muestra el mando)
   - Si `useCoarsePointer()`, `factory` y `TOUCH_LAYOUTS[id]` existen: `TouchPad` `move` antes del `.crt` y `TouchPad` `actions` (acciones + `restart` si no es `null`) después
   - En escritorio el DOM visible y el aspecto no cambian (captura de `/player/tetris` a 1280 px igual que antes)

4. **Estilos táctiles y responsive**

   - Bloques `@media (pointer: coarse)`, `(pointer: coarse) and (orientation: portrait)` y `(pointer: coarse) and (orientation: landscape)` en `globals.css` con el layout del Data Model
   - Compactación de `.av-player`, `.crt` y `.player-hud`; `.crt-bottom` oculto en horizontal
   - `touch-action: none`, `user-select: none` y `-webkit-touch-callout: none` en `.touch-pad`; `touch-action: manipulation` en `.player-stage`

5. **Scroll horizontal a 375 px**

   - Medir qué elemento desborda (`scrollWidth` frente a `innerWidth`) en `/`, `/games`, `/salon` y `/player/<id>`
   - Arreglarlo en su origen en `globals.css` (candidato: `.av-mobile-panel` cerrado con `translateX(100%)`)
   - Quitar de `CLAUDE.md` la línea del problema conocido de ~77 px

6. **Verificación**
   - `npx tsc --noEmit`, `npx eslint app lib` y `npm run build`
   - Playwright con `npm run dev` en un contexto `hasTouch: true`, `isMobile: true`, a 375×667 y 667×375: toques con `page.touchscreen`/pointer events, un listener de prueba en `window` que cuenta `keydown`/`keyup` sintéticos, y capturas `.playwright-screenshots/touch/<id>-portrait.png` y `<id>-landscape.png` de los 4 juegos

## Acceptance Criteria

- [ ] `npx tsc --noEmit`, `npx eslint app lib` y `npm run build` terminan sin errores
- [ ] Ningún archivo de `app/components/games/asteroids/`, `tetris/`, `breakout/`, `snake/` ni `types.ts` cambia en el diff de esta spec
- [ ] En escritorio (Playwright sin `hasTouch`, 1280×800) no se muestra ningún `.touch-pad` y `/player/<id>` se ve igual que antes de la spec
- [ ] Con emulación táctil, `/player/asteroids`, `/player/tetris`, `/player/breakout` y `/player/snake` muestran exactamente los botones de la tabla "Mando por juego"
- [ ] Con emulación táctil, un juego sin módulo (p. ej. `/player/galaga`) no muestra el mando y conserva el placeholder `JUEGO AQUÍ`
- [ ] Tocar un botón envía un `keydown` con su `code` y soltarlo envía un `keyup` con el mismo `code` (contados con el listener de prueba)
- [ ] En Asteroids, mantener `↺` y `EMPUJE` a la vez y tocar `DISPARO` gira, acelera y dispara en el mismo intervalo (multi-touch)
- [ ] En Tetris, mantener `→` 500 ms genera 1 `keydown` sin `repeat` y al menos 6 con `repeat: true`; `GIRAR` y `CAÍDA` envían un único `keydown` por toque
- [ ] En Breakout, mantener `←` mueve la pala hasta soltar y `SONIDO` alterna el silencio
- [ ] En Snake, la cruceta empieza la partida (estado `ready`) y gira la serpiente; la reversa de 180° se sigue ignorando
- [ ] Tras `GAME OVER`, `REINICIAR` reinicia Tetris, Breakout y Snake, y `DISPARO` reinicia Asteroids; durante la partida `REINICIAR` no tiene efecto
- [ ] La puntuación se guarda igual que con teclado (solo con sesión y `score > 0`, una vez por partida)
- [ ] Si se desmonta el reproductor o se oculta la pestaña con un botón pulsado, se envía su `keyup` y ninguna tecla queda "pegada" al volver
- [ ] Tocar un botón del mando no le da el foco (`document.activeElement` no es un `.touch-btn`)
- [ ] Una pulsación larga sobre un botón no selecciona texto ni abre menú contextual, y un doble toque en `.player-stage` no hace zoom
- [ ] A 375×667 (vertical), el canvas ocupa el ancho del reproductor, los dos grupos quedan debajo y todos los botones miden al menos 56×56 px
- [ ] A 667×375 (horizontal), los grupos quedan a los lados del canvas y `.player-stage` completo (canvas y botones) cabe en 375 px de alto
- [ ] Girar el dispositivo (cambiar de 375×667 a 667×375) durante la partida reorganiza el layout sin reiniciar ni pausar el juego
- [ ] A 375 px, `document.documentElement.scrollWidth === window.innerWidth` en `/`, `/games`, `/salon` y `/player/<id>` (sin scroll horizontal)
- [ ] `CLAUDE.md` ya no menciona el scroll horizontal de ~77 px como problema conocido
- [ ] El selector de skin, `PAUSAR`/`REANUDAR` y `TERMINAR` siguen funcionando con emulación táctil
- [ ] Capturas en `.playwright-screenshots/touch/<id>-portrait.png` y `<id>-landscape.png` para los 4 juegos

## Decisions Taken and Discarded

| Decisión                                                                    | Razón                                                                                                                                             |
| --------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Mando virtual con eventos de teclado sintéticos**                         | Los 4 juegos ya escuchan `keydown`/`keyup` en `window` por `e.code`; el mando funciona sin tocar sus módulos ni el contrato                       |
| **Descartado: gestos nativos en el canvas**                                 | Obliga a ampliar el contrato y modificar los 4 módulos; queda para otra spec si el mando no basta                                                 |
| **Descartado: híbrido con arrastre de la pala en Breakout**                 | Mismo coste de tocar el módulo; los botones `←` `→` mantenidos cubren el control                                                                  |
| **Infraestructura y los 4 juegos en una sola spec**                         | Cada juego es solo una entrada de datos en `TOUCH_LAYOUTS`, sin lógica nueva                                                                      |
| **Detección por `pointer: coarse`, sin interruptor**                        | Tablets y móviles lo muestran; portátiles con pantalla táctil (puntero principal fino) no. Sin preferencia que persistir                          |
| **Descartado: detección por ancho de pantalla**                             | Una ventana estrecha de escritorio mostraría botones táctiles inútiles                                                                            |
| **Vertical y horizontal**                                                   | En vertical el canvas aprovecha el ancho; en horizontal el canvas es más grande y los pulgares quedan a los lados                                 |
| **Autorrepetido emulado (170 ms / 50 ms) solo en Tetris `←` `↓` `→`**       | Tetris mueve una celda por `keydown` y dependía del autorrepetido del sistema; los demás juegos leen la tecla mantenida o solo necesitan un toque |
| **Snake con cruceta en cruz y sin repetido**                                | La serpiente avanza sola; un toque por giro, igual que con teclado                                                                                |
| **Botón `REINICIAR` común que envía la tecla de reinicio del juego**        | El reinicio táctil no existía; reutiliza la lógica del juego (`Enter`), que ya ignora la tecla durante la partida                                 |
| **Asteroids sin `REINICIAR` (`restart: null`)**                             | Su tecla de reinicio es `Espacio`, la misma que `DISPARO`: un `REINICIAR` dispararía durante la partida. `DISPARO` ya reinicia tras `GAME OVER`   |
| **Descartado: tocar el canvas para reiniciar**                              | Riesgo de reiniciar sin querer al jugar                                                                                                           |
| **`PAUSAR` y `TERMINAR` solo en el HUD**                                    | Ya son botones táctiles; duplicarlos en el mando lo recarga                                                                                       |
| **Botones sin foco (`tabIndex={-1}`) en vez de `blur()` tras el clic**      | Con Pointer Events y `preventDefault` en `pointerdown` el foco nunca llega; mismo objetivo que el `blur()` de `PAUSAR` y del selector de skin     |
| **Sin deslizar el dedo entre botones**                                      | `setPointerCapture` evita `keyup` perdidos; deslizar para cambiar de dirección es una mejora de otra spec                                         |
| **Descartado: pantalla completa**                                           | iOS Safari no soporta la Fullscreen API fuera de vídeo; el layout compacto resuelve el espacio                                                    |
| **Descartado: vibración háptica**                                           | iOS no soporta `navigator.vibrate` y añade una preferencia más                                                                                    |
| **No se desactiva el zoom del viewport (`user-scalable`)**                  | Accesibilidad; basta con `touch-action` en el reproductor para evitar el zoom por doble toque al jugar                                            |
| **Arreglar el scroll horizontal a 375 px en esta spec**                     | Con el mando, un scroll horizontal accidental molesta al jugar; el arreglo es CSS acotado                                                         |
| **Arreglo en el origen del desbordamiento, no `overflow-x: hidden` global** | Ocultar el síntoma en `body` puede romper `position: sticky` y esconder desbordamientos futuros                                                   |
| **Verificación solo con Playwright y emulación táctil**                     | Decisión del usuario; la prueba en un móvil real no es criterio de aceptación                                                                     |
| **Sin requisito de layout táctil en `reference.md`**                        | Decisión del usuario; los juegos nuevos pueden añadir su entrada en `TOUCH_LAYOUTS`, pero `/add-game` no lo exige todavía                         |

---

## Identified Risks

- **Teclas "pegadas"**: un `keyup` perdido (dedo que sale de la pantalla, cambio de pestaña, navegación) deja la nave girando o la pala moviéndose. Mitigación: `setPointerCapture`, `pointercancel`/`lostpointercapture`, liberación al desmontar y en `visibilitychange`, y criterio de aceptación.
- **Eventos sintéticos y `isTrusted`**: los `KeyboardEvent` creados por código tienen `isTrusted = false`. Mitigación: ningún juego comprueba `isTrusted` hoy; el criterio de que los módulos no cambian lo mantiene así.
- **`preventDefault` del juego sobre el evento sintético**: no afecta al mando, porque el `pointerdown` ya llamó a `preventDefault` y el evento sintético no produce acción por defecto.
- **Emulación frente a dispositivo real**: Playwright no reproduce la latencia táctil ni los gestos del sistema (barra de Safari, deslizar para volver). Mitigación: `touch-action: none` en el mando y `100dvh` para la altura; queda aceptado al no haber prueba en dispositivo real.
- **Altura en horizontal**: con HUD + nav, el canvas puede quedar pequeño en móviles de 360 px de alto. Mitigación: HUD compacto y `.crt-bottom` oculto en horizontal; criterio de que `.player-stage` cabe en 375 px.
- **Regresión en escritorio**: el wrapper `.player-stage` podría cambiar el layout. Mitigación: estilos nuevos solo bajo `pointer: coarse` y captura de escritorio comparada.
- **Hidratación**: leer `matchMedia` en el render del servidor rompe la hidratación. Mitigación: `useSyncExternalStore` con `getServerSnapshot = false`; el mando aparece tras hidratar.
- **Origen del scroll horizontal desconocido**: el candidato es `.av-mobile-panel`, pero puede ser otro elemento. Mitigación: el paso 5 mide primero; el criterio es `scrollWidth === innerWidth` en las 4 rutas.

---

## What is **not** in this spec

- Gestos nativos en el canvas (swipe, tap, arrastrar la pala).
- Cambios en los módulos de los juegos o en `types.ts`.
- Pantalla completa, bloqueo de orientación y vibración háptica.
- Interruptor o preferencia guardada para el mando.
- Gamepad físico.
- Requisito táctil en `reference.md` para `/add-game` y `game-jam`.
- Prueba en un dispositivo real como criterio de aceptación.
- Mando para los juegos que aún no tienen módulo.

Cada uno de estos, si se aborda, va en su propia spec.
