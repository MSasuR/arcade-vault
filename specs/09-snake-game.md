# Juego Snake en la Plataforma

**State:** Approved  
**Depends on:** SPEC 04 (Supabase Auth, hook `useUser()`), SPEC 05 (módulo Asteroids, registro `PLAYABLE` y `GamePlayer`), SPEC 06 (tablas `games`/`scores` y ranking), SPEC 07 (contrato común `app/components/games/types.ts` y HUD dinámico de `GamePlayer`), SPEC 08 (patrón de assets en `public/games/<id>/` y carga de sprites)  
**Date:** 2026-09-30  
**Objective:** Crear el juego Snake como módulo TypeScript montable en canvas, usando las frutas pixel-art de `references/started-games/05-snake/fruits.png`, y conectarlo a `GamePlayer` (HUD, pausa, fin de partida, puntuación y leaderboard) en la ruta `/player/snake`.

---

## Scope

**Está incluido:**

- Módulo del juego en `app/components/games/snake/` escrito en TypeScript, sin variables globales de módulo ni acceso a `document`/`window` fuera de `createSnake`
- API pública `createSnake(canvas, callbacks): GameInstance` con `pause()`, `resume()`, `getScore()` y `destroy()`
- **Juego nuevo**: la carpeta de referencia solo aporta assets (`fruits.png` y `sprites.js`); las reglas, la puntuación y los controles se definen en esta spec (ver Data Model)
- Tablero de 20×15 celdas de 40 px en un canvas lógico 800×600 (4:3), escalado por CSS; se mantiene el `.crt-screen` actual sin cambios de CSS
- La serpiente se dibuja en el canvas con bloques pixel-art de paleta neón (cabeza `--cyan` con ojos y cuerpo en degradado a `--green`); no hay sprites de serpiente en los assets
- Frutas: las 22 de la fila pixel-art del atlas de `sprites.js`; cada fruta nueva es una al azar (distinta de la anterior) y todas valen lo mismo
- Copia de `fruits.png` sin modificar a `public/games/snake/fruits.png` y atlas portado a TypeScript (`atlas.ts`), sin `window.SPRITE_ATLAS`
- Fin de partida: chocar con la pared o con el propio cuerpo termina con `GAME OVER`; ocupar todo el tablero es victoria; ambos emiten `onGameOver(score)` una sola vez
- Puntuación: 10 puntos por fruta; nivel cada 5 frutas con aumento de velocidad
- HUD de React: Puntuación / Nivel vía `onScore` y `onLevel` (sin Vidas ni Líneas)
- Controles: `←` `↑` `→` `↓` y `W` `A` `S` `D`; sin reversa de 180°; cola de 2 giros; la serpiente espera la primera tecla para empezar a moverse
- Overlays `PAUSA`, `GAME OVER`, `¡TABLERO COMPLETO!` y el aviso `PULSA UNA FLECHA PARA EMPEZAR` dibujados en el canvas; los dos de fin muestran la puntuación final y `ENTER PARA REINICIAR`
- Reinicio con `Enter` tras `GAME OVER` o victoria
- Botón PAUSAR/REANUDAR funcional, teclas `P` y `Escape`, y pausa automática al ocultar la pestaña
- Registro de `snake` en `PLAYABLE` (`app/components/games/registry.ts`)
- Reutiliza la fila existente `snake` de `public.games` (`SNAKE VAULT`, `PUZZLE`, `cover-snake`, `sort_order` 3); **no hay migración de alta ni portada nueva**
- Guardado de puntuación en `public.scores` al fin de partida y en TERMINAR (solo con sesión y `score > 0`), con el flujo ya implementado en `GamePlayer`
- `preventDefault` en las flechas (y en `Enter` durante `gameover`/`win`) para evitar el scroll y la activación accidental de botones
- Limpieza completa de listeners, `requestAnimationFrame` y carga de imagen en `destroy()` (compatible con React Strict Mode)
- Documentar controles, reglas y atribución de las frutas en `README.md`

**NO está incluido:**

- Sonido y música (la carpeta no trae audio)
- Controles táctiles o gamepad
- Obstáculos, power-ups, frutas con valores distintos y modos de juego
- Récord local (`localStorage`) y cualquier persistencia fuera de `scores`
- Las otras dos filas del atlas (estilo plano y estilo realista)
- Recortar o modificar `fruits.png`
- Validación anti-trampas (el insert en `scores` es directo con RLS)
- Calcular `best` y `plays` de `games` desde `scores`
- Cambios en la fila `snake` de `games` (textos y portada actuales)
- Modificar el código dentro de `references/`
- Pruebas automatizadas (el repo no tiene framework de tests)

---

## Data Model

No hay cambios de esquema. Se reutilizan `games`, `scores` y `leaderboard` de SPEC 06; `scores.game_id` apunta a la fila `snake` que ya existe.

Contrato (definido en `app/components/games/types.ts` por SPEC 07; ver `.claude/skills/add-game/reference.md`):

```typescript
export function createSnake(canvas: HTMLCanvasElement, callbacks: GameCallbacks): GameInstance;
```

Callbacks que emite Snake: `onScore`, `onLevel`, `onGameOver` y `onPause`. No emite `onLives` ni `onLines`. Emite los valores iniciales (`0` y `1`) al crearse y al reiniciar.

Registro:

```typescript
// app/components/games/registry.ts
export const PLAYABLE: Record<string, GameFactory> = {
  asteroids: createAsteroids,
  tetris: createTetris,
  breakout: createBreakout,
  snake: createSnake,
};
```

Archivos del módulo: `constants.ts` (constantes y paleta), `atlas.ts` (coordenadas de las frutas), `sprites.ts` (carga de la imagen y dibujo de frutas), `logic.ts` (reglas puras), `render.ts` (dibujo) e `index.ts` (estado, input y loop).

Estado y tipos del juego:

```typescript
interface Cell {
  x: number;
  y: number;
} // columna 0–19, fila 0–14
type Dir = "up" | "down" | "left" | "right";
type State = "ready" | "playing" | "paused" | "gameover" | "win";
// snake: Cell[] con la cabeza en el índice 0; fruit: { cell: Cell; name: FruitName }
```

Reglas del juego (definidas en esta spec):

- Tablero `COLS = 20`, `ROWS = 15`, `CELL = 40` (600 celdas en total: 300).
- La serpiente empieza con 3 segmentos: cabeza en `(10, 7)` y cuerpo en `(9, 7)` y `(8, 7)`, orientada a la derecha, y no se mueve en estado `ready`.
- La primera tecla de dirección válida (todas salvo `←`, que sería una reversa) pasa a `playing`.
- Velocidad: `pasosPorSegundo = min(16, 8 + (nivel − 1))`; el intervalo de paso es `1 / pasosPorSegundo` segundos y se acumula con `dt` limitado a 0.05 s.
- Comer una fruta suma 10 puntos, añade un segmento (la cola no se retira en ese paso) y genera una fruta nueva en una celda libre.
- `nivel = floor(frutasComidas / 5) + 1`; el nivel 1 va a 8 pasos/s y el 9 o superior a 16.
- Una dirección nueva se ignora si es la opuesta a la última dirección encolada o igual a ella; la cola admite como máximo 2 giros pendientes y se consume uno por paso.
- Colisión: la nueva cabeza fuera del tablero o sobre un segmento del cuerpo termina la partida; la celda de la cola se considera libre en ese paso salvo que coma.
- Victoria: la serpiente ocupa las 300 celdas.
- La fruta nueva nunca coincide con la fruta anterior (mismo nombre) ni aparece sobre la serpiente.

Atlas (`atlas.ts`, de `references/started-games/05-snake/sprites.js`, fila pixel-art, hoja de 3790×442 px con fondo transparente): 22 entradas `{ x, y, w, h }` con `y = 136` y `h = 160`: `banana`, `orange`, `grape`, `garlic`, `eggplant`, `strawberry`, `cherry`, `carrot`, `mushroom`, `broccoli`, `watermelon`, `pepper`, `kiwi`, `lemon`, `peach`, `peanut`, `apple`, `tomato`, `berries`, `grapes2`, `pineapple` y `melon`, con las mismas coordenadas del original. Cada fruta se dibuja centrada en su celda con su proporción original y un alto de 36 px.

Assets:

| Origen                                         | Destino                         |
| ---------------------------------------------- | ------------------------------- |
| `references/started-games/05-snake/fruits.png` | `public/games/snake/fruits.png` |

Paleta del tablero: fondo `#000`, cuadrícula `rgba(255,255,255,0.06)` (`--line-2`), cabeza `#00f5ff` (`--cyan`), cuerpo interpolado hasta `#00ff88` (`--green`), ojos `#0a0a0f` (`--bg`) y texto `#e6e9ff` (`--ink`). Los hex son fijos porque el canvas no lee variables CSS.

Convenciones:

- Origen del canvas arriba a la izquierda; tamaño lógico 800×600 y el tablero ocupa todo el canvas.
- Tiempo en segundos: `dt` limitado a 0.05 s y acumulador de pasos.
- Teclas (`e.code`): `ArrowUp/Down/Left/Right` y `KeyW/KeyA/KeyS/KeyD` mueven, `KeyP` o `Escape` pausan y `Enter` reinicia solo en `gameover` o `win`. `preventDefault` en las flechas y en `Enter` durante `gameover`/`win`.
- La lógica y el loop empiezan cuando la imagen termina de cargar; los callbacks iniciales se emiten de inmediato.

---

## Implementation Plan

1. **Esqueleto del módulo y registro**

   - Crear `app/components/games/snake/index.ts` con `createSnake` que solo pinta el fondo negro y devuelve `pause/resume/getScore/destroy` vacíos
   - Registrar `snake` en `PLAYABLE`
   - `/player/snake` monta el canvas en negro; los demás ids (p. ej. `/player/galaga`) conservan el placeholder

2. **Assets y atlas**

   - Copiar `fruits.png` a `public/games/snake/` (el directorio `references/` no se toca)
   - `atlas.ts` con las 22 frutas y `sprites.ts` con la carga cancelable de la imagen dentro de `createSnake` y `drawFruit`, ignorando la carga si el juego ya se destruyó
   - Sin uso todavía; `npm run build` compila

3. **Constantes y lógica pura**

   - `constants.ts` con la cuadrícula, la velocidad, los puntos y la paleta
   - `logic.ts` con las funciones puras: creación de la serpiente inicial, cálculo de la nueva cabeza, aplicación de un giro con cola de 2 y sin reversa, colisión, elección de celda libre y de fruta distinta de la anterior, nivel y velocidad
   - Sin acceso al DOM; se comprueba con un script de Node

4. **Render**

   - `render.ts`: cuadrícula, serpiente (degradado y ojos orientados según la dirección), fruta y overlays `PAUSA`, `GAME OVER`, `¡TABLERO COMPLETO!` y `PULSA UNA FLECHA PARA EMPEZAR`, recibiendo `ctx` por parámetro
   - Sin uso todavía; `npm run build` compila

5. **Lógica de juego, input y loop**

   - `index.ts`: estado en el closure, acumulador de pasos, input en `window` con `preventDefault` en flechas e ignorando `input`, `textarea` y `select`, y loop con `requestAnimationFrame` y `dt` con tope
   - Emitir `onScore` y `onLevel` al cambiar y `onGameOver` una sola vez al chocar o completar el tablero
   - `Enter` en `gameover`/`win` reinicia y reemite score 0 y nivel 1
   - `destroy()` cancela el frame y la carga y quita los listeners

6. **Pausa**

   - `pause()`/`resume()` sin salto de `dt`, overlay `PAUSA`, teclas `P` y `Escape`, `visibilitychange` con la pestaña oculta; emitir `onPause`
   - La pausa no se activa en `ready`, `gameover` ni `win`

7. **Integración en `GamePlayer`**

   - Comprobar que el canvas 800×600 de `/player/snake` se encuadra en `.crt-screen` sin cambios de CSS y que el HUD muestra Puntuación / Nivel reales (sin Vidas ni Líneas)
   - PAUSAR alterna `pause()`/`resume()` y su etiqueta cambia a REANUDAR
   - Comprobar en `npm run dev` (Strict Mode) que no quedan dos loops ni listeners duplicados

8. **Catálogo**

   - Confirmar con `select` a `public.games` (herramienta MCP `execute_sql`) que la fila `snake` existe con `cover = 'cover-snake'`; no se crea migración
   - `/games` y `/` ya muestran Snake con su portada actual

9. **Guardado y ranking**

   - Verificar el guardado con sesión: partida hasta `GAME OVER` con score > 0 y fila en `scores` con `game_id = 'snake'` (consulta con `execute_sql`)
   - Verificar que TERMINAR no duplica, que invitados no guardan y que la marca aparece en `/salon` (pestaña `SNAKE VAULT`) y `/games/snake`
   - Borrar los datos de prueba al terminar

10. **Documentación**
    - `README.md`: tabla de controles y reglas de Snake, nota de que `snake` está en `PLAYABLE`, en `games` y usa `public/games/snake/fruits.png`, y atribución de las frutas (según el comentario de `sprites.js`: The Spriters Resource, Google Snake)

---

## Acceptance Criteria

- [ ] `npm run build` termina sin errores y `npx eslint app lib` no reporta errores (el `npm run lint` global falla por scripts sueltos de la raíz que ya existían)
- [ ] `/player/snake` muestra el canvas 800×600 con la serpiente de 3 segmentos (cabeza en la columna 10, fila 7), una fruta y `PULSA UNA FLECHA PARA EMPEZAR`, sin errores en consola
- [ ] Los demás ids aún sin módulo (p. ej. `/player/galaga`) siguen mostrando el placeholder "JUEGO AQUÍ" con HUD Puntuación 0 / Vidas 3 / Nivel 1
- [ ] El HUD de `/player/snake` muestra Puntuación y Nivel, y no muestra Vidas ni Líneas
- [ ] La serpiente no se mueve hasta pulsar una dirección válida; `←` al empezar (reversa) no la inicia
- [ ] `←` `↑` `→` `↓` y `W` `A` `S` `D` cambian la dirección, y la página no hace scroll al pulsar las flechas
- [ ] Una dirección opuesta a la actual se ignora, y con dos giros pulsados dentro de un mismo paso ambos se aplican en pasos consecutivos (la cola admite 2)
- [ ] Comer una fruta suma exactamente 10 puntos, alarga la serpiente en 1 segmento y el HUD lo refleja de inmediato
- [ ] La fruta nueva nunca aparece sobre la serpiente ni es la misma fruta que la anterior, y siempre es una de las 22 del atlas
- [ ] Cada fruta se ve con su sprite pixel-art completo y proporcionado dentro de su celda
- [ ] El nivel sube en 1 cada 5 frutas y el HUD lo refleja; la velocidad pasa de 8 pasos/s en el nivel 1 a +1 por nivel con tope de 16
- [ ] Chocar con el borde o con el propio cuerpo muestra `GAME OVER` con la puntuación final y `ENTER PARA REINICIAR`
- [ ] Mover la cabeza a la celda que acaba de dejar libre la cola no cuenta como choque (salvo que coma)
- [ ] Ocupar las 300 celdas muestra `¡TABLERO COMPLETO!` y emite `onGameOver` una sola vez
- [ ] `onGameOver` se emite una sola vez por partida
- [ ] `Enter` tras `GAME OVER` o tras la victoria reinicia con serpiente de 3 segmentos, score 0 y nivel 1 en el HUD; `Enter` durante la partida no hace nada
- [ ] PAUSAR congela el juego, muestra `PAUSA` en el canvas, el botón pasa a REANUDAR y REANUDAR continúa sin salto de posición
- [ ] Las teclas `P` y `Escape` alternan la pausa y cambiar de pestaña pausa el juego
- [ ] `public/games/snake/fruits.png` existe, es idéntico a `references/started-games/05-snake/fruits.png` y carga sin 404
- [ ] `public.games` contiene la fila `snake` con `cover = 'cover-snake'` y no se creó ninguna migración nueva para el juego
- [ ] Con sesión iniciada, llegar al fin de partida con score > 0 inserta una fila en `scores` con `game_id = 'snake'`, el `user_id` del usuario y el score real
- [ ] Llegar al fin de partida y pulsar TERMINAR no crea una segunda fila
- [ ] TERMINAR a mitad de partida con sesión y score > 0 guarda el score actual y navega a `/games/snake`
- [ ] Como invitado, terminar una partida no inserta nada en `scores`
- [ ] `/salon` (pestaña `SNAKE VAULT`) y `/games/snake` muestran el ranking real con la marca del usuario
- [ ] Salir de `/player/snake` (TERMINAR, VOLVER A DETALLES o navegación del navegador) detiene el loop; no quedan listeners `keydown` del juego ni frames pendientes
- [ ] En `npm run dev` (Strict Mode) solo hay una instancia del juego activa
- [ ] A 375 px de ancho el canvas se ve completo (el desbordamiento horizontal del layout global no es de esta spec)
- [ ] `references/started-games/05-snake/` queda sin modificar

---

## Decisions Taken and Discarded

| Decisión                                                     | Razón                                                                                                                              |
| ------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------- |
| **Juego nuevo con los assets de la carpeta**                 | `05-snake` solo trae `fruits.png` y `sprites.js`; no hay lógica que portar, así que las reglas se definen aquí                     |
| **Reutilizar la fila `snake` de `games`**                    | Ya existe con portada `cover-snake`; evita una migración y una portada nuevas                                                      |
| **Módulo TS con `createSnake` y contrato común**             | Mismo patrón que Asteroids, Tetris y Breakout; el contrato de SPEC 07 cubre un juego sin vidas (`onScore`, `onLevel`)              |
| **Tablero 20×15 con celdas de 40 px**                        | Encaja exacto en el canvas 800×600 (4:3) y en el `.crt-screen` sin tocar CSS; las celdas grandes permiten ver bien las frutas      |
| **Descartado: 26×20 con celdas de 30 px**                    | Frutas más pequeñas y menos legibles para un campo más grande                                                                      |
| **Pared o cuerpo = GAME OVER; tablero lleno = victoria**     | Snake clásico (el de Google, del que vienen las frutas); la victoria también es fin de partida para que la marca llegue al ranking |
| **Descartado: paredes atravesables (toroidal)**              | Partidas menos clásicas y más largas; cambia la dificultad del juego original                                                      |
| **10 puntos por fruta y nivel cada 5 frutas**                | Sin vidas, el nivel es la progresión visible; la velocidad 8→16 pasos/s mantiene la jugabilidad                                    |
| **Descartado: velocidad constante y puntos × nivel**         | Constante no da progresión; puntos × nivel dispersa las marcas y complica comparar partidas                                        |
| **Fruta aleatoria de las 22, todas valen lo mismo**          | Aprovecha todo el atlas sin tabla de valores; distinta de la anterior para que se note el cambio                                   |
| **Solo la fila pixel-art del atlas**                         | Es la única que mapea `sprites.js` y casa con la estética pixel-art de la serpiente y la plataforma                                |
| **Serpiente en bloques pixel-art con paleta neón**           | No hay sprites de serpiente; los bloques casan con las frutas pixel-art y con las variables `--cyan` y `--green` de la plataforma  |
| **Cola de 2 giros y sin reversa, y espera la primera tecla** | Evita muertes por pulsaciones rápidas y por arrancar antes de reaccionar; es el comportamiento habitual de los Snake modernos      |
| **Flechas y WASD**                                           | Cubre ambos hábitos de teclado; ninguna de las dos teclas choca con la pausa ni el reinicio                                        |
| **Reinicio con `Enter`**                                     | Coherente con Tetris y Breakout; no choca con ninguna tecla de juego                                                               |
| **Copiar `fruits.png` completo y portar el atlas a TS**      | Las coordenadas de `sprites.js` siguen siendo válidas y el original no se toca; el peso (585 KB) es aceptable                      |
| **Descartado: recortar la fila pixel-art a un PNG nuevo**    | Modifica el asset y sus coordenadas, y necesita una herramienta de imagen no disponible en el repo                                 |
| **`dt` con tope 0.05 s y acumulador de pasos**               | El intervalo mínimo de paso es 0.0625 s (16 pasos/s), así que con el tope nunca hay más de un paso por frame                       |
| **Lógica y loop empiezan al cargar la imagen**               | Mismo criterio que Breakout: evita jugar con el tablero sin frutas; `destroy()` descarta la carga pendiente                        |
| **Sin sonido, táctil, obstáculos ni récord local**           | Fuera del alcance; la carpeta no trae audio y cada uno merece su propia spec                                                       |
| **Solo guardar con sesión y `score > 0`**                    | Coincide con SPEC 05 y 06; los invitados no guardan                                                                                |
| **Sin anti-trampas**                                         | Insert directo con RLS, decisión de SPEC 06                                                                                        |

---

## Identified Risks

- **Licencia de las frutas**: `sprites.js` indica que la imagen viene de The Spriters Resource (Google Snake) y son gráficos de terceros. Mitigación: se atribuye en el `README.md`; conviene revisar el uso permitido antes de publicar el proyecto.
- **Doble montaje en React Strict Mode**: dos loops, listeners o cargas de imagen duplicados. Mitigación: `destroy()` idempotente que cancela el frame, quita listeners y descarta la carga pendiente; criterio de aceptación explícito.
- **Carga asíncrona de una imagen de 585 KB**: si el usuario sale antes de que cargue, el `onload` dispara sobre un juego destruido; si es lenta, el tablero queda vacío un momento. Mitigación: bandera `destroyed` comprobada en el `onload`, y mensaje de error en el canvas si la carga falla.
- **Giros perdidos o reversa accidental**: pulsar dos teclas seguidas en un mismo paso puede matar a la serpiente. Mitigación: cola de 2 giros y rechazo de la reversa, con criterios de aceptación.
- **Celda de la cola al avanzar**: tratar la cola como ocupada mataría al jugador de forma injusta. Mitigación: la cola se libera en cada paso salvo que coma, con criterio de aceptación.
- **Fruta sobre la serpiente con el tablero casi lleno**: escoger una celda al azar puede tardar. Mitigación: se elige entre la lista de celdas libres, no por reintento.
- **Atlas con coordenadas del original**: si `fruits.png` cambia, las coordenadas dejan de valer. Mitigación: se copia sin modificar y `atlas.ts` conserva las mismas cifras.
- **Callbacks obsoletos**: los callbacks solo escriben estado y `user` se lee desde un `ref` en `GamePlayer`.
- **Teclas capturadas globalmente**: `preventDefault` en flechas y `Enter` afectaría a formularios. Mitigación: los listeners existen solo con `GamePlayer` montado y se ignoran eventos con `target` `input`, `textarea` o `select`.
- **Foco en botones y `Enter`**: pulsar PAUSAR y luego `Enter` activaría el botón además de reiniciar. Mitigación: `preventDefault` en `Enter` durante `gameover`/`win` y `blur()` del botón tras el clic.
- **Ejecución en servidor**: acceder a `window`/`document`/`Image` durante SSR rompe el build. Mitigación: el módulo solo los usa dentro de `createSnake`, invocado desde `useEffect`.
- **Convención de Next 16**: `GamePlayer` es un Client Component dentro de una ruta con params asíncronos. Mitigación: leer `node_modules/next/dist/docs/` antes de tocar rutas si hiciera falta.
- **Lint global roto por archivos ajenos**: los scripts `test-*.js` de la raíz fallan en `npm run lint`. Mitigación: los criterios usan `npx eslint app lib`.

---

## What is **not** in this spec

- Sonido, música, controles táctiles y gamepad.
- Obstáculos, power-ups, frutas con valores distintos y modos de juego.
- Las filas plana y realista del atlas, y recortar o modificar `fruits.png`.
- Récord local, validación anti-trampas y cálculo de `best`/`plays` desde `scores`.
- Cambios en la fila `snake` de `games` o en su portada.
- Portar otros juegos (cada uno tendrá su spec).
- Pruebas automatizadas.

Cada uno de estos, si se aborda, va en su propia spec.
