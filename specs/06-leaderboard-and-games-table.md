# Leaderboard Real y Tabla de Juegos en Supabase

**State:** Implemented  
**Depends on:** SPEC 01 (Arcade Vault MVP), SPEC 04 (Supabase Auth, `profiles`, `useUser()`), SPEC 05 (Asteroids, `GamePlayer` con guardado de puntuación)  
**Date:** 2026-09-30  
**Objective:** Mover el catálogo `GAMES` a una tabla `games` de Supabase y guardar las puntuaciones en una tabla `scores` que alimente el Salón de la Fama y el ranking del detalle de cada juego, reemplazando los datos falsos de `seededScores` y `av_scores`.

---

## Scope

**Está incluido:**

- Tabla `public.games` sembrada con los 8 juegos actuales de `app/data.ts` (mismos valores, incluidos `best` y `plays` estáticos), con RLS de solo lectura pública
- Tabla `public.scores` con FK a `games` y a `profiles`, con RLS: `select` público, `insert` solo autenticado y solo con su propio `user_id`, sin `update` ni `delete`
- Vista `public.leaderboard` con la mejor marca de cada jugador por juego, unida a `profiles.username`
- Migraciones versionadas en `supabase/migrations/` y tipos regenerados en `lib/supabase/database.types.ts`
- `lib/games.ts` (servidor): `getGames()` y `getGame(id)` con el cliente de `lib/supabase/server.ts`
- `lib/leaderboard.ts` (cliente): `getTopScores(gameId, limit)` y `getUserBest(userId, gameId)` con el cliente de `lib/supabase/client.ts`
- Las páginas leen `games` en servidor y pasan los datos por props a `Library`, `GamesPreviewSection`, `GameDetail`, `GamePlayer` y `HallOfFame`
- Salón de la Fama real: top 10 por juego (una marca por jugador), podio, y "tu mejor marca" con rango real
- Ranking real en `GameDetail` en lugar de `seededScores`
- `GamePlayer` guarda la puntuación en `scores` (solo con sesión y `score > 0`) en lugar de `av_scores`
- Estados de carga, vacío y error en el ranking
- Limpieza de la clave legacy `av_scores` de localStorage
- Eliminar `GAMES` y `seededScores` de `app/data.ts` (se conserva `CATS` y la interfaz `Game`)
- Documentar el esquema y el flujo en `README.md`

**NO está incluido:**

- Calcular `best` y `plays` desde `scores`: siguen siendo columnas sembradas y estáticas
- Migrar las entradas existentes de `av_scores`; se descartan
- Guardar puntuaciones de invitados
- Filtros por periodo (semanal, mensual) o ranking global entre juegos
- Validación anti-trampas, RPC `submit_score` o Edge Function (el insert es directo con RLS)
- Panel de administración para crear o editar juegos (el catálogo se cambia con migraciones)
- Portar otros juegos jugables; solo Asteroids genera puntuaciones
- Realtime o actualización en vivo del ranking
- Perfil público de jugador o historial personal de partidas
- Uso de `"use cache"` / Cache Components para el catálogo
- Pruebas automatizadas (el repo no tiene framework de tests)

---

## Data Model

Nueva tabla `public.games` (proyecto Supabase `xudaktpzdqfphuaegjmo`):

```sql
create table public.games (
  id          text primary key check (id ~ '^[a-z0-9-]+$'),
  title       text not null,
  short_desc  text not null,
  long_desc   text not null,
  category    text not null,
  cover       text not null,
  color       text,
  best        integer not null default 0,
  plays       integer not null default 0,
  sort_order  integer not null unique
);
```

- `id` conserva los ids actuales (`galaga`, `tetris`, `snake`, `frogger`, `pacman`, `asteroids`, `duel`, `breakout`), porque son las rutas `/games/[id]` y `/player/[id]` y las claves de `PLAYABLE`.
- `sort_order` (1–8) reproduce el orden actual del arreglo; `GamesPreviewSection` usa los 6 primeros.
- RLS activado: `select` público (`anon` y `authenticated`); sin políticas de escritura. Los datos se siembran en la migración.

Nueva tabla `public.scores`:

```sql
create table public.scores (
  id         uuid primary key default gen_random_uuid(),
  game_id    text not null references public.games (id) on delete cascade,
  user_id    uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  score      integer not null check (score > 0),
  created_at timestamptz not null default now()
);

create index scores_game_score_idx on public.scores (game_id, score desc);
```

- RLS activado:
  - `select`: público (`anon` y `authenticated`).
  - `insert`: solo `authenticated` con `with check (auth.uid() = user_id)`.
  - `update` / `delete`: sin política.
- `user_id` referencia `profiles(id)` (no `auth.users`) para poder unir `username` desde la vista.

Vista `public.leaderboard` (mejor marca por jugador y juego):

```sql
create view public.leaderboard with (security_invoker = true) as
select distinct on (s.game_id, s.user_id)
       s.game_id, s.user_id, p.username, s.score, s.created_at
from public.scores s
join public.profiles p on p.id = s.user_id
order by s.game_id, s.user_id, s.score desc, s.created_at asc;
```

Tipos consumidos por la UI (la interfaz `Game` de `app/data.ts` no cambia; `getGames()` renombra columnas con alias de PostgREST):

```typescript
// app/data.ts (se mantiene)
export interface Game {
  id: string;
  title: string;
  short: string; // games.short_desc
  long: string; // games.long_desc
  cat: string; // games.category
  cover: string;
  best: number;
  plays: number;
  color?: string;
}

// lib/leaderboard.ts
export interface LeaderboardEntry {
  rank: number; // posición 1-based en el top, o rango real en getUserBest
  username: string;
  score: number;
  createdAt: string; // ISO
}
```

Convenciones:

- Orden del ranking: `score` descendente y, en empate, `created_at` ascendente (gana quien llegó antes).
- Rango real de "tu mejor marca" = `1 +` número de filas de `leaderboard` del mismo juego con `score` mayor.
- Fechas mostradas con `toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit", year: "2-digit" })`, como hoy.
- Puntuaciones mostradas con `toLocaleString("es-ES")`.

---

## Implementation Plan

1. **Migración de `games`**
   - Crear `supabase/migrations/<timestamp>_create_games.sql` con la tabla, RLS y el `insert` de los 8 juegos con los valores actuales de `app/data.ts`
   - Aplicarla con la herramienta MCP `apply_migration`; ejecutar `get_advisors` (security) y resolver los avisos de esta migración
   - Regenerar tipos con `generate_typescript_types` en `lib/supabase/database.types.ts`
   - El sitio sigue funcionando igual (nada la consume aún)

2. **Migración de `scores` y `leaderboard`**
   - Crear `supabase/migrations/<timestamp>_create_scores_and_leaderboard.sql` con tabla, índice, políticas RLS y vista
   - Aplicarla con `apply_migration`, ejecutar `get_advisors` y regenerar tipos
   - Comprobar con `execute_sql` que un insert sin sesión falla y que la vista devuelve una fila por jugador y juego (con datos de prueba borrados después)
   - El sitio sigue funcionando igual

3. **Lectura del catálogo en servidor**
   - Consultar la doc local de Next en `node_modules/next/dist/docs/` (Server Components, `cookies` asíncronas y params asíncronos) antes de tocar las páginas
   - Crear `lib/games.ts` con `getGames()` (ordenado por `sort_order`) y `getGame(id)` que devuelve `null` si no existe
   - Sin uso todavía; `npm run build` compila

4. **Biblioteca y home desde la BD**
   - `app/(app)/games/page.tsx` y `app/page.tsx` llaman `getGames()` y pasan `games` por props a `Library` y `GamesPreviewSection`
   - Ambos componentes dejan de importar `GAMES`
   - `/` y `/games` se ven igual que antes

5. **Detalle y reproductor desde la BD**
   - `app/(app)/games/[id]/page.tsx` y `app/(app)/player/[id]/page.tsx` llaman `getGame(id)` (con `await params`) y pasan `game` por props a `GameDetail` y `GamePlayer`
   - Un `id` inexistente mantiene el comportamiento actual de la app
   - Se elimina `useMemo(() => GAMES.find(...))` en ambos componentes; `seededScores` sigue en `GameDetail` hasta el paso 8

6. **Salón de la Fama: catálogo desde la BD**
   - `app/(app)/salon/page.tsx` llama `getGames()` y pasa `games` por props a `HallOfFame`, que usa `games[0].id` como pestaña inicial y elimina `GAMES`
   - `seededScores` sigue en uso hasta el paso 7
   - Eliminar `GAMES` de `app/data.ts` (solo `Game`, `CATS` y `seededScores` permanecen)

7. **Ranking real en el Salón de la Fama**
   - Crear `lib/leaderboard.ts` con `getTopScores(gameId, limit)` (consulta a `leaderboard` con `order('score', desc)` y `order('created_at', asc)`) y `getUserBest(userId, gameId)` (mejor marca y rango real, o `null`)
   - `HallOfFame` carga el top 10 del juego de la pestaña activa con `useEffect` y muestra estados: cargando, vacío ("AÚN NO HAY MARCAS. SÉ EL PRIMERO."), error ("NO SE PUDO CARGAR EL RANKING")
   - El podio se rellena con las 3 primeras entradas; los puestos sin jugador muestran `---`
   - "Tu mejor marca" usa `getUserBest` con `useUser()`; si el usuario no tiene marca en ese juego muestra "AÚN SIN MARCA" en lugar de una fila inventada
   - Descartar respuestas obsoletas al cambiar de pestaña rápido (bandera de cancelación en el effect)

8. **Ranking real en `GameDetail`**
   - Reemplazar `seededScores` por `getTopScores(game.id, N)` con el mismo número de filas que muestra hoy y los mismos estados de carga, vacío y error
   - Eliminar `seededScores` y `LeaderboardEntry` de `app/data.ts`; `app/data.ts` conserva solo `Game` y `CATS`

9. **Guardado de puntuaciones en `scores`**
   - En `GamePlayer`, `saveScore(score)` inserta `{ game_id: game.id, score }` con el cliente de navegador (`user_id` lo rellena el default `auth.uid()`), solo si hay `user` y `score > 0`
   - Si el insert falla, `savedRef` permanece en `false` para que TERMINAR reintente, y se registra el error en consola; el juego no se interrumpe
   - Se mantiene la lógica de `savedRef` de SPEC 05 (un guardado por partida, se reinicia con `Espacio`)
   - `AppLayout` elimina `av_scores` de localStorage al montar, junto a `av_user`
   - Comprobar manualmente: partida completa con sesión y ver la fila en `scores` con `execute_sql`

10. **Documentación**
    - `README.md`: esquema de `games`, `scores` y `leaderboard`, cómo añadir un juego (migración con `insert` en `games` + entrada en `PLAYABLE`) y que `av_scores` ya no se usa

---

## Acceptance Criteria

- [ ] `npm run build` y `npm run lint` terminan sin errores
- [ ] `list_tables` muestra `public.games` y `public.scores` con RLS activado, y existe la vista `public.leaderboard`
- [ ] `public.games` contiene exactamente 8 filas con los ids, títulos, categorías, `best` y `plays` actuales de `app/data.ts`
- [ ] Existen `supabase/migrations/*_create_games.sql` y `supabase/migrations/*_create_scores_and_leaderboard.sql` versionados, y `lib/supabase/database.types.ts` incluye `games`, `scores` y `leaderboard`
- [ ] `get_advisors` (security) no reporta avisos nuevos originados por `games`, `scores` ni `leaderboard`
- [ ] Un cliente anónimo puede hacer `select` en `games`, `scores` y `leaderboard`, pero no `insert`, `update` ni `delete` en ninguna de las tres
- [ ] Un usuario autenticado no puede insertar en `scores` con un `user_id` distinto al suyo, ni actualizar ni borrar filas de `scores`
- [ ] Un insert en `scores` con `score <= 0` o con un `game_id` inexistente es rechazado por la BD
- [ ] `app/data.ts` ya no exporta `GAMES` ni `seededScores`, y ningún archivo del repo los importa
- [ ] `/`, `/games`, `/games/[id]`, `/player/[id]` y `/salon` muestran los mismos 8 juegos, en el mismo orden y con el mismo contenido que antes de la spec
- [ ] La home muestra los 6 primeros juegos por `sort_order`
- [ ] Un `id` inexistente en `/games/[id]` y `/player/[id]` mantiene el comportamiento previo a esta spec
- [ ] Con sesión iniciada, llegar a `GAME OVER` en Asteroids con score > 0 inserta una fila en `scores` con `game_id = 'asteroids'`, el `user_id` del usuario y el score real
- [ ] Llegar a `GAME OVER` y pulsar TERMINAR no crea una segunda fila
- [ ] TERMINAR a mitad de partida con sesión y score > 0 inserta una fila con el score actual
- [ ] Como invitado, terminar una partida no inserta nada en `scores`
- [ ] Si el insert falla, la consola registra el error, el juego sigue funcionando y TERMINAR reintenta el guardado
- [ ] `/salon` en la pestaña Asteroids muestra el top 10 de `leaderboard` en orden de score descendente, una sola entrada por jugador aunque tenga varias partidas
- [ ] En un empate de score, aparece primero quien lo logró antes
- [ ] El podio muestra `---` en los puestos sin jugador cuando hay menos de 3 marcas
- [ ] Una pestaña sin marcas muestra "AÚN NO HAY MARCAS. SÉ EL PRIMERO." y ninguna fila falsa
- [ ] Con sesión y una marca en el juego, "tu mejor marca" muestra tu mejor score y tu rango real; sin marca muestra "AÚN SIN MARCA"; sin sesión no se muestra la sección
- [ ] Cambiar de pestaña rápidamente en `/salon` deja siempre el ranking del juego seleccionado (no el de una respuesta anterior)
- [ ] Con la red bloqueada, el ranking muestra "NO SE PUDO CARGAR EL RANKING" en lugar de romper la página
- [ ] `/games/asteroids` muestra el ranking real del juego y no nombres inventados (`PHOENIX`, `VORTEX`, etc.)
- [ ] La clave `av_scores` ya no existe en localStorage tras cargar la app
- [ ] `/`, `/games`, `/about` cargan sin sesión y sin errores en consola
- [ ] El formulario de contacto de `/about` y el login/registro de `/auth` siguen funcionando

---

## Decisions Taken and Discarded

| Decisión                                                         | Razón                                                                                                                               |
| ---------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| **Tabla `games` en BD y no solo como FK**                        | Una sola fuente de verdad; `scores.game_id` tiene integridad referencial y añadir un juego es una migración, no un cambio de UI     |
| **Descartado: mantener `GAMES` en `data.ts` y `games` solo FK**  | Dos fuentes de verdad que se desincronizan al añadir un juego                                                                       |
| **`id` de texto (`asteroids`) como PK de `games`**               | Ya es la ruta, la clave de `PLAYABLE` y el `gameId` de las puntuaciones; un uuid obligaría a mapear en todas partes                 |
| **`best` y `plays` sembrados y estáticos**                       | Alcance mínimo pedido: hacerlos reales implica contadores atómicos o agregados; queda para otra spec                                |
| **Columnas `short_desc`/`long_desc`/`category` con alias**       | Evita palabras reservadas o ambiguas en SQL y `getGames()` mapea a la interfaz `Game`, sin tocar los componentes                    |
| **`sort_order` explícito**                                       | El orden actual del arreglo importa (`slice(0, 6)` en la home); un select sin orden en Postgres no lo garantiza                     |
| **`scores` guarda todas las partidas; la vista filtra la mejor** | Conserva historial para futuras estadísticas sin coste extra; el ranking muestra una marca por jugador                              |
| **Vista `leaderboard` con `security_invoker`**                   | Respeta las políticas RLS de `scores` y `profiles` del usuario que consulta, sin exponer datos por la vista                         |
| **Descartado: RPC `get_leaderboard(game_id)`**                   | Más SQL para el mismo resultado; la vista se consulta con filtros de PostgREST y es más simple                                      |
| **Descartado: agrupar en cliente**                               | Traería todas las filas de `scores`; no escala                                                                                      |
| **Insert directo con RLS (`user_id = auth.uid()`)**              | Suficiente para impedir la suplantación; sin anticheat porque el juego corre en el navegador y no hay una autoridad que valide      |
| **Descartado: RPC `submit_score` y Edge Function**               | Validar un score generado en el cliente exige lógica por juego que aún no existe; se aborda si el ranking se vuelve competitivo     |
| **`user_id` con `default auth.uid()`**                           | El cliente no envía el `user_id`, y no puede falsearlo aunque quiera; la política `with check` lo refuerza                          |
| **FK de `scores.user_id` a `profiles(id)`**                      | Permite unir `username` en la vista y en embeds de PostgREST; `profiles.id` ya referencia `auth.users` con `on delete cascade`      |
| **Sin `update` ni `delete` en `scores`**                         | Las puntuaciones son un registro inmutable; corregirlas se hace desde el dashboard                                                  |
| **`av_scores` se descarta sin migrar**                           | Los datos locales eran de pruebas de una sola sesión y sin verificar; migrarlos añadiría deduplicación y confianza en datos locales |
| **Invitados no guardan**                                         | `scores.user_id` es obligatorio y es la base del ranking por jugador; coincide con el comportamiento de SPEC 05                     |
| **Catálogo por Server Components; ranking por cliente**          | El catálogo es estático y no depende del usuario; el ranking depende de la pestaña y de `useUser()`, que ya son estado de cliente   |
| **Descartado: `"use cache"` para el catálogo**                   | Añade invalidación y una convención nueva de Next 16 para 8 filas que cambian solo con migraciones                                  |
| **Descartado: hook `useGames()`**                                | Provocaría parpadeo de carga en todas las pantallas para datos que el servidor puede entregar ya renderizados                       |
| **Ranking también en `GameDetail`**                              | Al eliminar `seededScores` es la única forma de no dejar nombres falsos en esa pantalla                                             |
| **Sin filtros de periodo ni ranking global**                     | Cada uno multiplica consultas y UI; se aborda en otra spec si hay demanda                                                           |
| **Desempate por fecha ascendente**                               | Criterio arcade estándar: quien alcanza primero el score lo conserva                                                                |

---

## Identified Risks

- **Score falso desde el cliente**: cualquier usuario autenticado puede insertar un score arbitrario con la API. Mitigación: aceptado en esta spec y documentado; la RLS solo garantiza la identidad. Si el ranking se vuelve competitivo, se migra a un RPC con validación (otra spec).
- **Pérdida de datos locales**: al borrar `av_scores` se pierden las marcas locales previas. Mitigación: decisión explícita; eran datos de prueba sin verificar y no alimentaban ningún ranking.
- **Vista con `distinct on` lenta con muchos datos**: el coste crece con `scores`. Mitigación: el índice `(game_id, score desc)` y el volumen esperado lo hacen irrelevante ahora; se revisa con `get_advisors` de rendimiento si crece.
- **`security_invoker` y RLS de `profiles`**: la vista depende de que `profiles` mantenga `select` público (SPEC 04). Mitigación: criterio de aceptación con cliente anónimo; si `profiles` se hace privado, la vista dejará de devolver filas.
- **Seed desalineado con `data.ts`**: un error al copiar los 8 juegos cambia el catálogo visible. Mitigación: criterio de aceptación que compara filas y contenido antes y después.
- **Juego sin fila en `games`**: si `PLAYABLE` incluye un id ausente en la tabla, el insert en `scores` falla por FK. Mitigación: el README exige la migración del juego antes de registrarlo; el error se registra sin romper la partida.
- **Convención de Next 16**: las páginas usan params asíncronos y `cookies()` del cliente server vuelve dinámicas las rutas. Mitigación: leer la doc local en `node_modules/next/dist/docs/` antes del paso 3 y verificar que `/games` y `/` siguen cargando sin errores.
- **Respuestas de ranking fuera de orden**: cambiar de pestaña rápido puede pintar el top de otro juego. Mitigación: bandera de cancelación en el `useEffect` y criterio de aceptación explícito.
- **Regresión en la carga inicial**: pasar de datos síncronos a un fetch en servidor puede romper la home si Supabase no responde. Mitigación: `getGames()` lanza el error y la ruta muestra el `error.tsx` de Next en lugar de una página vacía; verificar manualmente con las variables de entorno inválidas.

---

## What is **not** in this spec

- `best` y `plays` calculados desde `scores`.
- Migración de las puntuaciones de `av_scores` o guardado para invitados.
- Filtros por periodo, ranking global, realtime o perfil público de jugador.
- Validación anti-trampas (RPC o Edge Function).
- Panel de administración de juegos.
- Portar otros juegos jugables (cada uno tendrá su spec).
- Cache Components / `"use cache"`.
- Pruebas automatizadas.

Cada uno de estos, si se aborda, va en su propia spec.
