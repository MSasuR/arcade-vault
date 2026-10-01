---
name: add-game
description: Diseña la spec para llevar un juego a Arcade Vault con su leaderboard. Parte de una carpeta de references/started-games o de una idea nueva, hace las preguntas propias de un juego y guarda specs/NN-<juego>.md en estado Draft para ejecutarla después con /spec-impl. No escribe código.
disable-model-invocation: true
argument-hint: "<juego en references/started-games (p. ej. 03-tetris) o idea de juego nuevo>"
allowed-tools: Read, Glob, Grep, Write, AskUserQuestion, Bash(ls:*), Bash(cat:*), Bash(date:*), mcp__supabase__execute_sql
---

# /add-game — Spec para integrar un juego en la plataforma

## Contexto de la sesión

Fecha de hoy (úsala en la cabecera de la spec, nunca la adivines):
!`date +%F`

Specs que ya existen:
!`ls specs/ 2>/dev/null || echo "La carpeta specs/ no existe todavía"`

Juegos de referencia disponibles:
!`ls references/started-games 2>/dev/null || echo "No existe references/started-games"`

Módulos de juego ya integrados (`app/components/games/`):
!`ls app/components/games 2>/dev/null || echo "No existe app/components/games"`

---

Esta skill convierte un juego (de `references/started-games/` o una idea nueva) en una **spec lista para `/spec-impl`**. Cubre el camino completo que ya recorrieron las specs 05 (Asteroids) y 06 (leaderboard y tabla `games`): módulo TypeScript montable en canvas, registro en `PLAYABLE`, HUD de React, fila en `public.games`, guardado en `public.scores` y ranking.

**No escribes código del juego aquí.** Tu trabajo es entender el juego, hacer las preguntas que faltan y dejar una spec sin ambigüedades. Las respuestas del usuario mandan; no decidas por él.

El argumento recibido es: `$ARGUMENTS`

## Archivos de apoyo

Lee ambos antes de preguntar:

- `reference.md` (en el mismo directorio que esta skill): el contrato técnico del módulo, las reglas de portado, la integración con la BD y la portada. **Cítalo en la spec** en lugar de volver a explicarlo.
- `spec-skeleton.md` (en el mismo directorio): la estructura de la spec que vas a generar, con el plan y los criterios de aceptación base.

## Flujo

Sigue las cuatro fases en orden. Tus respuestas van en el idioma del argumento; la spec, en el de las specs existentes del repo (español).

### Fase 1 — Contexto del proyecto

1. Lee `CLAUDE.md` o `AGENTS.md`, el primero que exista.
2. Lee `reference.md` y `spec-skeleton.md`.
3. Lee las specs 05 y 06 de `specs/` si necesitas el detalle; ya son el ejemplo de referencia de esta skill. Toma de la spec más reciente el idioma, los encabezados y las palabras de estado (`Draft`, `Approved`…).
4. Comprueba el estado actual de la plataforma:
   - ¿Existe `app/components/games/types.ts` con el contrato común (`GameCallbacks`, `GameInstance`)? Si no existe, la spec incluirá el **paso 0** (generalizar el contrato y refactorizar Asteroids) y lo registrarás en el alcance y en las decisiones.
   - Consulta los ids de `public.games` con `mcp__supabase__execute_sql`, **solo `select`**: `select id, title, category, cover, sort_order from public.games order by sort_order;`. Nunca ejecutes escrituras desde esta skill.

### Fase 2 — Identificar el origen del juego

Si el argumento está vacío, pide una descripción del juego en una frase y espera. Si no cabe en una frase, sugiere dividirlo.

**Caso A — el argumento corresponde a una carpeta de `references/started-games/`.** Acepta el nombre completo (`03-tetris`), el número (`03`), el slug (`tetris`) o una ruta. Si hay varias coincidencias o ninguna, muestra las opciones y pregunta. Si la encuentras:

1. Lee `CLAUDE.md`, `README.md`, `index.html` y **todos** los `.js`. Lista `assets/` si existe (no leas binarios).
2. Redacta un inventario breve para el usuario con lo que encontraste y lo que hay que reescribir al portarlo:
   - tamaño del canvas y si hay más de uno (p. ej. vista previa de la pieza siguiente);
   - estado del juego, constantes y reglas de puntuación;
   - vidas, nivel, líneas u otras métricas que hoy salen en un HUD HTML;
   - dependencias del DOM (`getElementById`, overlays, botones, toggles de tema);
   - listeners (`document`/`window`) y si se limpian;
   - `Audio`, `Image` u otros assets y su ruta;
   - persistencia (`localStorage`);
   - condición de game over y cómo se reinicia;
   - si es "más puntuación es mejor".
3. **No modifiques nada dentro de `references/`.** Es solo lectura.

**Caso B — es una idea nueva.** No hay inventario; en la Fase 3 pregunta mecánica, controles, reglas de puntuación y condición de fin.

### Fase 3 — Preguntas

Haz las preguntas en bloques de 3 a 5 con `AskUserQuestion` (ponla primero la opción recomendada, etiquetada). Espera la respuesta de cada bloque. No preguntes lo que el inventario o el repo ya responden.

Categorías obligatorias:

- **Identidad del juego:** `id` (kebab-case, será la ruta `/games/<id>` y `/player/<id>` y la clave de `PLAYABLE`), título, descripción corta y larga, categoría (`ACCIÓN`, `PUZZLE`, `DEPORTES`, `RETRO`) y `color` opcional.
- **Fila en `games`:** si el `id` ya existe en la consulta de la Fase 1, **no hay `insert`**. Si hay un juego equivalente con otro id (Arkanoid ↔ `breakout`), pregunta si se reutiliza esa fila o se crea una nueva. Si es nuevo, `sort_order` será el siguiente libre; `best` y `plays` se siembran estáticos (como decidió la spec 06).
- **HUD y callbacks:** qué callbacks emite el juego (`onScore` y `onGameOver` siempre; `onLives`, `onLevel`, `onLines` solo si aplican) y qué queda dibujado dentro del canvas (pieza siguiente, contador de powerups, overlay de game over).
- **Controles:** teclas, cuáles hacen `preventDefault`, y cómo se reinicia tras `GAME OVER`.
- **Canvas:** tamaño lógico fijo y relación de aspecto.
- **Assets y sonido:** los assets se copian a `public/games/<id>/` y se cargan dentro de `createX`. Pregunta si el sonido se incluye y si necesita control de silencio; la spec 05 lo dejó fuera, así que debe ser una decisión explícita por juego.
- **Portada:** `games.cover` es una clase CSS. La spec incluirá crear `.cover-<id>` en `app/globals.css` siguiendo las portadas existentes y **usando `/frontend-design`**, como exige `CLAUDE.md`. Pregunta solo si el usuario quiere una portada concreta o prefiere reutilizar una.
- **Ranking:** confirma que más puntuación es mejor. Un juego donde un valor menor es mejor (tiempo, golpes) requiere otra spec: díselo y déjalo fuera.
- **Fuera de alcance:** táctil, gamepad, multijugador, tema claro/oscuro del original, y cualquier cosa que el usuario descarte.

**Cuándo parar de preguntar:** cuando puedas responder sin suponer nada qué archivos aparecen o cambian, cuál es el primer y el último paso ejecutable, y cómo se verifica que el juego está terminado. Si falta algo, sigue preguntando.

Si una respuesta abre un tema grande (p. ej. "y también modo dos jugadores"), dile que merece su propia spec y pregunta si queda fuera.

### Fase 4 — Escribir y guardar la spec

Con toda la información, **escribe la spec completa y guárdala directamente**, sin confirmar sección por sección, sin mostrar un borrador y sin pedir permiso para el nombre del archivo. Solo si falta información, desarróllala por secciones con confirmación.

1. Calcula el número siguiente con el listado de `specs/` (máximo existente + 1, dos dígitos).
2. Slug: `<id>-game` en kebab-case (p. ej. `07-tetris-game.md`), salvo que el usuario pida otro.
3. Construye el contenido desde `spec-skeleton.md`: rellena cabecera, alcance, modelo de datos, plan y criterios con los datos reales del juego, añade los pasos o criterios específicos que surgieron y elimina los que no apliquen (p. ej. el paso de assets si no hay).
4. Cabecera: estado `Draft` (o la palabra equivalente de las specs existentes), `Depends on` con las specs realmente existentes (verifica que cada una esté en `specs/`; no dejes referencias colgantes), la fecha leída del contexto de sesión, y un objetivo de **una sola frase**.
5. Si el archivo ya existe, pregunta antes de sobrescribirlo.
6. Confirma al usuario:
   - la ruta del archivo creado;
   - que la spec está en `Draft` y debe pasarla a `Approved` él mismo tras leerla;
   - el siguiente paso: `/spec-impl-game NN-slug` (implementa la spec y después lanza en secuencia `skin-designer` y `mobile-porter`);
   - **y detente.** No propongas implementar ni escribas código.

## Reglas duras

- **Nunca escribas código del juego.** Solo el `.md` de la spec.
- **Nunca modifiques `references/`** ni las specs existentes.
- **Nunca marques la spec como `Approved`.** Eso lo hace el usuario.
- **Nunca propongas implementar la spec después de guardarla.** Tu trabajo termina al escribir el archivo.
- **No supongas decisiones que el usuario no confirmó.** Pregunta en la Fase 3.
- **No repitas en la Fase 4 lo ya respondido en la Fase 3.**
- **Desde esta skill, Supabase es solo lectura.** Las migraciones las aplica `/spec-impl`.
- Si el juego es demasiado grande (no cabe en una frase, toca más de tres áreas del sistema o exige decisiones en cuatro o más dominios), propón dividirlo en varias specs antes de seguir.
- Si el usuario quiere saltarse la Fase 3, recuérdale que las preguntas ahorran horas después; si insiste, respétalo y déjalo anotado en la sección de decisiones ("Definición rápida sin aclaración detallada").

## Tono al preguntar

Directo y concreto. Sin disculpas ni rodeos. Numera las preguntas y ofrece de 2 a 4 opciones con tu recomendación primero y una razón breve.
