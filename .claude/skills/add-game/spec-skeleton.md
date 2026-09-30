# Esqueleto de la spec generada por `/add-game`

Este archivo es la forma de la spec, **no texto para copiar tal cual**. Rellena cada `<…>` con datos reales del juego, añade los pasos y criterios específicos que surgieron en las preguntas y **elimina** lo que no aplique (p. ej. el paso de assets si el juego no tiene). Sin TODOs: si algo quedó sin decidir, vuelve a preguntar.

Reglas generales:

- Nombres concretos (rutas, claves, ids), no descripciones vagas.
- Una frase por idea. Sin código largo: solo fragmentos para ilustrar estructuras.
- Cada paso del plan deja el sistema funcionando y se puede commitear solo.
- Cada criterio de aceptación es booleano y verificable.
- Sigue el idioma, los encabezados y las palabras de estado de las specs existentes (español: `**State:** Draft`, `## Scope`, `## Data Model`, `## Implementation Plan`, `## Acceptance Criteria`, `## Decisions Taken and Discarded`, `## Identified Risks`, `## What is **not** in this spec`).

---

## Plantilla

````markdown
# <Juego> en la Plataforma

**State:** Draft  
**Depends on:** SPEC 04 (Supabase Auth, `useUser()`), SPEC 05 (módulo Asteroids y `GamePlayer`), SPEC 06 (tablas `games`/`scores` y ranking)<, SPEC NN si depende de otra>  
**Date:** <fecha leída del contexto de sesión>  
**Objective:** <Una sola frase: portar/crear <Juego> como módulo TypeScript montable en canvas y conectarlo a la plataforma con su leaderboard en `/player/<id>`.>

---

## Scope

**Está incluido:**

- Módulo del juego en `app/components/games/<id>/` escrito en TypeScript, sin variables globales de módulo ni acceso a `document`/`window` fuera de `create<Juego>`
- API pública `create<Juego>(canvas, callbacks): GameInstance`
- Lógica fiel a `references/started-games/<carpeta>/` <o: reglas descritas en la sección Data Model>
- Canvas lógico <W>×<H> y escalado por CSS
- Registro en `PLAYABLE` (`app/components/games/registry.ts`) con el id `<id>`
- HUD de React con <score / vidas / nivel / líneas según lo confirmado>
- Botón PAUSAR/REANUDAR funcional y tecla `P`; pausa automática al ocultar la pestaña
- Guardado de puntuación en `public.scores` al `GAME OVER` y en TERMINAR (solo con sesión y `score > 0`)
- <Fila en `public.games` mediante migración `<timestamp>_add_<id>_game.sql`, o: reutiliza la fila existente `<id>` (sin migración de alta)>
- <Portada `.cover-<id>` en `app/globals.css` creada con `/frontend-design`, o: reutiliza `cover-<clase>`>
- <Assets copiados a `public/games/<id>/` y sonido (si se confirmó)>
- <Paso 0, solo si `app/components/games/types.ts` no existe: contrato común `GameCallbacks`/`GameInstance` y refactor de Asteroids para usarlo>
- Documentar el juego y sus controles en `README.md`

**NO está incluido:**

- <Táctil, gamepad, multijugador, tema claro/oscuro del original… lo que el usuario descartó>
- Validación anti-trampas (el insert en `scores` es directo con RLS)
- Calcular `best` y `plays` desde `scores`
- Modificar el código dentro de `references/`
- Pruebas automatizadas (el repo no tiene framework de tests)

---

## Data Model

Contrato del módulo (definido en `app/components/games/types.ts`; ver `.claude/skills/add-game/reference.md`):

```typescript
export function create<Juego>(canvas: HTMLCanvasElement, callbacks: GameCallbacks): GameInstance;
```

Callbacks que emite este juego: `onScore`, `onGameOver`, `onPause` <y `onLives`, `onLevel`, `onLines` si aplican>.

Constantes portadas sin cambios: <lista con los valores reales del original>.

Convenciones:

- Origen del canvas arriba a la izquierda; tamaño lógico <W>×<H>.
- <Unidades de tiempo (px/s, dt en segundos con tope 0.05 s) y estados del juego, p. ej. `'playing' | 'paused' | 'gameover'`.>

Fila en `public.games` <solo si es nueva>:

```sql
insert into public.games (id, title, short_desc, long_desc, category, cover, color, best, plays, sort_order)
values ('<id>', '<TÍTULO> VAULT', '<corta>', '<larga>', '<CATEGORÍA>', 'cover-<id>', <null|'yellow'|'magenta'>, 0, 0, <siguiente sort_order>);
```

<Si no hay tablas ni migraciones nuevas, dilo explícitamente: "Se reutilizan `games`, `scores` y `leaderboard` de SPEC 06; no hay cambios de esquema".>

---

## Implementation Plan

<Numera los pasos de forma consecutiva. Omite los que no apliquen.>

0. **Contrato común** _(solo si `types.ts` no existe)_
   - Crear `app/components/games/types.ts` con `GameCallbacks`, `GameInstance` y `GameFactory`
   - Hacer que `registry.ts` y `asteroids/` usen los tipos comunes; `GamePlayer` muestra en el HUD solo las métricas que el juego emite
   - Asteroids sigue funcionando igual

1. **Esqueleto del módulo y registro**
   - Crear `app/components/games/<id>/types.ts` (si hace falta) e `index.ts` con `create<Juego>` que solo pinta el fondo y devuelve `pause/resume/getScore/destroy` vacíos
   - Registrar `<id>` en `PLAYABLE`
   - `/player/<id>` monta el canvas en negro; el resto de ids conserva el placeholder

2. **Entidades y utilidades**
   - `entities.ts` y `utils.ts` con las clases, funciones y constantes portadas, recibiendo `ctx` por parámetro
   - Sin uso todavía; `npm run build` compila

3. **Lógica de juego y loop**
   - Input con `preventDefault` solo en <teclas>, estado en el closure, loop con `requestAnimationFrame` y `dt` con tope
   - Emitir `onScore` <y `onLives`/`onLevel`/`onLines`> al cambiar y `onGameOver` una sola vez
   - Reinicio con <tecla> que reemite los valores iniciales
   - `destroy()` cancela el frame y quita los listeners

4. **Pausa**
   - `pause()`/`resume()` sin salto de `dt`, tecla `P`, `visibilitychange` y overlay `PAUSA` en el canvas; emitir `onPause`

5. **Assets y sonido** _(solo si hay)_
   - Copiar los archivos a `public/games/<id>/` y cargarlos dentro de `create<Juego>`
   - El audio solo suena tras una interacción; `destroy()` libera los recursos

6. **Integración en `GamePlayer`**
   - Verificar que `GamePlayer` monta el canvas con el tamaño lógico <W>×<H> y que el HUD refleja los callbacks reales
   - PAUSAR alterna `pause()`/`resume()`; comprobar en `npm run dev` (Strict Mode) que no quedan dos loops ni listeners duplicados

7. **Catálogo y portada**
   - <Migración de alta en `games` con `apply_migration`, `get_advisors` (security) y tipos regenerados, o: confirmar con `select` que la fila `<id>` ya existe>
   - <Clase `.cover-<id>` en `app/globals.css` usando `/frontend-design`, o: reutilizar `cover-<clase>`>
   - `/games` y `/` muestran el juego con su portada

8. **Guardado y ranking**
   - Verificar el guardado en `scores` con sesión (fila con `game_id = '<id>'`), sin duplicar con TERMINAR y sin escribir nada como invitado
   - Verificar que el juego aparece en `/salon` y `/games/<id>` con su ranking real

9. **Estilos**
   - Ajustar `.crt-screen canvas` si el tamaño lógico no es 800×600; sin cambiar variables existentes

10. **Documentación**
    - `README.md`: controles del juego y confirmación de que está en `PLAYABLE` y en `games`

---

## Acceptance Criteria

<Conserva los base que apliquen y añade los específicos del juego.>

- [ ] `npm run build` y `npm run lint` terminan sin errores <(el lint global falla por scripts sueltos de la raíz: verificar con `npx eslint app lib`)>
- [ ] `/player/<id>` muestra el canvas con el estado inicial del juego, sin errores en consola
- [ ] Los demás ids (p. ej. `/player/snake`) siguen mostrando el placeholder "JUEGO AQUÍ"
- [ ] <Las teclas confirmadas controlan el juego y la página no hace scroll al pulsarlas>
- [ ] <Reglas de puntuación verificables: "<evento> suma exactamente N puntos" y el HUD lo refleja de inmediato>
- [ ] <Condición de game over: aparece `GAME OVER` en el canvas con la puntuación final>
- [ ] `onGameOver` se emite una sola vez por partida
- [ ] <Tecla de reinicio> tras `GAME OVER` reinicia con los valores iniciales en el HUD
- [ ] PAUSAR congela el juego, el botón pasa a REANUDAR y REANUDAR continúa sin salto
- [ ] La tecla `P` alterna la pausa y cambiar de pestaña pausa el juego
- [ ] `public.games` contiene la fila `<id>` <y `games.cover` apunta a una clase CSS existente>
- [ ] Con sesión iniciada, llegar a `GAME OVER` con score > 0 inserta una fila en `scores` con `game_id = '<id>'`, el `user_id` del usuario y el score real
- [ ] Llegar a `GAME OVER` y pulsar TERMINAR no crea una segunda fila
- [ ] TERMINAR a mitad de partida con sesión y score > 0 guarda el score actual y navega a `/games/<id>`
- [ ] Como invitado, terminar una partida no inserta nada en `scores`
- [ ] `/salon` (pestaña `<Juego>`) y `/games/<id>` muestran el ranking real con la marca del usuario
- [ ] Salir de `/player/<id>` detiene el loop; no quedan listeners `keydown` del juego ni frames pendientes
- [ ] En `npm run dev` (Strict Mode) solo hay una instancia del juego activa
- [ ] A 375 px de ancho el canvas se ve completo, sin scroll horizontal
- [ ] <Assets: los archivos de `public/games/<id>/` cargan sin 404 y el sonido no suena antes de la primera interacción>
- [ ] `references/started-games/<carpeta>/` queda sin modificar

---

## Decisions Taken and Discarded

| Decisión       | Razón         |
| -------------- | ------------- |
| **<Decisión>** | <Razón breve> |

Incluye siempre, con su razón, las que correspondan:

- Módulo TypeScript con `create<Juego>` y contrato común (frente a iframe o pegar `game.js` con globals).
- Overlays y HUD: qué queda en el canvas y qué pasa a React.
- Fila nueva o reutilizada en `games`, y por qué.
- Portada nueva (con `/frontend-design`) o reutilizada.
- Sonido incluido o fuera, y control de silencio.
- Qué se descarta del original (tema claro/oscuro, `localStorage`, botón HTML de reiniciar).
- Canvas lógico fijo y escalado por CSS.
- Solo guardar con sesión y `score > 0`.
- Sin anti-trampas: insert directo con RLS (decisión de SPEC 06).
- <"Definición rápida sin aclaración detallada" si el usuario se saltó la Fase 3.>

---

## Identified Risks

<Solo los que apliquen. Base habitual:>

- **Doble montaje en React Strict Mode**: dos loops o listeners duplicados. Mitigación: `destroy()` idempotente y criterio de aceptación explícito.
- **Callbacks obsoletos**: los callbacks solo escriben estado y `user` se lee desde un `ref`.
- **Teclas capturadas globalmente**: `preventDefault` solo en las teclas del juego y se ignoran `input`/`textarea`/`select`.
- **Foco en botones y tecla de acción**: `preventDefault` en la tecla y `blur()` del botón tras el clic.
- **Ejecución en servidor**: el módulo solo toca `window`/`document` dentro de `create<Juego>`.
- **Sin fila en `games`**: el insert en `scores` falla por la FK; la migración se aplica antes de probar el guardado.
- **Canvas escalado desenfoca el trazo**: aceptable; el ajuste de `devicePixelRatio` queda para otra spec.
- **Score falso desde el cliente**: aceptado (SPEC 06).
- <Audio bloqueado hasta la primera interacción; carga de assets; canvas con proporción distinta a 4:3; etc.>

---

## What is **not** in this spec

- <Repite aquí, en una lista corta, lo que queda fuera del alcance.>

Cada uno de estos, si se aborda, va en su propia spec.
````
