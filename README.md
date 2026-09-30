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

## Juegos jugables

Los juegos viven en `app/components/games/<id>/` como módulos TypeScript que exponen una función `create<Juego>(canvas, callbacks)` y devuelven un objeto con `pause()`, `resume()`, `getScore()` y `destroy()`. `GamePlayer` monta el canvas y conecta el HUD, la pausa y el guardado de puntuación.

Para activar un juego nuevo:

1. Crear el módulo en `app/components/games/<id>/` siguiendo el contrato de `asteroids/types.ts`.
2. Registrarlo en `app/components/games/registry.ts` (`PLAYABLE`) con el mismo `id` que tiene en `app/data.ts`.

Los juegos sin entrada en `PLAYABLE` siguen mostrando el placeholder "JUEGO AQUÍ".

### Asteroids

| Tecla     | Acción                                |
| --------- | ------------------------------------- |
| `←` `→`   | Rotar nave                            |
| `↑`       | Propulsar                             |
| `Espacio` | Disparar / reiniciar tras `GAME OVER` |
| `P`       | Pausar / reanudar                     |

La partida se pausa sola al cambiar de pestaña. Con sesión iniciada, la puntuación se guarda en `av_scores` (localStorage) al llegar a `GAME OVER` o al pulsar TERMINAR.
