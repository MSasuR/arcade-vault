## Arcade Vault

Es una plataforma para jugar online y competir por la mayor cantidad de puntos.

## Usa Spec Driven Design

Basado en /spec y /spec-impl

Siguiendo las buenas practicas recomendadas aquí:
https://github.com/Klerith/fernando-skills

## Skills usadas

```bash
npx skills@latest add Klerith/fernando-skills
```

## Supabase

La autenticación usa Supabase Auth (email + contraseña) y la tabla `public.profiles` para el nombre de usuario. El esquema está versionado en `supabase/migrations/`.

Variables de entorno requeridas en `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
```

Ajuste manual en el dashboard de Supabase (no se puede versionar):

- **Authentication → Providers → Email → "Confirm email": desactivado** en desarrollo, para que el registro inicie sesión de inmediato.
- **Actívalo antes de producción.** Con la confirmación desactivada se pueden registrar cuentas con correos ajenos, y al activarla habrá que añadir la ruta `/auth/confirm`.

### Catálogo, puntuaciones y ranking

| Objeto               | Descripción                                                                                                                      |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `public.games`       | Catálogo de juegos (lectura pública, sin políticas de escritura). Se lee en servidor con `lib/games.ts` (`getGames`, `getGame`). |
| `public.scores`      | Una fila por partida guardada. `select` público; `insert` solo autenticado y con su propio `user_id`; sin `update` ni `delete`.  |
| `public.leaderboard` | Vista con la mejor marca de cada jugador por juego (`security_invoker`). Se consulta en cliente con `lib/leaderboard.ts`.        |

El ranking ordena por `score` descendente y, en empate, gana quien lo logró antes. `best` y `plays` de `games` son valores estáticos, no se calculan desde `scores`. La clave `av_scores` de localStorage ya no se usa (se elimina al cargar la app).

Para añadir un juego al catálogo hay que crear una migración en `supabase/migrations/` con su `insert` en `public.games` (el `id` es la ruta y la clave de `PLAYABLE`). Sin esa fila, guardar puntuaciones de ese juego falla por la FK de `scores.game_id`.

## Juegos jugables

Los juegos viven en `app/components/games/<id>/` como módulos TypeScript que exponen una función `create<Juego>(canvas, callbacks)` y devuelven un objeto con `pause()`, `resume()`, `getScore()` y `destroy()`. `GamePlayer` monta el canvas y conecta el HUD, la pausa y el guardado de puntuación.

Para activar un juego nuevo:

1. Crear el módulo en `app/components/games/<id>/` siguiendo el contrato de `asteroids/types.ts`.
2. Añadirlo a `public.games` con una migración (ver arriba) y registrarlo en `app/components/games/registry.ts` (`PLAYABLE`) con el mismo `id`.

Los juegos sin entrada en `PLAYABLE` siguen mostrando el placeholder "JUEGO AQUÍ".

### Asteroids

| Tecla     | Acción                                |
| --------- | ------------------------------------- |
| `←` `→`   | Rotar nave                            |
| `↑`       | Propulsar                             |
| `Espacio` | Disparar / reiniciar tras `GAME OVER` |
| `P`       | Pausar / reanudar                     |

La partida se pausa sola al cambiar de pestaña. Con sesión iniciada, la puntuación se guarda en `public.scores` al llegar a `GAME OVER` o al pulsar TERMINAR.
