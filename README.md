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

1. Crear el módulo en `app/components/games/<id>/` siguiendo el contrato de `app/components/games/types.ts`.
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

### Tetris

| Tecla     | Acción                        |
| --------- | ----------------------------- |
| `←` `→`   | Mover la pieza                |
| `↓`       | Bajar una fila (soft drop)    |
| `↑` / `X` | Rotar                         |
| `Espacio` | Caída instantánea (hard drop) |
| `P`       | Pausar / reanudar             |
| `Enter`   | Reiniciar tras `GAME OVER`    |

El HUD muestra Puntuación, Líneas y Nivel. Tetris está registrado en `PLAYABLE` y su fila ya existe en `public.games` (`tetris`), así que no necesitó migración. Se guarda la puntuación igual que en Asteroids.

### Breakout (Arkanoid)

| Tecla / entrada | Acción                                  |
| --------------- | --------------------------------------- |
| Ratón           | Mover la paleta (sobre el canvas)       |
| `←` `→`         | Mover la paleta                         |
| `P` / `Escape`  | Pausar / reanudar                       |
| `M`             | Silenciar / activar el sonido           |
| `Enter`         | Reiniciar tras `GAME OVER` o tras ganar |

Son 5 niveles, 3 vidas y 10 puntos por bloque; completar el nivel 5 también termina la partida y guarda la marca. El HUD muestra Puntuación, Vidas y Nivel. Breakout está registrado en `PLAYABLE` con el id `breakout`, cuya fila ya existía en `public.games` (portada `cover-bricks`), así que no necesitó migración. Sus assets (spritesheet y sonidos) viven en `public/games/breakout/`.

### Snake

| Tecla           | Acción                                              |
| --------------- | --------------------------------------------------- |
| `←` `↑` `→` `↓` | Cambiar de dirección                                |
| `W` `A` `S` `D` | Cambiar de dirección                                |
| `P` / `Escape`  | Pausar / reanudar                                   |
| `Enter`         | Reiniciar tras `GAME OVER` o tras llenar el tablero |

La serpiente espera la primera flecha para empezar, no puede darse la vuelta de 180° y admite hasta 2 giros pendientes. Cada fruta da 10 puntos y cada 5 frutas sube el nivel (de 8 a 16 pasos por segundo). Chocar con la pared o con el propio cuerpo termina la partida; ocupar las 300 celdas del tablero de 20×15 también, como victoria. El HUD muestra Puntuación y Nivel. Snake está registrado en `PLAYABLE` con el id `snake`, cuya fila ya existía en `public.games` (portada `cover-snake`), así que no necesitó migración. Las frutas se dibujan desde `public/games/snake/fruits.png` (la fila pixel-art del atlas de `references/started-games/05-snake`); la serpiente se dibuja en el canvas porque el atlas no trae sprites suyos.

Atribución: según el comentario de `sprites.js`, las imágenes de las frutas provienen de [The Spriters Resource (Google Snake)](https://www.spriters-resource.com/browser_games/googlesnakegame/). Son gráficos de terceros: revisa el uso permitido antes de publicar el proyecto.

### Frogger

| Tecla           | Acción                     |
| --------------- | -------------------------- |
| `←` `↑` `→` `↓` | Saltar una casilla         |
| `W` `A` `S` `D` | Saltar una casilla         |
| `P` / `Escape`  | Pausar / reanudar          |
| `Enter`         | Reiniciar tras `GAME OVER` |

Cruza la carretera (5 carriles de coches, un deportivo y camiones) y el río (troncos y tortugas) hasta las 5 casillas de la orilla. La rana salta una casilla por pulsación (mantener la tecla no repite) y espera la primera flecha para empezar. Cada rana tiene 30 s (barra de tiempo en el canvas). En el río la rana viaja con su tronco o tortuga: caer al agua, salir arrastrada por un borde, quedarse sobre una tortuga que se sumerge, chocar con un vehículo, caer en el seto o en una casilla ocupada, o agotar el tiempo cuesta una vida.

Puntuación: 10 por cada fila nueva alcanzada, 50 por rana a salvo más `10 × segundos restantes`, 200 extra por la mosca y 1000 por completar las 5 casillas, que sube el nivel (velocidad ×1.15 por nivel, hasta ×2). Empiezas con 3 vidas y ganas una más al llegar a 10 000 puntos; no hay victoria, la partida termina con `GAME OVER`. El HUD muestra Puntuación, Vidas y Nivel. Frogger está registrado en `PLAYABLE` con el id `frogger`, cuya fila ya existía en `public.games`, así que no necesitó migración. Es vectorial, sin assets ni sonido.

### Contrato común de los juegos

Todos los módulos usan `GameCallbacks` y `GameInstance` de `app/components/games/types.ts`. `onScore` y `onGameOver` son obligatorios; `onLives`, `onLevel`, `onLines` y `onPause` son opcionales y el HUD de `GamePlayer` solo muestra las métricas que el juego emite.
