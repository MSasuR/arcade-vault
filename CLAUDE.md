# CLAUDE.md

Guía para Claude Code (claude.ai/code) al trabajar en este repositorio.

@AGENTS.md

Arcade Vault es una plataforma de juegos arcade retro con cuentas de usuario y leaderboard: Next.js 16 (App Router) + TypeScript + Tailwind CSS v4 + Supabase. La interfaz, las specs y la documentación están en español.

## Comandos

- `npm run dev` — servidor de desarrollo (Turbopack) en http://localhost:3000
- `npm run build` — build de producción
- `npm run start` — sirve el build de producción
- `npm run lint` — ESLint (flat config: `eslint-config-next` core-web-vitals + TypeScript)
- `npm run format` — Prettier sobre todo el repo

`npm run lint` **falla por archivos ajenos a la app** (scripts sueltos de la raíz: `test-*.js`, `verify-design.js`). Para validar el código de la app usa `npx eslint app lib` y `npx tsc --noEmit`.

No hay framework de tests. Las verificaciones se hacen con `npm run build`, scripts de Node sobre la lógica pura de los juegos (compilada con `tsc` a un directorio temporal) y pruebas en navegador con Playwright.

## Flujo de trabajo (spec-driven)

Todo cambio relevante pasa por una spec en `specs/NN-slug.md` (`01` a `10` existen hoy). **No escribas código de una feature sin spec aprobada.**

| Skill                        | Uso                                                                                                                            |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `/spec <descripción>`        | Diseña una spec haciendo preguntas primero; la guarda en `Draft`                                                               |
| `/spec-impl NN-slug`         | Implementa una spec en estado `Approved`: crea la rama `spec-NN-slug` y avanza paso a paso                                     |
| `/add-game <carpeta o idea>` | Genera la spec para llevar un juego a la plataforma (desde `references/started-games/` o desde cero), con leaderboard incluido |
| `/frontend-design`           | **Úsala siempre** para diseñar interfaz de usuario (incluidas las portadas `.cover-<id>` de los juegos)                        |

Reglas del flujo:

- El cambio de estado (`Draft` → `Approved` → `Implemented`) lo hace **el usuario**, nunca el agente.
- `/spec-impl` se detiene si el árbol de trabajo no está limpio y pregunta qué hacer; no hace stash ni commit por su cuenta.
- **Nunca hagas commits automáticamente**; solo si el usuario lo pide.
- `specs/.spec-config.yml` → `AutoCreateBranch: true` (la rama se crea sin preguntar).
- `/add-game` usa `.claude/skills/add-game/reference.md` (contrato técnico para integrar juegos) y `spec-skeleton.md` (estructura de la spec). Si cambia la forma de integrar juegos, actualiza `reference.md`.
- `/spec` y `/spec-impl` vienen de `Klerith/fernando-skills` (`skills-lock.json`).

### Subagentes (`.claude/agents/`)

| Agente         | Uso                                                                                                                      |
| -------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `game-planner` | Planifica y decide qué juego encaja en la plataforma; propone 1–3 candidatos puntuados y un brief listo para `/add-game` |

- Flujo para un juego nuevo: `game-planner` (elige) → `/add-game <brief>` (spec en `Draft`) → el usuario aprueba → `/spec-impl NN-slug`.
- Registra cada sugerencia en `references/game-suggestions-todo.md` (Pendientes / En curso / Hechos / Descartados) y la sincroniza con `specs/` y `PLAYABLE` al arrancar.
- Memoria persistente propia (`memory: project`) en `.claude/agent-memory/game-planner/`: preferencias del usuario y motivos de descarte, para no repetir sugerencias.
- Solo lee (Supabase solo `select`); no escribe código, specs ni commits.

| Agente     | Uso                                                                                                                                   |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `game-jam` | Recibe un tema y diseña un juego con 2 specs completas en `Draft` en `specs/game-jam/<id>/`: `01-<id>-game.md` y `02-<id>-catalog.md` |

- Flujo: `game-jam <tema>` → el usuario revisa las specs → las mueve/renumera a `specs/NN-…` → las aprueba → `/spec-impl NN-slug`.
- `specs/game-jam/` es la única excepción a la numeración `NN-slug` de `specs/`.
- Decide sin preguntar (justifica en `Decisions Taken and Discarded`); solo escribe en `specs/game-jam/` y nunca sobrescribe.

| Agente          | Uso                                                                                                                                  |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `skin-designer` | Audita e implementa los 3 skins del canvas de cada juego (`classic` por defecto, `neon`, `retro`) y que todos se vean bien en oscuro |

- Flujo: `skin-designer` audita (matriz juego × skin) → sin spec aprobada escribe `specs/NN-game-skins.md` en `Draft` y se detiene → el usuario aprueba → `skin-designer` implementa (o `/spec-impl NN-game-skins`).
- Con la spec base ya implementada, añade los skins de juegos nuevos sin spec propia (mismo contrato) y lo reporta.
- Checklist de modo oscuro medida con contraste WCAG (texto ≥ 4.5:1, elementos de juego ≥ 3:1); capturas en `.playwright-screenshots/skins/`.
- Skin persistido en `localStorage` (`av_skin`); solo cambia el canvas, no la UI global. Memoria propia en `.claude/agent-memory/skin-designer/`. No hace commits.

## Arquitectura

### Rutas (`app/`)

| Ruta                | Archivo                          | Componente                                                                              |
| ------------------- | -------------------------------- | --------------------------------------------------------------------------------------- |
| `/`                 | `app/page.tsx`                   | Secciones de `app/components/home/` (+ `RevealObserver` para las animaciones `.reveal`) |
| `/games`            | `app/(app)/games/page.tsx`       | `Library` (catálogo con búsqueda y categorías)                                          |
| `/games/[id]`       | `app/(app)/games/[id]/page.tsx`  | `GameDetail` (ficha + ranking del juego)                                                |
| `/player/[id]`      | `app/(app)/player/[id]/page.tsx` | `GamePlayer` (canvas del juego, HUD, pausa, guardado)                                   |
| `/salon`            | `app/(app)/salon/page.tsx`       | `HallOfFame` (top 10 por juego, podio, tu mejor marca)                                  |
| `/auth`             | `app/(app)/auth/page.tsx`        | `Auth` (registro / login / invitado)                                                    |
| `/about`            | `app/about/page.tsx`             | About + formulario de contacto                                                          |
| `POST /api/contact` | `app/api/contact/route.ts`       | Envía el formulario por Resend                                                          |

- Las páginas son **Server Components** que leen el catálogo con `getGames()` / `getGame(id)` (`lib/games.ts`) y pasan los datos por props a componentes cliente (`"use client"`). `GamePlayer` se monta con `key={id}` para reiniciar su estado al cambiar de juego.
- El layout raíz (`app/layout.tsx`) usa las fuentes Press Start 2P, JetBrains Mono y Courier Prime (`next/font/google`) y envuelve todo en `AppLayout` (nav, sesión, limpieza de claves legacy de `localStorage`).
- Estilos globales en `app/globals.css` (variables de color `--cyan`, `--magenta`, `--yellow`, `--green`, etc.; portadas `.cover-*`). Alias `@/*` → raíz del repo.
- `app/data.ts` solo conserva la interfaz `Game` y `CATS`; el catálogo vive en la base de datos.

### Supabase

- Clientes: `lib/supabase/client.ts` (navegador), `lib/supabase/server.ts` (servidor, cookies). `proxy.ts` + `lib/supabase/proxy.ts` refrescan la sesión en cada request (no protegen rutas; el modo invitado está permitido).
- Variables en `.env.local`: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (y `RESEND_API_KEY` para el contacto).
- Auth: email + contraseña. `useUser()` (`app/components/useUser.ts`) devuelve `{ user: { id, name }, loading, signOut }`, con `name` = `profiles.username`.
- Esquema (migraciones en `supabase/migrations/`):
  - `profiles` — `username` único en mayúsculas (3–10 `A-Z0-9_`); se crea por trigger al registrarse.
  - `games` — catálogo (`id` texto = ruta y clave de `PLAYABLE`, `sort_order`, `cover` = clase CSS; `best`/`plays` son estáticos).
  - `scores` — una fila por partida; `insert` solo autenticado y con su propio `user_id` (`default auth.uid()`), sin `update`/`delete`.
  - `leaderboard` — vista (`security_invoker`) con la mejor marca por jugador y juego; la consume `lib/leaderboard.ts` (`getTopScores`, `getUserBest`) en cliente.
- Cambios de esquema: nueva migración versionada → herramienta MCP `apply_migration` → `get_advisors` (security) → `generate_typescript_types` a `lib/supabase/database.types.ts`. El aviso sobre `public.rls_auto_enable()` ya existía y no es de ninguna spec.

### Juegos (`app/components/games/`)

- Contrato común en `types.ts`: `createX(canvas, callbacks: GameCallbacks, options?: GameOptions): GameInstance`. `onScore` y `onGameOver` son obligatorios; `onLives`, `onLevel`, `onLines` y `onPause` son opcionales. `GameInstance` expone `pause`, `resume`, `getScore`, `destroy` y, en los juegos con skins, `setSkin`.
- Skins del canvas (spec 10): `skins.ts` define `SkinId` (`classic` por defecto, `neon`, `retro`); cada juego con skins tiene `<id>/skins.ts` (`PALETTES`, único archivo con colores), recibe `options.skin` y cambia la paleta en caliente con `setSkin`. Los sprites se tiñen con `spriteTint.ts` en un canvas offscreen cacheado por skin (Breakout en `neon` y `retro`; las frutas de Snake solo en `retro`); `classic` usa la imagen original. `SKINNABLE` (`registry.ts`) decide en qué juegos `GamePlayer` muestra el selector; el skin se persiste en `localStorage` (`av_skin`) con el hook `useSkin`. Requisitos y checklist de modo oscuro en `.claude/skills/add-game/reference.md` (sección 11).
- `registry.ts` → `PLAYABLE: Record<id, GameFactory>`. Los ids sin entrada muestran el placeholder "JUEGO AQUÍ" en `GamePlayer`.
- `GamePlayer` muestra en el HUD solo las métricas que el juego emite y guarda la puntuación en `scores` **solo con sesión y `score > 0`**, al fin de partida o con TERMINAR, una vez por partida (`savedRef`; se rearma cuando el juego emite nivel 1 al reiniciar).
- Reglas de los módulos: estado en el closure (sin globals), `window`/`document`/`Image`/`Audio` solo dentro de `createX`, `dt` en segundos con tope de 0.05 s, canvas lógico fijo (800×600) escalado por CSS, `destroy()` idempotente (compatible con Strict Mode), `preventDefault` solo en teclas del juego, pausa con `P` y al ocultar la pestaña, `Enter` para reiniciar tras el fin de partida (salvo Asteroids, que usa `Espacio`).
- Assets estáticos de cada juego en `public/games/<id>/`.

| id          | Spec | Métricas del HUD            | Skins        | Notas                                                                  |
| ----------- | ---- | --------------------------- | ------------ | ---------------------------------------------------------------------- |
| `asteroids` | 05   | Puntuación / Vidas / Nivel  | Sí (spec 10) | Vectorial, sin assets                                                  |
| `tetris`    | 07   | Puntuación / Líneas / Nivel | Sí (spec 10) | 8 piezas (incluida la tuerca N), paleta neón                           |
| `breakout`  | 08   | Puntuación / Vidas / Nivel  | Sí (spec 10) | Port de Arkanoid: spritesheet, sonidos (`M` silencia), ratón + teclado |
| `snake`     | 09   | Puntuación / Nivel          | Sí (spec 10) | Juego nuevo con el atlas de frutas de `05-snake`                       |

`galaga`, `frogger`, `pacman` y `duel` están en `games` pero aún sin módulo. Para añadir un juego usa `/add-game`.

## Convenciones y avisos

- Responde al usuario en español.
- `references/` es **solo lectura** (juegos de partida y plantillas de diseño); nunca se modifica, **salvo `references/game-suggestions-todo.md`**, que mantiene el agente `game-planner`.
- Formularios con validación propia: añade `noValidate` al `<form>` (un `input type="email"` bloquea el submit si no).
- El contacto envía desde `onboarding@resend.dev` porque no hay dominio verificado en Resend.
- Hook PostToolUse (`.claude/hooks/format-on-write.ps1`): aplica Prettier (y `eslint --fix` en `.tsx`/`.jsx`) a los `.tsx`, `.jsx` y `.md` que se crean o editan. Los `.ts` no se formatean solos; **no pases Prettier a archivos `.ts` existentes** (genera diffs de formato ajenos al cambio).
- Capturas de Playwright en `.playwright-screenshots/` (no en `.playwright-mcp/`).
- Las claves legacy `av_user` y `av_scores` de `localStorage` se eliminan al cargar la app; no las reutilices.

## Next.js 16

Esta versión va por delante de los datos de entrenamiento: consulta `node_modules/next/dist/docs/` antes de escribir código de rutas, caché o carga de datos.

- Las props de rutas se tipan con helpers generados por Next (`PageProps<"/games/[id]">`, `LayoutProps<"/">`) y `params` es asíncrono (`const { id } = await params`).
- El middleware se llama **Proxy** (`proxy.ts`, no `middleware.ts`).
- Existe un modelo de caché nuevo ("Cache Components" / `"use cache"`); este repo **no** lo usa (el catálogo se lee en servidor en cada request).
