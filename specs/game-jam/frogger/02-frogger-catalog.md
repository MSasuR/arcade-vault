# Catálogo y Portada de Frogger

**State:** Draft  
**Depends on:** `game-jam/frogger/01-frogger-game` (módulo `createFrogger` e id `frogger`), SPEC 06 (tabla `games`, FK de `scores.game_id` y ranking)  
**Date:** 2026-09-30  
**Objective:** Dejar la fila existente `frogger` de `public.games` apuntando a una portada nueva `.cover-frogger` que represente el juego real, para que aparezca así en `/`, `/games`, `/games/frogger` y `/salon`.

---

## Scope

**Está incluido:**

- Revisión de la fila `frogger` de `public.games` (ya existe: no hay migración de alta)
- Migración `supabase/migrations/20260930150000_update_frogger_cover.sql` con un `update` que solo cambia `cover` de `cover-rana` a `cover-frogger`
- Aplicación con la herramienta MCP `apply_migration`, revisión con `get_advisors` (security) y regeneración de tipos con `generate_typescript_types` en `lib/supabase/database.types.ts`
- Portada nueva `.cover-frogger` en `app/globals.css`, junto a las demás portadas `.cover-*` (bloque "Cover art generators", líneas 643–802), diseñada con `/frontend-design`
- Verificación visual en `/` (vista previa de los 6 primeros juegos: `frogger` tiene `sort_order` 4), `/games` (incluido el filtro `ACCIÓN`), `/games/frogger` y `/salon`, con capturas en `.playwright-screenshots/`
- Nota en `README.md` de que `frogger` usa la portada `cover-frogger`

**NO está incluido:**

- El módulo del juego, el registro en `PLAYABLE` y el guardado (spec `01-frogger-game`)
- Cambiar `title`, `short_desc`, `long_desc`, `category`, `color`, `best`, `plays` o `sort_order` de la fila `frogger`
- Modificar o borrar `.cover-rana` ni ninguna otra portada existente
- Cambiar variables de color de `:root` o los componentes de las tarjetas (`Library`, `MiniCard`, `GameDetail`, `HallOfFame`)
- Calcular `best` y `plays` desde `scores`
- Políticas RLS nuevas (la lectura pública de `games` ya existe y no hay escritura desde el cliente)

---

## Data Model

No hay tablas ni columnas nuevas y no hay alta: solo se actualiza la columna `cover` de una fila existente (esquema de `supabase/migrations/20260930120000_create_games.sql`).

Estado actual de la fila (consulta `select id, title, short_desc, long_desc, category, cover, color, best, plays, sort_order from public.games where id = 'frogger';` del 2026-09-30):

| Columna      | Valor                                                                                                                             |
| ------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| `id`         | `frogger`                                                                                                                         |
| `title`      | `FROGGER VAULT`                                                                                                                   |
| `short_desc` | `Cruza el camino sin ser atropellado`                                                                                             |
| `long_desc`  | `Ayuda a la rana a cruzar carreteras llenas de tráfico y ríos caudalosos. Cada salto cuenta. Llega al lado opuesto sano y salvo.` |
| `category`   | `ACCIÓN`                                                                                                                          |
| `cover`      | `cover-rana`                                                                                                                      |
| `color`      | `magenta`                                                                                                                         |
| `best`       | `156780`                                                                                                                          |
| `plays`      | `1847`                                                                                                                            |
| `sort_order` | `4`                                                                                                                               |

Revisión de los textos: `short_desc` y `long_desc` describen exactamente el juego de la spec 01 (carretera, río, cruzar al lado opuesto) y el título ya sigue el formato `NOMBRE VAULT` de la plataforma, así que **no se cambian**. `category = 'ACCIÓN'` coincide con la decisión de la spec 01 y `best`/`plays` siguen siendo estáticos (SPEC 06).

Migración `supabase/migrations/20260930150000_update_frogger_cover.sql` (timestamp posterior a `20260930140000_add_abyss_game.sql` de `game-jam/abyss`, para no colisionar si esa spec se aplica antes):

```sql
-- Frogger (game-jam): portada propia que representa el juego jugable
update public.games
   set cover = 'cover-frogger'
 where id = 'frogger';
```

- El `update` afecta exactamente a 1 fila y no toca ninguna otra columna.
- Revertir es `update public.games set cover = 'cover-rana' where id = 'frogger';` (la clase `.cover-rana` se conserva).

Portada `.cover-frogger` (en `app/globals.css`, debajo de `.cover-rana`), diseñada con `/frontend-design`:

- **Concepto:** el tablero de Frogger visto de arriba y partido en horizontal: arriba el río con troncos y tortugas y la orilla con casillas, en el centro la mediana con la rana neón, abajo la carretera con coches. Debe leerse igual en la tarjeta 4:3 de `/games`, en la mini-tarjeta de 200 px de alto de `/` y en la ficha 16:10 de `/games/frogger`, por lo que todas las medidas van en porcentajes.
- **Fondo (`.cover-frogger`):** `linear-gradient(180deg, …)` con cuatro bandas de corte duro: orilla `var(--bg-2)` (0–12 %), río `#001f2a` (12–48 %), mediana `var(--bg-3)` (48–60 %) y carretera `var(--bg)` (60–100 %). `#001f2a` es el mismo tono de río que usa el canvas del juego.
- **`::before` (río y orilla):** 5 casillas en la orilla con `linear-gradient(var(--magenta), var(--magenta))` como corchetes de 2 px de grosor; 2–3 troncos `var(--bronze)` de bordes redondeados (`radial-gradient` en los extremos) en dos franjas del río; y 2 grupos de 3 tortugas `var(--cyan)` como `radial-gradient` circulares. `filter: drop-shadow(0 0 6px rgba(0, 245, 255, 0.4))`.
- **`::after` (carretera y rana):** marcas de carril discontinuas con `repeating-linear-gradient(90deg, rgba(255, 255, 255, 0.06) …)` (`--line-2`); 3 coches como rectángulos `var(--yellow)`, `var(--magenta)` y `var(--cyan)` en carriles distintos; y la rana en la mediana, centrada, con `radial-gradient` `var(--green)` para el cuerpo y dos puntos `var(--bg)` para los ojos. `filter: drop-shadow(0 0 8px rgba(0, 255, 136, 0.5))`, igual que `.cover-rana`.
- **Colores:** solo variables de `:root` (`--bg`, `--bg-2`, `--bg-3`, `--line-2`, `--green`, `--magenta`, `--cyan`, `--yellow`, `--bronze`) salvo `#001f2a`, ya usado por `.cover-rana`.
- **Sin cambios** en `.cover-bg`, en las portadas existentes ni en las variables.

---

## Implementation Plan

1. **Comprobación previa**

   - Confirmar con `select` (herramienta MCP `execute_sql`) que la fila `frogger` sigue con los valores de la tabla del Data Model y que no existe ya una migración `*_frogger*` en `supabase/migrations/`
   - Comprobar con `ls supabase/migrations/` que `20260930150000` es posterior a la última migración aplicada

2. **Portada**

   - Invocar `/frontend-design` para diseñar `.cover-frogger` con el concepto, las capas y los colores del Data Model
   - Añadir la clase en `app/globals.css` debajo de `.cover-rana`, sin tocar otras portadas
   - La clase aún no se usa; `npm run build` compila

3. **Migración**

   - Crear `supabase/migrations/20260930150000_update_frogger_cover.sql` con el `update` del Data Model
   - Aplicarla con `apply_migration` y comprobar con `select cover from public.games where id = 'frogger';` que devuelve `cover-frogger`
   - Ejecutar `get_advisors` (security) y confirmar que no hay avisos nuevos (el de `public.rls_auto_enable()` ya existía)
   - Regenerar `lib/supabase/database.types.ts` con `generate_typescript_types` (no se espera diff: no cambia el esquema)

4. **Verificación visual**

   - Con `npm run dev`, capturar con Playwright `/`, `/games`, `/games` con el filtro `ACCIÓN`, `/games/frogger` y `/salon` (pestaña `FROGGER VAULT`) en `.playwright-screenshots/`
   - Repetir `/`, `/games` y `/games/frogger` a 375 px de ancho

5. **Documentación**
   - `README.md`: nota de que `frogger` usa la portada `cover-frogger` y de que `cover-rana` queda sin uso en el catálogo

---

## Acceptance Criteria

- [ ] `supabase/migrations/20260930150000_update_frogger_cover.sql` existe y solo contiene el `update` de `cover` de la fila `frogger`
- [ ] `select id, title, short_desc, long_desc, category, cover, color, best, plays, sort_order from public.games where id = 'frogger';` devuelve `frogger`, `FROGGER VAULT`, los mismos `short_desc` y `long_desc`, `ACCIÓN`, `cover-frogger`, `magenta`, `156780`, `1847` y `4`
- [ ] Las otras 7 filas de `public.games` no cambian (mismos `cover` y `sort_order`)
- [ ] `app/globals.css` define `.cover-frogger` (con `::before` y `::after`) y `games.cover` de `frogger` apunta a esa clase
- [ ] `.cover-rana` y el resto de portadas `.cover-*` y variables de `:root` quedan sin cambios
- [ ] La portada muestra orilla con 5 casillas, río con troncos y tortugas, la rana verde en la mediana y la carretera con coches, usando solo variables de `:root` y `#001f2a`
- [ ] La portada se ve en `/` (mini-tarjeta de la vista previa), en `/games` (tarjeta 4:3) y en `/games/frogger` (ficha 16:10) sin recortes de la rana ni de las casillas
- [ ] `/salon` muestra la pestaña `FROGGER VAULT` con su ranking (la pantalla no pinta portadas)
- [ ] A 375 px de ancho la portada se ve completa en `/`, `/games` y `/games/frogger` (el desbordamiento horizontal del layout global no es de esta spec)
- [ ] El filtro `ACCIÓN` de `/games` incluye `FROGGER VAULT` con su portada nueva
- [ ] `get_advisors` (security) no muestra avisos nuevos
- [ ] `lib/supabase/database.types.ts` se regeneró y no tiene cambios de tipos
- [ ] Un insert en `scores` con `game_id = 'frogger'` no falla por la FK (la fila existe antes y después de esta spec)
- [ ] `npm run build` termina sin errores y `npx eslint app lib` no reporta errores
- [ ] Las capturas de verificación están en `.playwright-screenshots/`
- [ ] `references/` queda sin modificar

---

## Decisions Taken and Discarded

| Decisión                                                                | Razón                                                                                                                                       |
| ----------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| **Reutilizar la fila `frogger` sin migración de alta**                  | Ya existe con id, título, categoría y textos correctos; la FK de `scores` funciona desde el primer día                                      |
| **Descartado: fila nueva con otro id**                                  | Duplicaría el juego en el catálogo y dejaría `frogger` como placeholder                                                                     |
| **Mantener `short_desc`, `long_desc`, `color` y `sort_order`**          | Los textos describen el juego de la spec 01 y `color = 'magenta'` ya da la etiqueta de la tarjeta; cambiarlos no aporta nada                |
| **Descartado: reescribir `long_desc` con las reglas (casillas, mosca)** | La ficha no es un manual; los controles y reglas van en `README.md` y en la franja de ayuda del canvas                                      |
| **Portada nueva `.cover-frogger`**                                      | `.cover-rana` son rayas cian y un círculo verde: no distingue carretera, río ni casillas, y el juego jugable tiene una composición concreta |
| **Descartado: mantener `cover-rana`**                                   | Es la opción sin coste, pero la portada no representa el juego y sería la única de un juego jugable que no se parece a su canvas            |
| **Descartado: rediseñar `.cover-rana` en su sitio (sin migración)**     | `reference.md` §7 prohíbe cambiar portadas existentes y la clase viene de la plantilla de diseño (`references/templates/`)                  |
| **Migración de `update` versionada**                                    | El catálogo vive en la base de datos y todo cambio pasa por `supabase/migrations/`; es reversible con otro `update`                         |
| **Timestamp `20260930150000`**                                          | Posterior a `20260930140000_add_abyss_game.sql` (otra spec del game-jam en `Draft`), para que ambas se puedan aplicar sin colisión          |
| **Conservar `.cover-rana` en el CSS**                                   | Permite revertir con un `update`; eliminar CSS sin uso es otra spec                                                                         |
| **Medidas en porcentajes y solo variables de `:root`**                  | La portada se pinta en tres contenedores de proporciones distintas (4:3, 16:10 y 200 px de alto) y así sigue la paleta de la plataforma     |
| **Diseño con `/frontend-design`**                                       | Lo exige `CLAUDE.md` para cualquier interfaz, incluidas las portadas                                                                        |

---

## Identified Risks

- **Orden de aplicación entre 01 y 02**: si esta spec se aplica antes que la 01, `/games/frogger` muestra la portada nueva pero `/player/frogger` aún enseña el placeholder. Mitigación: es un estado válido; las dos specs son independientes y la fila existe en ambos casos.
- **FK de `scores` al probar el juego**: no aplica, porque la fila `frogger` existe antes de esta spec. Mitigación: criterio de aceptación que lo comprueba.
- **Clase CSS inexistente**: si la migración se aplica antes de desplegar `.cover-frogger`, las tarjetas quedan sin portada. Mitigación: el plan añade la clase (paso 2) antes de aplicar la migración (paso 3).
- **Colisión de timestamps con otras specs del game-jam**: dos migraciones con el mismo prefijo romperían el orden. Mitigación: comprobación previa con `ls supabase/migrations/` y timestamp posterior a `20260930140000`.
- **Portada ilegible a 200 px**: demasiados elementos pueden emborronarse en la mini-tarjeta. Mitigación: medidas en porcentajes, pocos objetos por carril y verificación con capturas a 375 px.
- **Tipos regenerados con diff ajeno**: si otra spec cambió el esquema sin regenerar, aparecerían cambios que no son de esta. Mitigación: revisar el diff; si hay cambios ajenos, se dejan fuera de esta spec y se avisa.
- **Aviso previo de seguridad**: `get_advisors` ya muestra `public.rls_auto_enable()`. Mitigación: se compara con ese aviso existente, que no es de ninguna spec.
- **Lint global roto por archivos ajenos**: los scripts `test-*.js` de la raíz fallan en `npm run lint`. Mitigación: los criterios usan `npx eslint app lib`.

---

## What is **not** in this spec

- El módulo del juego, el registro en `PLAYABLE` y el guardado (spec `01-frogger-game`).
- Cambios en los textos, la categoría, el color o el orden de la fila `frogger`.
- Eliminar `.cover-rana` o modificar otras portadas.
- Calcular `best` y `plays` desde `scores`.

Cada uno de estos, si se aborda, va en su propia spec.
